# Yakkt Campervan Configurator

A Next.js 3D Campervan Configurator with WordPress/WooCommerce integration.

## Overview

This project is a 3D configurator for campervans that allows users to:

- Select a chassis
- Configure exterior components (windows, wheels, roof racks, etc.)
- See dynamic pricing
- Place orders in WooCommerce

The project consists of two main parts:
1. A Next.js application with React Three Fiber for 3D rendering
2. A WordPress plugin for integration with WooCommerce

## Getting Started

### Next.js App

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Create a `.env.local` file with the following variables:

```
# WordPress API URL
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-site.com/wp-json

# WordPress API Key (leave empty for development)
NEXT_PUBLIC_WORDPRESS_API_KEY=your-api-key

# WooCommerce Product ID for the "Configurable Campervan" product
NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_ID=123
```

## WordPress Integration

The `wordpress-plugin` directory contains a custom WordPress plugin for integrating the configurator with WordPress and WooCommerce.

### Plugin Features

- Shortcode `[yakkt_campervan_configurator]` for embedding the configurator
- Gutenberg block for easy embedding
- REST API endpoint for creating WooCommerce orders
- Settings page for configuration

### Installation

See the [WordPress Plugin README](wordpress-plugin/README.md) for detailed installation and configuration instructions.

## Deployment

### Next.js App

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### WordPress Plugin

1. Zip the `yakkt-campervan-configurator` directory
2. Upload to your WordPress site via the admin panel
3. Configure the plugin settings

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
