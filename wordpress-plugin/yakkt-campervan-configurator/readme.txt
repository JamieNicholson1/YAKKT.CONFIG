=== Yakkt Campervan Configurator ===
Contributors: yakktteam
Tags: campervan, configurator, 3d, woocommerce, supabase
Requires at least: 5.8
Tested up to: 6.4
Stable tag: 1.1
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Integrate a 3D campervan configurator with WordPress and WooCommerce, now with Supabase integration for community builds sharing.

== Description ==

The Yakkt Campervan Configurator plugin allows you to embed a Next.js based 3D configurator for campervans directly into your WordPress website. Customers can customize their van's exterior, see pricing updates in real-time, and place an order directly to WooCommerce.

This plugin creates a seamless integration between your Next.js configurator app and your WordPress store, handling all the data transfer between the two systems.

= Features =

* Embed the 3D configurator via shortcode or Gutenberg block
* Create WooCommerce orders with detailed configuration data
* Store custom configuration as order meta data
* Adjust pricing automatically based on selected options
* Integrates with Supabase for community builds sharing
* Secure API endpoints with key-based authentication
* Easy setup with admin configuration page

= New in Version 1.1 =

* Added Supabase integration for community builds
* New REST endpoints for fetching and saving community builds
* Added support for liking builds
* Improved admin settings for Supabase configuration

== Installation ==

1. Upload the `yakkt-campervan-configurator` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure the plugin settings at Settings > Yakkt Configurator
4. Add the configurator to your page using the shortcode `[yakkt_campervan_configurator]` or the Gutenberg block

== Required Settings ==

* **Configurator URL**: The URL where your Next.js campervan configurator is hosted
* **WooCommerce Product ID**: The ID of a product in your WooCommerce store that will be used as the base for orders
* **API Key**: An optional security key for the REST API communication
* **Supabase URL**: Your Supabase project URL
* **Supabase Anonymous Key**: Your Supabase anonymous/public API key

== Shortcode ==

Basic usage: `[yakkt_campervan_configurator]`

With custom dimensions: `[yakkt_campervan_configurator height="800px" width="100%"]`

== Frequently Asked Questions ==

= Does this require WooCommerce? =

Yes, this plugin is designed to work with WooCommerce for order processing.

= How do I add the configurator to my page? =

You can use the shortcode `[yakkt_campervan_configurator]` or add the "Yakkt Campervan Configurator" block in the Gutenberg editor.

= Can I customize the appearance of the configurator? =

The appearance is controlled by your Next.js application. This plugin simply embeds it in your WordPress site and handles the communication between the two.

= What is the Supabase integration for? =

Supabase is used to store and manage community builds, allowing your customers to save their designs and share them with others.

== Screenshots ==

1. Configurator embedded in WordPress page
2. Admin settings page
3. WooCommerce order with configuration details
4. Community builds sharing interface

== Changelog ==

= 1.1 =
* Added Supabase integration for community builds
* New REST endpoints for managing build sharing
* Added settings for Supabase URL and API key
* Added build liking functionality

= 1.0 =
* Initial release
* Basic WooCommerce integration
* Configurator embedding via shortcode and block

== Upgrade Notice ==

= 1.1 =
This version adds Supabase integration for community builds sharing. Update your settings with your Supabase project URL and anonymous key after upgrading.

== Technical Details ==

This plugin creates the following REST API endpoints:

* `/wp-json/yakkt/v1/create-order` - Create a WooCommerce order from the configurator
* `/wp-json/yakkt/v1/community-builds` - Get community builds from Supabase
* `/wp-json/yakkt/v1/build/{id}` - Get a specific build by ID
* `/wp-json/yakkt/v1/save-build` - Save a new build to Supabase
* `/wp-json/yakkt/v1/like-build/{id}` - Like a specific build

Security for these endpoints is handled via the API key setting, which should be configured in both WordPress and your Next.js application. 