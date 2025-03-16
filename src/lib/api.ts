import { VanOption } from '@/types/configurator';

// This should be set in your environment variables
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://yakkt.com/wp-json';
const WORDPRESS_API_KEY = process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || '';
const WOOCOMMERCE_PRODUCT_ID = process.env.NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_ID || '123';

interface CheckoutPayload {
  productId: string | number;
  chassis: string;
  chassisName: string;
  components: Array<{
    id: string;
    name: string;
    price?: number;
  }>;
  totalPrice: number;
}

interface CheckoutResponse {
  success: boolean;
  orderId: number;
  checkoutUrl: string;
}

/**
 * Creates a WooCommerce order with the configurator data
 */
export const createOrder = async (
  chassisId: string,
  chassisName: string,
  selectedComponents: VanOption[],
  totalPrice: number
): Promise<CheckoutResponse> => {
  try {
    const payload: CheckoutPayload = {
      productId: WOOCOMMERCE_PRODUCT_ID,
      chassis: chassisId,
      chassisName: chassisName,
      components: selectedComponents.map(component => ({
        id: component.id,
        name: component.name,
        price: component.price
      })),
      totalPrice: totalPrice
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (WORDPRESS_API_KEY) {
      headers['X-Yakkt-API-Key'] = WORDPRESS_API_KEY;
    }

    const response = await fetch(`${WORDPRESS_API_URL}/yakkt/v1/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Redirects to the WooCommerce checkout page
 */
export const redirectToCheckout = (checkoutUrl: string): void => {
  window.location.href = checkoutUrl;
}; 