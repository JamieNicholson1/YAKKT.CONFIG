# Yakkt Campervan Configurator WordPress Plugin

This directory contains the WordPress plugin that integrates the Next.js 3D Campervan Configurator with WordPress and WooCommerce, now with added Supabase integration for community builds sharing.

## Features

* Embed the 3D campervan configurator in your WordPress site
* Create WooCommerce orders with configuration details
* Share community builds through Supabase integration
* Secure API endpoints with key authentication

## Installation

1. Run the `package.sh` script to create a ZIP file of the plugin
2. Install the plugin in WordPress via the admin panel
3. Configure the plugin settings at Settings > Yakkt Configurator

## Configuration

The following settings must be configured:

* **Configurator URL**: The URL where your Next.js app is hosted
* **WooCommerce Product ID**: The ID of the product to use for orders
* **API Key**: (Optional) A key to secure the REST endpoint
* **Supabase URL**: Your Supabase project URL
* **Supabase Anonymous Key**: Your Supabase public API key

## REST API Endpoints

The plugin creates the following REST API endpoints:

### Create Order

```
POST /wp-json/yakkt/v1/create-order
```

This endpoint receives configuration data from the Next.js app and creates a WooCommerce order.

Example payload:

```json
{
  "productId": 123,
  "chassis": "sprinter",
  "chassisName": "Mercedes Sprinter",
  "components": [
    {
      "id": "roof_rack_1",
      "name": "Premium Roof Rack"
    }
  ],
  "totalPrice": 45000
}
```

### Community Builds (New in v1.1)

```
GET /wp-json/yakkt/v1/community-builds
```

Returns a list of community builds from Supabase.

### Get Build (New in v1.1)

```
GET /wp-json/yakkt/v1/build/{id}
```

Returns a specific build by ID.

### Save Build (New in v1.1)

```
POST /wp-json/yakkt/v1/save-build
```

Saves a new build to Supabase.

Example payload:

```json
{
  "title": "My Awesome Build",
  "description": "This is my dream campervan",
  "author": "John",
  "author_color": "#ff5500",
  "selected_chassis": "sprinter",
  "selected_options": ["Premium Roof Rack", "Off-Road Wheels"],
  "selected_option_ids": ["roof_rack_1", "wheels_2"],
  "email": "john@example.com"
}
```

### Like Build (New in v1.1)

```
POST /wp-json/yakkt/v1/like-build/{id}
```

Increments the like count for a specific build.

## Version History

* **1.1** - Added Supabase integration for community builds
* **1.0** - Initial release with basic WooCommerce integration

## Development

To update the plugin, edit the files in the `yakkt-campervan-configurator` directory, then run the `package.sh` script to create a new ZIP file. 