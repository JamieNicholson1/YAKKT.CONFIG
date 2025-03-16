import { useState } from 'react';
import useConfiguratorStore from '@/store/configurator';
import { createOrder, redirectToCheckout } from '@/lib/api';

interface CheckoutState {
  isLoading: boolean;
  error: string | null;
  orderId: number | null;
}

const useCheckout = () => {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
    orderId: null,
  });

  const { chassisId, selectedOptionIds, chassis, options, priceData } = useConfiguratorStore();

  const handleCheckout = async () => {
    // Validate configuration
    if (!chassisId) {
      setState({
        ...state,
        error: 'Please select a chassis before checkout',
      });
      return;
    }

    try {
      setState({
        ...state,
        isLoading: true,
        error: null,
      });

      // Get the selected chassis
      const selectedChassis = chassis.find(c => c.id === chassisId);
      if (!selectedChassis) {
        throw new Error('Selected chassis not found');
      }

      // Get the selected components
      const selectedComponents = Array.from(selectedOptionIds).map(id => {
        const component = options.find(opt => opt.id === id);
        if (!component) {
          throw new Error(`Component with ID ${id} not found`);
        }
        return component;
      });

      // Create the order
      const response = await createOrder(
        selectedChassis.id,
        selectedChassis.name,
        selectedComponents,
        priceData.totalPrice
      );

      setState({
        isLoading: false,
        error: null,
        orderId: response.orderId,
      });

      // Redirect to checkout
      redirectToCheckout(response.checkoutUrl);
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return {
    ...state,
    handleCheckout,
  };
};

export default useCheckout; 