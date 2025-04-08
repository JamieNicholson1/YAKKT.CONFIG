## Product Name
**YAKKT Van Builder** An exterior 3D visualisation tool for customers to design their vehicle online.

## Purpose & Scope

## Key Features
1. **xxx**
2. **Xxxx**

-----

### Feature Requirements

1. Project Overview
1.1 Purpose
Goal: Build an interactive 3D Campervan Configurator using Next.js and React, integrating with WordPress/WooCommerce to handle product data, pricing, and orders.
Primary Users:
Prospective campervan buyers who want to visualize their van with different options (chassis, racks, wheels, carriers, etc.).
Sales/admin staff (to manage or update the 3D models, pricing, and product data in the back end).
1.2 Scope
A front-end interface (Next.js + React) where users can:

Select a chassis (mutually exclusive).
Toggle exterior options (some are exclusive to each other; some can stack).
View updated pricing in real time based on selections.
Add the final configuration to the WooCommerce cart for checkout.
Back end to be powered by:

WordPress + WooCommerce (to store product & configuration data and process orders).
Possibly a small Node.js/Next.js serverless API or custom WP plugin for configurator-specific data, if needed.
1.3 Tech Stack
Front End:
Next.js (framework),
React (UI),
React Three Fiber (3D rendering),
Three.js (core 3D library, if needed behind React Three Fiber).
Back End:
WordPress + WooCommerce (hosted, or headless approach using WooCommerce REST API).
Optional: A custom Node.js/Express or serverless function to handle any specialized data transformations not covered by WooCommerce APIs.
2. Features
2.1 3D Vehicle Visualization
Description: Renders a 3D model of the campervan, allowing real-time updates of selected chassis, roof racks, wheels, carriers, etc.
Models: Each selectable part is a separate .glb or .gltf file that gets loaded dynamically.
2.2 Toggleable Options & Mutually Exclusive Choices
Description: Users can toggle certain add-ons (roof racks, wheels, rear door carriers). Some are mutually exclusive; some can be combined.
UI: Toggling checkboxes, radio buttons, or interactive menus that immediately reflect changes on the 3D model and the price.
2.3 Real-time Price Calculation
Description: Summation of the base van plus each selected option. Dynamically updated on the front end. Price data comes from WooCommerce or a custom product data endpoint.
2.4 Add to Cart & Checkout (WooCommerce Integration)
Description: Once the user finalizes the configuration, they can add the built configuration to a WooCommerce cart. The WooCommerce checkout flow should handle payment and order generation.
2.5 Administrative/Editor UI (Optional for MVP)
Description: A WordPress admin interface (or custom plugin settings page) to manage:
Pricing for each add-on.
3D model references (URLs or file locations).
Exclusion rules (i.e., which parts are exclusive vs. combinable).
3. Requirements For Each Feature
3.1 3D Vehicle Visualization
Loading Models

Must use .glb format for each separate component (chassis, wheels, roof rack, etc.).
The base environment or scene can also be loaded as a .glb (or be a static environment).
React Three Fiber used for rendering.
Dependency: @react-three/fiber, three, @react-three/drei (common R3F helpers).
Key Variables:
vanBaseModelUrl: string (URL to the default van chassis .glb).
roofRackModelUrl: string (URL to each roof rack model).
wheelModelUrl: string (URL to each wheel model).
Etc.
Scene Setup

A single <Canvas> component from React Three Fiber containing lighting, camera positioning, and background environment.
Components (e.g., <VanModel />, <Wheels />, <RoofRack />) conditionally rendered or hidden based on user selections.
Performance Considerations

Use Suspense and lazy-load models to avoid blocking.
Possibly compress or optimize .glb files.
3.2 Toggleable Options & Mutually Exclusive Choices
Data Source for Options

Option 1: Hardcode all options in a config file in the Next.js codebase.
Option 2: Fetch from WordPress (using WP REST API or custom fields) so that new options can be added from the WP Admin.
Variable Names:
availableOptions: Array<Option> – each Option containing:
ts
Copy
Edit
interface Option {
  id: string;
  name: string;
  price: number;
  modelUrl: string;
  isExclusive: boolean; // indicates if it conflicts with others
  conflictsWith?: string[]; // list of IDs that it conflicts with
}
UI State Management

Could use React useState or a state management library like Redux/Zustand.
Example states:
selectedChassis: string
selectedOptions: Set<string>
For exclusive items, when one is selected, the conflicting items should be automatically removed (or visually disabled).
UX Requirements

If an item is exclusive, it should appear as a radio button, or disable conflicting items after selection.
3.3 Real-time Price Calculation
Price Composition

Base Price: The chosen chassis’ base price.
Add-on Price: Sum of the prices of selected add-ons.
Formula:
plaintext
Copy
Edit
totalPrice = chassisPrice + sum(selectedOptions.map(option => option.price))
Display

Must update whenever selectedChassis or selectedOptions changes.
Show final numeric total and currency symbol (e.g., $, €, etc., depending on config).
Data Source

Price data can come from:
A dedicated custom route in WordPress or Next.js that returns JSON for all options.
Directly from WooCommerce product listings if each add-on is a “product” or “variation”.
3.4 Add to Cart & Checkout (WooCommerce Integration)
WooCommerce REST API
If you’re running a headless approach (Next.js + WP REST):
You’ll call the WooCommerce REST API to create a cart/checkout session.
Alternatively, use the standard WordPress site’s Cart/Checkout flow by linking out or embedding.
Endpoints
Create/Update Cart: POST /wp-json/wc/v3/cart
Or a custom endpoint if standard one is not sufficient.
Order Creation: POST /wp-json/wc/v3/orders
Note: WooCommerce may need a plugin for official cart endpoints in headless mode.
Data to Send
The selected configuration (IDs of the chassis and each selected add-on).
The final price or product variant ID that encapsulates all selections.
Security & Authentication
Use consumer key/secret or OAuth token for the WooCommerce REST API calls.
Ensure you’re not exposing any sensitive info client-side.
3.5 Administrative/Editor UI (Optional)
If you want to manage 3D models and pricing from WordPress:
Create custom post types: “Campervan Options,” “Chassis,” etc.
Custom fields for price, modelUrl, conflictsWith, etc.
A simple React plugin or ACF/Meta Box fields in WP.
4. Data Models
Below is a recommended shape for your data in the front end. Adjust as needed for your actual logic.

ts
Copy
Edit
// 4.1 Chassis
interface Chassis {
  id: string;
  name: string;
  basePrice: number;
  modelUrl: string; // .glb
}

// 4.2 Add-on Option
interface VanOption {
  id: string;
  name: string;
  price: number;
  modelUrl: string;  // .glb
  isExclusive: boolean;
  conflictsWith: string[];
}

// 4.3 User Selections
interface ConfigSelection {
  chassisId: string;          // Reference to Chassis.id
  selectedOptionIds: string[]; // List of chosen option IDs
}

// 4.4 Pricing
interface PriceData {
  totalPrice: number;
  chassisPrice: number;
  addOnPrices: { [optionId: string]: number };
}
5. Required APIs
Depending on how you set up your stack, these are the typical APIs you’ll need:

5.1 Fetching Available Models & Pricing
WordPress/WooCommerce REST Endpoint: GET /wp-json/wc/v3/products?category=campervan_options

Returns an array of product data. Possibly filter or transform so the front end gets only { id, name, price, modelUrl, conflicts }.
Custom REST Endpoint (Optional): GET /api/campervan-config

If WooCommerce doesn’t store your modelUrl or conflict relationships directly, you can create a custom endpoint that merges data from your custom WP post type with product pricing.
Response Example:

json
Copy
Edit
{
  "chassis": [
    {
      "id": "chassis_sprinter",
      "name": "Mercedes Sprinter",
      "basePrice": 50000,
      "modelUrl": "/models/sprinter.glb"
    },
    {
      "id": "chassis_transit",
      "name": "Ford Transit",
      "basePrice": 40000,
      "modelUrl": "/models/transit.glb"
    }
  ],
  "options": [
    {
      "id": "roof_rack_1",
      "name": "Roof Rack A",
      "price": 1500,
      "modelUrl": "/models/roofRackA.glb",
      "isExclusive": false,
      "conflictsWith": []
    },
    {
      "id": "rear_door_carrier",
      "name": "Rear Door Carrier",
      "price": 1000,
      "modelUrl": "/models/rearCarrier.glb",
      "isExclusive": false,
      "conflictsWith": []
    },
    {
      "id": "wheel_set_A",
      "name": "Off-Road Wheels",
      "price": 1200,
      "modelUrl": "/models/wheelsOffRoad.glb",
      "isExclusive": true,
      "conflictsWith": ["wheel_set_B"]
    }
  ]
}
5.2 Add to Cart & Checkout
WooCommerce Cart Endpoint – If you have a direct cart API in your WP/WooCommerce install:

POST /wp-json/wc/store/cart/add-item
Body Example:
json
Copy
Edit
{
  "id": "product_id_for_configurable_camper",
  "quantity": 1,
  "attributes": {
    "chassis": "chassis_sprinter",
    "options": ["roof_rack_1", "wheel_set_A"]
  }
}
If you don’t have a custom product that holds all attributes, you might need to create an “order” with line items for each selection instead.
WooCommerce Orders Endpoint: POST /wp-json/wc/v3/orders

Typically used to finalize an order if you’re managing the entire process headlessly.
Authentication:

Provided via Basic Auth or OAuth in the header, or specialized tokens from your WordPress site.
Additional Notes & Best Practices
File Hosting for 3D Models

Ensure .glb files are available over a CDN or hosted on the same domain.
Be mindful of large file sizes and performance.
Front-end Routing

Possibly have a route like /configurator in your Next.js app that loads all configuration data on mount.
State Preservation

If you want the user to share a configured link, you can store selected items in the URL query params (e.g., ?chassis=chassis_sprinter&options=roof_rack_1,wheel_set_A).
Error Handling

When fetching data from the WP site, handle the scenario if an option is no longer available or pricing changes mid-session.
Styling & Layout

Use standard React or Next.js styling solutions like CSS modules or styled-components.
Keep the 3D canvas responsive and ensure it gracefully resizes on mobile.
