=== Yakkt Campervan Configurator ===
Contributors: yakkt
Tags: woocommerce, 3d, configurator, campervan
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.2
Stable tag: 1.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Embed a Next.js 3D Campervan Configurator into WordPress and integrate with WooCommerce.

== Description ==

The Yakkt Campervan Configurator plugin allows you to seamlessly embed a Next.js 3D Campervan Configurator into your WordPress site and integrate it with WooCommerce. This plugin enables your customers to:

* Configure their campervan (chassis, exterior elements, etc.)
* See dynamic pricing
* Place orders in WooCommerce with their configuration details included in the order

The plugin provides:

* A shortcode `[yakkt_campervan_configurator]` to embed the configurator
* A Gutenberg block for easy embedding
* A secure API endpoint for the Next.js app to create WooCommerce orders
* Storage of user configuration details as order meta data

== Installation ==

1. Upload the `yakkt-campervan-configurator` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > Yakkt Configurator to configure the plugin
4. Enter the URL where your Next.js configurator is hosted
5. Enter the WooCommerce Product ID for the "Configurable Campervan" product
6. Optionally, set an API key for securing the REST endpoint

== Usage ==

= Using the Shortcode =

Simply add the shortcode `[yakkt_campervan_configurator]` to any page or post where you want to display the configurator.

You can customize the height and width of the iframe:

`[yakkt_campervan_configurator height="600px" width="100%"]`

= Using the Gutenberg Block =

1. Add the "Yakkt Campervan Configurator" block to your page
2. Adjust the height and width settings in the block inspector panel

= Setting Up the WooCommerce Product =

1. Create a new WooCommerce product called "Configurable Campervan"
2. Note the product ID (you'll need this for the plugin settings)
3. Set the product as a simple product with a base price

= Configuring the Next.js App =

Your Next.js app should send the configuration data to the WordPress REST API endpoint:

`POST https://your-site.com/wp-json/yakkt/v1/create-order`

With the following JSON payload:

```json
{
  "productId": 123,
  "chassis": "sprinter",
  "chassisName": "Mercedes Sprinter",
  "components": [
    {
      "id": "roof_rack_1",
      "name": "Premium Roof Rack"
    },
    {
      "id": "window_1",
      "name": "Sliding Window"
    }
  ],
  "totalPrice": 26800
}
```

If you've set an API key in the plugin settings, include it in the request header:

`X-Yakkt-API-Key: your-api-key`

== Frequently Asked Questions ==

= Does this plugin work with any WooCommerce theme? =

Yes, the plugin is designed to work with any WordPress theme that supports WooCommerce.

= Can I customize the appearance of the configurator? =

The appearance of the configurator is determined by your Next.js application. The plugin simply embeds the application via an iframe.

= Is the API endpoint secure? =

The plugin provides basic security through an optional API key. For production use, we recommend implementing additional security measures such as HTTPS and proper authentication.

== Changelog ==

= 1.0 =
* Initial release

== Upgrade Notice ==

= 1.0 =
Initial release 