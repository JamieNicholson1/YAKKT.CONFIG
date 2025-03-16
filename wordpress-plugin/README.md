# Yakkt Campervan Configurator - WordPress Integration

This directory contains the WordPress plugin for integrating the Next.js 3D Campervan Configurator with WordPress and WooCommerce.

## Overview

The integration consists of two main components:

1. **WordPress Plugin**: A custom plugin that provides a shortcode and Gutenberg block for embedding the configurator, as well as a REST API endpoint for creating WooCommerce orders.

2. **Next.js App Modifications**: Updates to the Next.js app to communicate with the WordPress plugin and handle the checkout process.

## WordPress Plugin Installation

1. Zip the `yakkt-campervan-configurator` directory:
   ```
   cd wordpress-plugin
   zip -r yakkt-campervan-configurator.zip yakkt-campervan-configurator
   ```

2. Upload the zip file to your WordPress site via the WordPress admin panel:
   - Go to Plugins > Add New > Upload Plugin
   - Choose the zip file and click "Install Now"
   - Activate the plugin

3. Configure the plugin:
   - Go to Settings > Yakkt Configurator
   - Enter the URL where your Next.js configurator is hosted
   - Enter the WooCommerce Product ID for the "Configurable Campervan" product
   - Optionally, set an API key for securing the REST endpoint

## Next.js App Configuration

1. Set the environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_WORDPRESS_API_URL=https://your-site.com/wp-json
   NEXT_PUBLIC_WORDPRESS_API_KEY=your-api-key
   NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_ID=123
   ```

2. Build and deploy the Next.js app:
   ```
   npm run build
   ```

## Usage

1. Add the shortcode `[yakkt_campervan_configurator]` to any WordPress page or post where you want to display the configurator.

2. Alternatively, use the Gutenberg block "Yakkt Campervan Configurator" to add the configurator to your page.

3. When a user configures their campervan and clicks "Checkout", the Next.js app will:
   - Send the configuration data to the WordPress REST API endpoint
   - Create a WooCommerce order with the configuration details
   - Redirect the user to the WooCommerce checkout page

## Security Considerations

- For production use, always use HTTPS for both your WordPress site and your Next.js app.
- Set a strong API key in the plugin settings to secure the REST endpoint.
- Consider implementing additional authentication mechanisms for the REST endpoint.

## Troubleshooting

- If the configurator is not displaying, check that the URL in the plugin settings is correct.
- If orders are not being created, check the browser console for errors and ensure the API key is correct.
- If the checkout redirect is not working, check that the WooCommerce checkout URL is accessible. 