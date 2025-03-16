<?php
/**
 * Plugin Name: Yakkt Campervan Configurator
 * Description: Custom plugin to embed the Next.js campervan configurator and create WooCommerce orders.
 * Version: 1.0
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
 * Create a Custom REST API Endpoint: /wp-json/yakkt/v1/create-order
 * Receives JSON data: { "productId": "...", "chassis": "...", "components": [...], "totalPrice": ... }
 * Creates a WooCommerce order with these details stored in line item meta.
 */
function yakkt_register_rest_routes() {
    register_rest_route('yakkt/v1', '/create-order', array(
        'methods' => 'POST',
        'callback' => 'yakkt_create_campervan_order',
        'permission_callback' => 'yakkt_verify_order_request',
    ));
}
add_action('rest_api_init', 'yakkt_register_rest_routes');

/**
 * Verify the order request has a valid nonce or API key
 */
function yakkt_verify_order_request($request) {
    // For production, implement proper authentication here
    // This could be a nonce check, API key validation, or other secure method
    
    // For now, we'll use a simple API key check
    $api_key = $request->get_header('X-Yakkt-API-Key');
    $valid_key = get_option('yakkt_api_key', '');
    
    if (empty($valid_key)) {
        // If no API key is set, allow requests for development
        return true;
    }
    
    return $api_key === $valid_key;
}

/**
 * Create a WooCommerce order from the configurator data
 */
function yakkt_create_campervan_order($request) {
    if (!yakkt_check_woocommerce()) {
        return new WP_Error('woocommerce_missing', 'WooCommerce not installed', array('status' => 500));
    }

    $body = $request->get_json_params();

    // Retrieve the data from the request
    $product_id = isset($body['productId']) ? absint($body['productId']) : 0;
    $chassis = isset($body['chassis']) ? sanitize_text_field($body['chassis']) : '';
    $chassis_name = isset($body['chassisName']) ? sanitize_text_field($body['chassisName']) : '';
    $components = isset($body['components']) ? (array)$body['components'] : array();
    $total_price = isset($body['totalPrice']) ? floatval($body['totalPrice']) : 0.0;

    // Basic validation
    if (!$product_id || !$chassis || !$total_price) {
        return new WP_Error('missing_data', 'Missing required data', array('status' => 400));
    }

    // Create the order
    $order = wc_create_order();

    // Add the line item for the "Configurable Campervan" product
    $product = wc_get_product($product_id);
    if (!$product) {
        return new WP_Error('invalid_product', 'Invalid product ID', array('status' => 400));
    }
    
    // Add the product to the order
    $item_id = $order->add_product($product, 1);
    if (is_wp_error($item_id)) {
        return new WP_Error('add_product_error', 'Could not add product to order', array('status' => 500));
    }

    // IMPORTANT: Update the product price to match the configurator price
    // This is the key change to ensure the dynamic price is used
    wc_update_order_item_meta($item_id, '_line_subtotal', $total_price);
    wc_update_order_item_meta($item_id, '_line_total', $total_price);

    // Set line item meta with the config data
    wc_add_order_item_meta($item_id, '_chassis_id', $chassis);
    wc_add_order_item_meta($item_id, '_chassis_name', $chassis_name);
    wc_add_order_item_meta($item_id, '_components', json_encode($components));
    wc_add_order_item_meta($item_id, '_calculated_total_price', $total_price);

    // Add a note to the order
    $order->add_order_note(
        sprintf(
            'Campervan Configuration: Chassis: %s, Components: %s, Total Price: £%s',
            $chassis_name,
            implode(', ', array_column($components, 'name')),
            number_format($total_price, 2)
        )
    );

    // Set order status to pending
    $order->set_status('pending');
    
    // IMPORTANT: Set all the order totals correctly
    // This ensures both the line item and the order total match
    $order->set_cart_tax(0);
    $order->set_shipping_total(0);
    $order->set_shipping_tax(0);
    $order->set_discount_total(0);
    $order->set_discount_tax(0);
    $order->set_total($total_price); // Set the final total

    // Add billing information to avoid checkout issues
    $order->set_billing_email('guest@example.com');
    $order->set_billing_first_name('Guest');
    $order->set_billing_last_name('Customer');
    
    // Set payment method to direct bank transfer (or another available method)
    $order->set_payment_method('bacs');
    $order->set_payment_method_title('Direct Bank Transfer');
    
    // Calculate totals but don't recalculate prices (important!)
    $order->calculate_totals(false);
    
    // Force update the order total again after calculate_totals
    // This is necessary because calculate_totals might override our values
    global $wpdb;
    $wpdb->update(
        $wpdb->prefix . 'wc_order_stats',
        array('total_sales' => $total_price),
        array('order_id' => $order->get_id())
    );
    
    // Save the order
    $order->save();
    
    // Update the post meta directly as a final fallback
    update_post_meta($order->get_id(), '_order_total', $total_price);

    // Return the order ID and checkout URL
    return array(
        'success' => true,
        'orderId' => $order->get_id(),
        'checkoutUrl' => $order->get_checkout_payment_url()
    );
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
        <form method="post" action="options.php">
            <?php
            settings_fields('yakkt_configurator_settings');
            do_settings_sections('yakkt_configurator_settings');
            ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="yakkt_configurator_url">Configurator URL</label>
                    </th>
                    <td>
                        <input type="url" id="yakkt_configurator_url" name="yakkt_configurator_url" 
                               value="<?php echo esc_attr(get_option('yakkt_configurator_url', 'https://configurator.yakkt.com')); ?>" 
                               class="regular-text">
                        <p class="description">The URL where your Next.js configurator is hosted</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="yakkt_product_id">WooCommerce Product ID</label>
                    </th>
                    <td>
                        <input type="number" id="yakkt_product_id" name="yakkt_product_id" 
                               value="<?php echo esc_attr(get_option('yakkt_product_id', '')); ?>" 
                               class="regular-text">
                        <p class="description">The ID of the "Configurable Campervan" product in WooCommerce</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="yakkt_api_key">API Key</label>
                    </th>
                    <td>
                        <input type="text" id="yakkt_api_key" name="yakkt_api_key" 
                               value="<?php echo esc_attr(get_option('yakkt_api_key', '')); ?>" 
                               class="regular-text">
                        <p class="description">API key for securing the REST endpoint (leave empty for development)</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
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
                'height' => array(
                    'type' => 'string',
                    'default' => '800px',
                ),
                'width' => array(
                    'type' => 'string',
                    'default' => '100%',
                ),
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