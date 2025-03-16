import React from 'react';
import useConfiguratorStore from '@/store/configurator';

interface PriceDisplayProps {
  detailed?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ detailed = false }) => {
  const { priceData, options } = useConfiguratorStore();
  const { totalPrice, chassisPrice, addOnPrices } = priceData;

  // Helper function to get option name from ID
  const getOptionName = (id: string): string => {
    const option = options.find(opt => opt.id === id);
    return option ? option.name : id;
  };

  const addOnsTotal = Object.values(addOnPrices).reduce((sum: number, price: number) => sum + price, 0);

  if (detailed) {
    return (
      <div className="space-y-4 font-mono">
        {Object.entries(addOnPrices).length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 uppercase tracking-wide">Selected Options</h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(addOnPrices).map(([id, price]) => (
                <div key={id} className="flex justify-between items-center">
                  <span className="text-gray-900">{getOptionName(id)}</span>
                  <span className="text-amber-500">+£{price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden font-mono">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Price Breakdown</h2>
      </div>
      
      <div className="p-4 space-y-4">
        {Object.entries(addOnPrices).length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-900">Selected Add-ons</div>
            {Object.entries(addOnPrices).map(([id, price]) => (
              <div key={id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">• {getOptionName(id)}</span>
                <span className="text-amber-600">+£{price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-2">
            No options selected yet
          </div>
        )}
        
        <div className="h-px bg-gray-200"></div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-amber-600">£{totalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceDisplay; 