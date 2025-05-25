<?php
/**
 * Plugin Name: Yakkt Campervan Configurator
 * Description: Custom plugin to embed the Next.js campervan configurator, add to WooCommerce cart, and process orders.
 * Version: 2.0
 * Author: Yakkt
 * Text Domain: yakkt-campervan-configurator
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Check if WooCommerce is active
 */
function yakkt_check_woocommerce() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            ?>
            <div class="error">
                <p><?php _e('Yakkt Campervan Configurator requires WooCommerce to be installed and active.', 'yakkt-campervan-configurator'); ?></p>
            </div>
            <?php
        });
        return false;
    }
    
    // Ensure global WC is loaded properly if available but not initialized
    if (!function_exists('WC') && function_exists('WC')) {
        yakkt_log("WC() function exists but WC object not created - initializing manually");
        WC(); // Initialize WooCommerce
    }
    
    return true;
}

/**
 * Register the Shortcode [yakkt_campervan_configurator]
 * Embeds the Next.js app via an iframe
 */
function yakkt_campervan_configurator_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '800px',
        'width' => '100%',
    ), $atts, 'yakkt_campervan_configurator');

    // Get the configurator URL from settings or use default
    $configurator_url = get_option('yakkt_configurator_url', 'https://configurator.yakkt.com');
    
    // Generate a unique iframe ID
    $iframe_id = 'yakkt-configurator-' . uniqid();
    
    // Create the iframe HTML
    $html = sprintf(
        '<iframe id="%s" src="%s" style="width:%s; height:%s; border:none;" allow="fullscreen" title="Yakkt Campervan Configurator"></iframe>',
        esc_attr($iframe_id),
        esc_url($configurator_url),
        esc_attr($atts['width']),
        esc_attr($atts['height'])
    );
    
    return $html;
}
add_shortcode('yakkt_campervan_configurator', 'yakkt_campervan_configurator_shortcode');

/**
 * Debug logging function
 */
function yakkt_log($message, $data = null) {
    if (defined('WP_DEBUG') && WP_DEBUG === true) {
        $log_entry = '[YAKKT DEBUG] ' . $message;
        if ($data !== null) {
            if (is_array($data) || is_object($data)) {
                $log_entry .= ': ' . print_r($data, true);
            } else {
                $log_entry .= ': ' . $data;
            }
        }
        error_log($log_entry);
    }
}

/**
 * Register Custom REST API Endpoint: /wp-json/yakkt/v1/create-order
 * And a new direct-add endpoint that doesn't rely on session persistence
 */
function yakkt_register_rest_routes() {
    // Original endpoint (maintained for compatibility)
    register_rest_route('yakkt/v1', '/create-order', array(
        'methods' => 'POST',
        'callback' => 'yakkt_add_configured_item_to_cart',
        'permission_callback' => 'yakkt_verify_request',
    ));
    
    // New endpoint that returns a URL to a special page that will add the item and redirect
    register_rest_route('yakkt/v1', '/get-add-url', array(
        'methods' => 'POST',
        'callback' => 'yakkt_get_direct_add_url',
        'permission_callback' => 'yakkt_verify_request',
    ));
}
add_action('rest_api_init', 'yakkt_register_rest_routes');

/**
 * Verify the request (API key or other method)
 */
function yakkt_verify_request($request) {
    $api_key = $request->get_header('X-Yakkt-API-Key');
    $valid_key = get_option('yakkt_api_key', '');
    if (empty($valid_key)) return true; // Allow if no key set (dev)
    return $api_key === $valid_key;
}

/**
 * Adds the configured item to the WooCommerce cart.
 */
function yakkt_add_configured_item_to_cart($request) {
    yakkt_log("Starting cart add process");
    
    if (!yakkt_check_woocommerce()) {
        yakkt_log("WooCommerce not installed");
        return new WP_Error('woocommerce_missing', 'WooCommerce not installed', array('status' => 500));
    }
    
    // Force cookie saving for cross-request persistence
    yakkt_maybe_set_cookies();

    // Load WooCommerce directly
    if (!function_exists('WC')) {
        yakkt_log("Loading WooCommerce manually");
        if (function_exists('wc')) {
            wc(); // Initialize WooCommerce
        }
    }
    
    // Ensure essential WC components are loaded for REST API context
    if (function_exists('WC')) {
        // Ensure session handler is loaded and a session is initiated
        if (!isset(WC()->session) || !is_object(WC()->session)) { 
            yakkt_log("WC()->session not initialized, creating new session");
            // Check if we can instantiate session handler directly
            if (class_exists('WC_Session_Handler')) {
                WC()->session = new WC_Session_Handler();
                WC()->session->init();
            } else {
                yakkt_log("WC_Session_Handler class not found - critical error");
                return new WP_Error('session_handler_missing', 'WooCommerce session handler not available', array('status' => 500));
            }
        }
        
        if (method_exists(WC()->session, 'has_session') && !WC()->session->has_session()) { 
            yakkt_log("No customer session cookie exists, setting one now");
            WC()->session->set_customer_session_cookie(true);
        }

        // Completely reset customer instance to ensure it's properly initialized
        if (class_exists('WC_Customer')) {
            yakkt_log("Creating new WC_Customer instance");
            WC()->customer = new WC_Customer(get_current_user_id(), true);
            
            // Validate that the customer object has essential methods
            if (!method_exists(WC()->customer, 'get_is_vat_exempt')) {
                yakkt_log("WC_Customer missing get_is_vat_exempt method - will add it manually");
                // As a last resort, add a stub method if it's missing
                if (!function_exists('yakkt_temporary_customer_patch')) {
                    function yakkt_temporary_customer_patch() {
                        if (isset(WC()->customer) && is_object(WC()->customer) && !method_exists(WC()->customer, 'get_is_vat_exempt')) {
                            yakkt_log("Applying get_is_vat_exempt method patch to customer object");
                            WC()->customer->get_is_vat_exempt = function() {
                                return false; // Default behavior: not VAT exempt
                            };
                        }
                    }
                }
                yakkt_temporary_customer_patch();
            }
        } else {
            yakkt_log("WC_Customer class not found - critical error");
            return new WP_Error('customer_class_missing', 'WooCommerce customer class not available', array('status' => 500));
        }

        // Ensure cart is loaded
        if (!isset(WC()->cart) || !is_object(WC()->cart)) { 
            yakkt_log("WC()->cart not initialized, creating new cart");
            WC()->cart = new WC_Cart();
            if (WC()->session && method_exists(WC()->session, 'has_session') && WC()->session->has_session() && method_exists(WC()->session, 'get_cart_for_session')) {
                 WC()->cart->get_cart_from_session();
            }
        }
        
        if (null === WC()->cart && function_exists('wc_load_cart')) { 
            yakkt_log("Trying wc_load_cart()");
            wc_load_cart();
        }

        // Final checks after attempting to initialize
        if (null === WC()->session || !method_exists(WC()->session, 'has_session')) {
            yakkt_log("WC()->session still invalid after initialization attempts");
            return new WP_Error('session_not_loaded', 'WooCommerce session could not be initialized or is invalid after attempts.', array('status' => 500));
        }
        
        if (null === WC()->cart || !is_object(WC()->cart)) { 
            yakkt_log("WC()->cart still invalid after initialization attempts");
            return new WP_Error('cart_not_loaded', 'WooCommerce cart could not be initialized as an object after attempts.', array('status' => 500));
        }
        
        if (null === WC()->customer || !is_object(WC()->customer)) {
            yakkt_log("WC()->customer still invalid after initialization attempts");
            return new WP_Error('customer_not_loaded', 'WooCommerce customer could not be initialized as an object after attempts.', array('status' => 500));
        }
    } else {
        yakkt_log("WC() function not available");
        return new WP_Error('wc_not_available', 'WooCommerce (WC()) functions are not available.', array('status' => 500));
    }

    $body = $request->get_json_params();
    yakkt_log("Request payload", $body);

    // Get product ID from plugin settings (instead of from request)
    $stored_product_id = get_option('yakkt_product_id', 0);
    
    // Use product ID from settings if available, otherwise fall back to request
    $product_id = !empty($stored_product_id) ? absint($stored_product_id) : (isset($body['productId']) ? absint($body['productId']) : 0);
    
    yakkt_log("Using product ID", $product_id);
    
    $chassis_id = isset($body['chassis']) ? sanitize_text_field($body['chassis']) : '';
    $chassis_name = isset($body['chassisName']) ? sanitize_text_field($body['chassisName']) : '';
    $components = isset($body['components']) && is_array($body['components']) ? $body['components'] : array();
    $total_price = isset($body['totalPrice']) ? floatval($body['totalPrice']) : 0.0;

    // Simple validation
    if (!$product_id) {
        yakkt_log("No product ID found - check plugin settings or request payload");
        return new WP_Error('missing_product_id', 'Missing product ID. Please set a valid product in the Yakkt Configurator settings page.', array('status' => 400));
    }
    
    if (!$chassis_id || $total_price <= 0) {
        yakkt_log("Missing required data", array(
            'chassis_id' => $chassis_id,
            'total_price' => $total_price
        ));
        return new WP_Error('missing_data', 'Missing or invalid required data (Chassis ID or Total Price)', array('status' => 400));
    }

    // Ensure product exists
    $product = wc_get_product($product_id);
    if (!$product) {
        yakkt_log("Product does not exist", $product_id);
        return new WP_Error('invalid_product', "Configured product ID {$product_id} does not exist or is not a valid WooCommerce product.", array('status' => 400));
    } else {
        yakkt_log("Found product", array(
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'type' => $product->get_type(),
            'status' => $product->get_status(),
            'price' => $product->get_price()
        ));
    }
    
    // Create a detailed configuration summary for display
    $config_summary = "Configured Van: " . $chassis_name;
    $component_details_for_meta = array();
    if (!empty($components)) {
        $component_names = array();
        foreach ($components as $component) {
            if (isset($component['name'])) {
                $component_names[] = sanitize_text_field($component['name']);
                // Prepare for meta
                $component_details_for_meta[] = array(
                    'id' => isset($component['id']) ? sanitize_text_field($component['id']) : 'N/A',
                    'name' => sanitize_text_field($component['name']),
                    'price' => isset($component['price']) ? floatval($component['price']) : 0
                );
            }
        }
        if (!empty($component_names)) {
        $config_summary .= " with " . implode(', ', $component_names);
        }
    }

    // Prepare custom cart item data
    $yakkt_custom_data = array(
        '_yakkt_config_summary' => $config_summary,
        '_yakkt_total_price'    => $total_price,
        '_yakkt_chassis_id'     => $chassis_id,
        '_yakkt_chassis_name'   => $chassis_name,
        '_yakkt_components'     => $component_details_for_meta, // Store the structured array
        '_yakkt_is_configured'  => true // Flag to identify our item
    );

    try {
        // Clear the cart to ensure only the configured item is present.
        yakkt_log("Emptying cart");
        WC()->cart->empty_cart();
        yakkt_log("Cart after emptying", array('count' => count(WC()->cart->get_cart())));

        // Add the configured product to the cart
        yakkt_log("Adding to cart", array(
            'product_id' => $product_id,
            'quantity' => 1,
            'custom_data' => $yakkt_custom_data
        ));
        
        // Use an extra try/catch specifically for the add_to_cart call
        try {
            $cart_item_key = WC()->cart->add_to_cart($product_id, 1, 0, array(), $yakkt_custom_data);
            
            // Handle failure if cart item key is empty
            if (!$cart_item_key) {
                yakkt_log("Failed to add to cart - no cart item key returned");
                return new WP_Error('cart_add_failed', 'Could not add configured item to cart.', array('status' => 500));
            }
            
            yakkt_log("Successfully added to cart with key", $cart_item_key);
            yakkt_log("Cart items after add", WC()->cart->get_cart());
            yakkt_log("Cart count", count(WC()->cart->get_cart()));
            
            // Recalculate totals to apply custom price - this has special error handling
            try {
                // Force WC_Customer instance before calculation
                if (!isset(WC()->customer) || !is_object(WC()->customer)) {
                    yakkt_log("Re-initializing WC()->customer just before calculate_totals");
                    WC()->customer = new WC_Customer(get_current_user_id(), true);
                }
                
                // Before calculating totals, make absolutely sure the customer object has the needed method
                if (isset(WC()->customer) && is_object(WC()->customer) && !method_exists(WC()->customer, 'get_is_vat_exempt')) {
                    yakkt_log("Adding missing get_is_vat_exempt method to customer object");
                    // Add a patch method if it's missing
                    WC()->customer->get_is_vat_exempt = function() {
                        return false; // Default behavior: not VAT exempt
                    };
                }
                
                // Now calculate totals
                WC()->cart->calculate_totals();
                yakkt_log("Cart totals successfully calculated");
            } catch (Exception $calc_ex) {
                // If calculate_totals fails, log it but continue
                yakkt_log("Exception during calculate_totals: " . $calc_ex->getMessage());
                // We'll continue with the process even if calculation fails
            }
            
            // Directly save cart data to database
            yakkt_save_cart_to_db(WC()->cart->get_cart_for_session());
            
            // Add a notice that will show on the site to help with debugging
            if (function_exists('wc_add_notice')) {
                wc_add_notice("Successfully added configured van to cart: " . $config_summary, 'success');
            }

            // Get checkout URL
            $checkout_url = wc_get_checkout_url();
            yakkt_log("Returning checkout URL", $checkout_url);
            
            return new WP_REST_Response(array(
                'success' => true,
                'cartItemKey' => $cart_item_key,
                'checkoutUrl' => $checkout_url,
                'cartItemCount' => count(WC()->cart->get_cart())
            ), 200);
            
        } catch (Exception $cart_ex) {
            // Specific exception handling for add_to_cart operation
            yakkt_log("Exception during add_to_cart: " . $cart_ex->getMessage());
            return new WP_Error('add_to_cart_exception', $cart_ex->getMessage(), array('status' => 500));
        }

    } catch (Exception $e) {
        yakkt_log("Exception during cart processing", $e->getMessage());
        return new WP_Error('cart_exception', $e->getMessage(), array('status' => 500));
    }
}

/**
 * Save cart data directly to database
 * This ensures data is saved even if session mechanisms fail
 */
function yakkt_save_cart_to_db($cart_data) {
    global $wpdb;
    
    // Generate a cart ID based on current timestamp
    $customer_id = get_current_user_id();
    if ($customer_id <= 0) {
        // For guests, generate a temporary ID
        if (!isset($_COOKIE['yakkt_guest_id'])) {
            $guest_id = uniqid('yakkt_guest_', true);
            setcookie('yakkt_guest_id', $guest_id, time() + 86400, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
            $customer_id = $guest_id;
        } else {
            $customer_id = $_COOKIE['yakkt_guest_id'];
        }
    }
    
    // Serialize cart data
    $cart_data_serialized = maybe_serialize($cart_data);
    
    // Insert or update cart data in sessions table
    $session_table = $wpdb->prefix . 'woocommerce_sessions';
    
    // Check if we can write to the DB
    if (!yakkt_check_session_table_exists($session_table)) {
        yakkt_log("Couldn't access WooCommerce sessions table");
        return false;
    }
    
    $session_data = array(
        'session_key' => $customer_id,
        'session_value' => $cart_data_serialized,
        'session_expiry' => time() + 86400, // 24 hours from now
    );
    
    yakkt_log("Saving session data", array('customer_id' => $customer_id));
    
    // Check if session exists and create or update accordingly
    $existing_session = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT session_key FROM $session_table WHERE session_key = %s",
            $customer_id
        )
    );
    
    if ($existing_session) {
        // Update existing session
        $result = $wpdb->update(
            $session_table,
            array(
                'session_value' => $cart_data_serialized,
                'session_expiry' => time() + 86400,
            ),
            array('session_key' => $customer_id)
        );
    } else {
        // Create new session
        $result = $wpdb->insert($session_table, $session_data);
    }
    
    if ($result !== false) {
        yakkt_log("Successfully saved session data to database");
        return true;
    } else {
        yakkt_log("Failed to save session data to database", $wpdb->last_error);
        return false;
    }
}

/**
 * Check if the WooCommerce sessions table exists
 */
function yakkt_check_session_table_exists($table_name) {
    global $wpdb;
    
    $result = $wpdb->get_var(
        $wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_name
        )
    );
    
    return $result === $table_name;
}

/**
 * Set custom price for the configured item in the cart.
 */
add_action('woocommerce_before_calculate_totals', 'yakkt_set_custom_cart_item_price', 20, 1);
function yakkt_set_custom_cart_item_price($cart_obj) {
    if (is_admin() && !defined('DOING_AJAX')) return;
    if (null === $cart_obj || !isset($cart_obj->cart_contents)) return; // Add null check for cart_obj and its contents

    foreach ($cart_obj->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['_yakkt_is_configured']) && $cart_item['_yakkt_is_configured'] === true) {
            if (isset($cart_item['_yakkt_total_price'])) {
                // Log this price change if debugging is enabled
                if (defined('WP_DEBUG') && WP_DEBUG === true) {
                    error_log('[YAKKT DEBUG] Setting custom price for item ' . $cart_item_key . ': ' . $cart_item['_yakkt_total_price']);
                }
                $cart_item['data']->set_price(floatval($cart_item['_yakkt_total_price']));
            }
        }
    }
}

/**
 * Display the custom configuration summary as the item name in cart and checkout.
 */
add_filter('woocommerce_cart_item_name', 'yakkt_display_custom_cart_item_name', 10, 3);
function yakkt_display_custom_cart_item_name($product_name, $cart_item, $cart_item_key) {
    if (isset($cart_item['_yakkt_is_configured']) && $cart_item['_yakkt_is_configured'] === true) {
        if (isset($cart_item['_yakkt_config_summary'])) {
            // Remove default product link if desired
            // $product_name = sprintf('<a href="%s">%s</a>', esc_url($cart_item['data']->get_permalink($cart_item)), $cart_item['_yakkt_config_summary']);
            return esc_html($cart_item['_yakkt_config_summary']);
        }
    }
    return $product_name;
}

/**
 * Add custom configuration data as meta to the order item.
 */
add_action('woocommerce_checkout_create_order_line_item', 'yakkt_add_custom_data_to_order_item', 10, 4);
function yakkt_add_custom_data_to_order_item($item, $cart_item_key, $values, $order) {
    if (isset($values['_yakkt_is_configured']) && $values['_yakkt_is_configured'] === true) {
        if (isset($values['_yakkt_config_summary'])) {
            $item->add_meta_data('Configuration', $values['_yakkt_config_summary'], true);
        }
        if (isset($values['_yakkt_chassis_id'])) {
            $item->add_meta_data('Chassis ID', $values['_yakkt_chassis_id'], true);
        }
        if (isset($values['_yakkt_chassis_name'])) {
            $item->add_meta_data('Chassis Name', $values['_yakkt_chassis_name'], true);
        }
        if (isset($values['_yakkt_components']) && is_array($values['_yakkt_components'])) {
            $components_string = "
"; // Start with a newline for better formatting in admin
            foreach($values['_yakkt_components'] as $component) {
                $components_string .= sprintf("- %s (£%.2f)
", esc_html($component['name']), floatval($component['price']));
            }
            $item->add_meta_data('Selected Components', $components_string, true);
        }
         if (isset($values['_yakkt_total_price'])) {
            // The price should already be set by woocommerce_before_calculate_totals hook,
            // but we can store it as meta for reference if needed.
            $item->add_meta_data('Configured Price', wc_price($values['_yakkt_total_price']), true);
        }
    }
}

/**
 * Maybe set cookies if WooCommerce is available but the session hasn't been saved yet.
 * This helps ensure that cookies are always set before completing the REST request.
 */
function yakkt_maybe_set_cookies() {
    if (function_exists('WC') && isset(WC()->session)) {
        // Force cookies to be set and saved
        if (method_exists(WC()->session, 'set_customer_session_cookie')) {
            yakkt_log("Forcing customer session cookie to be set");
            WC()->session->set_customer_session_cookie(true);
        }
        
        // Extend cookie lifetime for all cookies (make them last longer)
        if (!headers_sent()) {
            foreach ($_COOKIE as $name => $value) {
                if (strpos($name, 'wp_') === 0 || strpos($name, 'woocommerce_') === 0) {
                    yakkt_log("Extending cookie lifetime for: " . $name);
                    setcookie($name, $value, time() + 86400, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
                }
            }
        }
    }
}

// Force saving WC session data before REST response is sent
add_action('rest_api_init', function() {
    add_action('shutdown', 'yakkt_ensure_session_saved', 20);
}, 999);

/**
 * Ensure session data is saved at the end of the REST request
 */
function yakkt_ensure_session_saved() {
    if (defined('REST_REQUEST') && REST_REQUEST && function_exists('WC') && isset(WC()->session)) {
        if (method_exists(WC()->session, 'save_data')) {
            yakkt_log("Explicitly saving session data on shutdown");
            WC()->session->save_data();
        }
        yakkt_maybe_set_cookies();
    }
}

// Ensure session data persists across requests (save callback)
add_action('woocommerce_add_to_cart', 'yakkt_after_cart_update', 20, 0);

/**
 * Force saving session data after cart updates
 */
function yakkt_after_cart_update() {
    if (function_exists('WC') && isset(WC()->session)) {
        yakkt_log("Cart updated, saving session data");
        
        // Commit the cart to the session (important for REST API context)
        if (method_exists(WC()->cart, 'set_session')) {
            WC()->cart->set_session();
            yakkt_log("Cart session data set");
        }
        
        // Ensure session is saved
        if (method_exists(WC()->session, 'save_data')) {
            WC()->session->save_data();
            yakkt_log("Session data saved");
        }
        
        yakkt_maybe_set_cookies();
    }
}

/**
 * Hide quantity selector for configured item in cart (as it should always be 1)
 * And prevent metadata from showing by default (we handle name override)
 */
add_filter('woocommerce_cart_item_quantity', 'yakkt_cart_item_quantity', 10, 3 );
function yakkt_cart_item_quantity( $product_quantity, $cart_item_key, $cart_item ){
    if(isset($cart_item['_yakkt_is_configured']) && $cart_item['_yakkt_is_configured'] === true ){
        return '1'; // Display quantity as 1, not an input field
    }
    return $product_quantity;
}

add_filter( 'woocommerce_get_item_data', 'yakkt_hide_default_meta_if_configured', 10, 2 );
function yakkt_hide_default_meta_if_configured( $item_data, $cart_item ) {
    if ( isset( $cart_item['_yakkt_is_configured'] ) && $cart_item['_yakkt_is_configured'] === true ) {
        return array(); // Return empty array to hide default meta for our item
    }
    return $item_data;
}

/**
 * Add settings page for the plugin
 */
function yakkt_add_admin_menu() {
    add_options_page(
        'Yakkt Configurator Settings',
        'Yakkt Configurator',
        'manage_options',
        'yakkt-configurator',
        'yakkt_settings_page'
    );
}
add_action('admin_menu', 'yakkt_add_admin_menu');

/**
 * Register settings
 */
function yakkt_register_settings() {
    register_setting('yakkt_configurator_settings', 'yakkt_configurator_url');
    register_setting('yakkt_configurator_settings', 'yakkt_product_id');
    register_setting('yakkt_configurator_settings', 'yakkt_api_key');
}
add_action('admin_init', 'yakkt_register_settings');

/**
 * Settings page HTML
 */
function yakkt_settings_page() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>This plugin allows embedding the Yakkt Campervan Configurator and processing its configurations through WooCommerce.</p>
        <form method="post" action="options.php">
            <?php
            settings_fields('yakkt_configurator_settings');
            do_settings_sections('yakkt_configurator_settings');
            ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="yakkt_configurator_url">Configurator App URL</label>
                    </th>
                    <td>
                        <input type="url" id="yakkt_configurator_url" name="yakkt_configurator_url" 
                               value="<?php echo esc_attr(get_option('yakkt_configurator_url', 'https://configurator.yakkt.com')); ?>" 
                               class="regular-text">
                        <p class="description">The URL where your Next.js configurator application is hosted.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="yakkt_product_id">Base WooCommerce Product ID</label>
                    </th>
                    <td>
                        <input type="number" id="yakkt_product_id" name="yakkt_product_id" 
                               value="<?php echo esc_attr(get_option('yakkt_product_id', '')); ?>" 
                               class="regular-text">
                        <p class="description">The ID of the placeholder "Configurable Campervan" product in WooCommerce. <strong>IMPORTANT: Make sure this is correctly set to a valid WooCommerce product ID or the configurator will not work.</strong></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="yakkt_api_key">API Key (Optional)</label>
                    </th>
                    <td>
                        <input type="text" id="yakkt_api_key" name="yakkt_api_key" 
                               value="<?php echo esc_attr(get_option('yakkt_api_key', '')); ?>" 
                               class="regular-text">
                        <p class="description">Optional API key for securing the REST endpoint. Must match the key sent by the Next.js app.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <h2>Important Notes:</h2>
        <ul>
            <li>The product ID above <strong>MUST</strong> be set to a valid WooCommerce product to use as a template for the configurable van.</li>
            <li>Ensure your chosen product is a <strong>simple product</strong> with a base price (the price will be overridden by the configurator).</li>
            <li>This plugin will clear the user's cart before adding the configured item.</li>
        </ul>
    </div>
    <?php
}

/**
 * Add a Gutenberg block for the configurator
 */
function yakkt_register_block() {
    if (function_exists('register_block_type')) {
        register_block_type('yakkt/campervan-configurator', array(
            'editor_script' => 'yakkt-configurator-block',
            'render_callback' => 'yakkt_campervan_configurator_shortcode',
            'attributes' => array(
                'height' => array('type' => 'string', 'default' => '800px'),
                'width' => array('type' => 'string', 'default' => '100%'),
            ),
        ));
    }
}
add_action('init', 'yakkt_register_block');

/**
 * Enqueue block editor assets
 */
function yakkt_enqueue_block_editor_assets() {
    if (!function_exists('register_block_type')) {
        return;
    }

    wp_register_script(
        'yakkt-configurator-block',
        plugins_url('block.js', __FILE__),
        array('wp-blocks', 'wp-element', 'wp-editor'),
        filemtime(plugin_dir_path(__FILE__) . 'block.js')
    );
}
add_action('enqueue_block_editor_assets', 'yakkt_enqueue_block_editor_assets'); 

/**
 * Fix session persistence issues for REST requests
 */
function yakkt_ensure_session_persistence() {
    // If we're in a REST context and WC is loaded, ensure session is started
    if (defined('REST_REQUEST') && REST_REQUEST && function_exists('WC')) {
        if (!isset(WC()->session) || !is_object(WC()->session)) {
            yakkt_log("Setting up WC session in yakkt_ensure_session_persistence");
            WC()->session = new WC_Session_Handler();
            WC()->session->init();
            
            if (method_exists(WC()->session, 'set_customer_session_cookie')) {
                WC()->session->set_customer_session_cookie(true);
            }
        }
        
        // Also ensure customer is loaded
        if (!isset(WC()->customer) || !is_object(WC()->customer)) {
            yakkt_log("Setting up WC customer in yakkt_ensure_session_persistence");
            if (class_exists('WC_Customer')) {
                WC()->customer = new WC_Customer(get_current_user_id(), true);
            }
        }
    }
}
add_action('init', 'yakkt_ensure_session_persistence', 99);

/**
 * Get a special URL that will add the item directly to cart and redirect to checkout
 * This avoids session persistence issues by using a direct web flow rather than API
 */
function yakkt_get_direct_add_url($request) {
    yakkt_log("Getting direct add URL");
    
    $body = $request->get_json_params();
    yakkt_log("Request payload", $body);
    
    // Generate a unique token for this configuration data
    $token = wp_generate_password(32, false);
    
    // Store the configuration data in a transient with the token as the key
    // This will expire after 5 minutes as a security measure
    set_transient('yakkt_config_' . $token, $body, 5 * MINUTE_IN_SECONDS);
    
    // Create a URL to our special endpoint that will add the item and redirect
    $add_url = add_query_arg(
        array(
            'yakkt_action' => 'add_to_cart',
            'token' => $token,
        ),
        home_url()
    );
    
    yakkt_log("Generated direct add URL", $add_url);
    
    return new WP_REST_Response(array(
        'success' => true,
        'addUrl' => $add_url,
    ), 200);
}

/**
 * Handle the add-to-cart direct web flow
 * This runs on normal page load context, so session persistence is guaranteed
 */
function yakkt_handle_direct_add() {
    // Check if this is a request to our special endpoint
    if (isset($_GET['yakkt_action']) && $_GET['yakkt_action'] === 'add_to_cart' && isset($_GET['token'])) {
        $token = sanitize_text_field($_GET['token']);
        yakkt_log("Processing direct add request with token", $token);
        
        // Get the stored configuration data
        $config = get_transient('yakkt_config_' . $token);
        
        if (!$config) {
            yakkt_log("Invalid or expired token", $token);
            wp_redirect(wc_get_cart_url());
            exit;
        }
        
        // Delete the transient to prevent reuse
        delete_transient('yakkt_config_' . $token);
        
        // Process the configuration
        yakkt_log("Retrieved configuration data", $config);
        
        // Get product ID from plugin settings (instead of from request)
        $stored_product_id = get_option('yakkt_product_id', 0);
        
        // Use product ID from settings if available, otherwise fall back to request
        $product_id = !empty($stored_product_id) ? absint($stored_product_id) : (isset($config['productId']) ? absint($config['productId']) : 0);
        
        yakkt_log("Using product ID", $product_id);
        
        $chassis_id = isset($config['chassis']) ? sanitize_text_field($config['chassis']) : '';
        $chassis_name = isset($config['chassisName']) ? sanitize_text_field($config['chassisName']) : '';
        $components = isset($config['components']) && is_array($config['components']) ? $config['components'] : array();
        $total_price = isset($config['totalPrice']) ? floatval($config['totalPrice']) : 0.0;
        
        // Simple validation
        if (!$product_id || !$chassis_id || $total_price <= 0) {
            yakkt_log("Missing required data", array(
                'product_id' => $product_id,
                'chassis_id' => $chassis_id,
                'total_price' => $total_price
            ));
            wc_add_notice('Missing or invalid configuration data.', 'error');
            wp_redirect(wc_get_cart_url());
            exit;
        }
        
        // Ensure product exists
        $product = wc_get_product($product_id);
        if (!$product) {
            yakkt_log("Product does not exist", $product_id);
            wc_add_notice('The configured product does not exist.', 'error');
            wp_redirect(wc_get_cart_url());
            exit;
        }
        
        // Create a detailed configuration summary for display
        $config_summary = "Configured Van: " . $chassis_name;
        $component_details_for_meta = array();
        if (!empty($components)) {
            $component_names = array();
            foreach ($components as $component) {
                if (isset($component['name'])) {
                    $component_names[] = sanitize_text_field($component['name']);
                    // Prepare for meta
                    $component_details_for_meta[] = array(
                        'id' => isset($component['id']) ? sanitize_text_field($component['id']) : 'N/A',
                        'name' => sanitize_text_field($component['name']),
                        'price' => isset($component['price']) ? floatval($component['price']) : 0
                    );
                }
            }
            if (!empty($component_names)) {
                $config_summary .= " with " . implode(', ', $component_names);
            }
        }
        
        // Prepare custom cart item data
        $yakkt_custom_data = array(
            '_yakkt_config_summary' => $config_summary,
            '_yakkt_total_price'    => $total_price,
            '_yakkt_chassis_id'     => $chassis_id,
            '_yakkt_chassis_name'   => $chassis_name,
            '_yakkt_components'     => $component_details_for_meta,
            '_yakkt_is_configured'  => true
        );
        
        // Clear the cart to ensure only the configured item is present
        yakkt_log("Emptying cart");
        WC()->cart->empty_cart();
        
        // Add the configured product to the cart
        yakkt_log("Adding to cart", array(
            'product_id' => $product_id,
            'quantity' => 1,
            'custom_data' => $yakkt_custom_data
        ));
        
        $cart_item_key = WC()->cart->add_to_cart($product_id, 1, 0, array(), $yakkt_custom_data);
        
        if (!$cart_item_key) {
            yakkt_log("Failed to add to cart - no cart item key returned");
            wc_add_notice('Could not add the configured van to your cart.', 'error');
            wp_redirect(wc_get_cart_url());
            exit;
        }
        
        yakkt_log("Successfully added to cart with key", $cart_item_key);
        
        // Add a success notice
        wc_add_notice(sprintf('Added "%s" to your cart.', $config_summary), 'success');
        
        // Redirect to checkout
        wp_redirect(wc_get_checkout_url());
        exit;
    }
}
add_action('template_redirect', 'yakkt_handle_direct_add', 5);

/**
 * Update the frontend script to use the new direct add flow
 */
function yakkt_update_frontend_api_endpoint() {
    // Only add this script on pages containing our shortcode or block
    global $post;
    if (is_a($post, 'WP_Post') && (has_shortcode($post->post_content, 'yakkt_campervan_configurator') || has_block('yakkt/campervan-configurator', $post->post_content))) {
        ?>
        <script type="text/javascript">
        document.addEventListener('DOMContentLoaded', function() {
            // Listen for messages from the iframe
            window.addEventListener('message', function(event) {
                // Verify origin (optional but recommended for security)
                const configuratorUrl = '<?php echo esc_js(get_option('yakkt_configurator_url', 'https://configurator.yakkt.com')); ?>';
                const configuratorOrigin = new URL(configuratorUrl).origin;
                
                if (event.origin !== configuratorOrigin) {
                    console.warn('Message received from unknown origin:', event.origin);
                    return;
                }
                
                // Check if this is a checkout message from our configurator
                if (event.data && event.data.type === 'YAKKT_CHECKOUT') {
                    console.log('Received checkout message:', event.data);
                    
                    // Show loading state or message to user
                    if (event.data.payload) {
                        window.location.href = event.data.payload.checkoutUrl || event.data.payload.addUrl;
                    }
                }
            });
            
            // Notify the iframe that we're ready to receive messages
            const iframe = document.querySelector('iframe[src*="configurator.yakkt"]');
            if (iframe) {
                iframe.onload = function() {
                    iframe.contentWindow.postMessage({ type: 'YAKKT_PARENT_READY' }, '*');
                };
            }
        });
        </script>
        <?php
    }
}
add_action('wp_footer', 'yakkt_update_frontend_api_endpoint'); 