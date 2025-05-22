import { VanOption } from '@/types/configurator';

// This is for client-side display only
const WOOCOMMERCE_PRODUCT_ID = process.env.NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_ID || '123';

interface CheckoutPayload {
  productId: string | number;
  chassis: string;
  chassisName: string;
  components: Array<{
    id: string;
    name: string;
    price?: number;
    description?: string;
    category?: string;
  }>;
  totalPrice: number;
}

interface CheckoutResponse {
  success: boolean;
  orderId?: number;
  checkoutUrl?: string;
  addUrl?: string;
}

/**
 * Creates a WooCommerce order with the configurator data
 * Uses our proxy API route to avoid CORS issues
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
        price: component.price,
        description: component.description || '',
        category: component.category || ''
      })),
      totalPrice: totalPrice
    };

    console.log('Sending order to proxy:', payload);

    // Use our proxy API route instead of WordPress directly
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from proxy:', errorData);
      throw new Error(errorData.error || errorData.message || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Redirects to the WooCommerce checkout page in the parent window
 * This prevents the checkout from loading inside the iframe
 */
export const redirectToCheckout = (url: string): void => {
  if (!url) {
    console.error('No URL provided for checkout redirection');
    return;
  }

  // First try to detect if we're in an iframe
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      // If we can't access window.top due to cross-origin restrictions,
      // assume we're in an iframe
      return true;
    }
  })();

  // If we're in an iframe, try to communicate with the parent
  if (isInIframe) {
    try {
      // Try postMessage first (more compatible with cross-origin setups)
      console.log('Attempting to postMessage to parent with checkout URL');
      window.parent.postMessage({
        type: 'YAKKT_CHECKOUT',
        payload: { checkoutUrl: url, addUrl: url }
      }, '*');
      
      // If postMessage doesn't get intercepted, after a short delay try direct redirect as fallback
      const redirectTimeout = setTimeout(() => {
        try {
          // Check if window.top is accessible (this may fail for cross-origin iframes)
          if (window.top) {
            console.log('Falling back to direct parent redirection');
            window.top.location.href = url;
          }
        } catch (e) {
          console.warn('Could not access parent window for direct redirect');
          window.location.href = url; // Final fallback
        }
      }, 300);

      // Add a flag to know we're trying the iframe navigation approach
      (window as any).__checkoutRedirectAttempted = true;
      
      return;
    } catch (e) {
      console.warn('Failed to communicate with parent window:', e);
      // Continue to default redirect
    }
  }

  // Default redirect if we're not in an iframe or can't access the parent
  console.log('Performing standard window location redirect');
  window.location.href = url;
}; 