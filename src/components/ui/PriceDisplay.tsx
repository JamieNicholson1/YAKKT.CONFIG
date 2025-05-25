import React from 'react';
import useConfiguratorStore from '@/store/configurator';
import { Truck, Sparkles, Clock, AlertCircle } from 'lucide-react';

// List of items excluded from discount
const DISCOUNT_EXCLUDED_ITEMS = [
  'flares', // Flares
  'front-bull-bar', // Bull bar
  'lazer-lights-grille', // Grille lights
  'bravo-snorkel', // Snorkel
  'black-rhino-wheels', // Premium wheels - corrected ID
  'standard-wheels', // Standard wheels
  'fiamma-awning', // Fiamma awning - corrected ID
  'front-runner-wolfpack-pro-2x-l', // Front Runner Wolfpack - Left
  'front-runner-wolfpack-pro-2x-r', // Front Runner Wolfpack - Right
  'front-runner-wolfpack-pro-1x-m', // Front Runner Wolfpack - Middle
];

// Items that are purely visual and should not appear in the summary
const VISUAL_ONLY_ITEMS = [
  'black-rhino-wheels',
  'standard-wheels'
];

// Helper function to check if an item is excluded from discount
const isExcludedFromDiscount = (id: string) => {
  return DISCOUNT_EXCLUDED_ITEMS.includes(id);
};

// Helper function to check if an item is visual only
const isVisualOnly = (id: string) => {
  return VISUAL_ONLY_ITEMS.includes(id);
};

interface PriceDisplayProps {
  detailed?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ detailed = false }) => {
  const { priceData, options } = useConfiguratorStore();
  const { 
    totalPrice, 
    addOnPrices, 
    discountPercentage, 
    discountAmount, 
    finalPrice,
    discountablePrice,
    nonDiscountablePrice
  } = priceData;

  // Helper function to get option details from ID
  const getOption = (id: string) => {
    return options.find(opt => opt.id === id);
  };

  // Get option description
  const getOptionDescription = (id: string) => {
    const option = getOption(id);
    if (!option) return '';
    
    // Custom descriptions based on product name
    const customDescriptions: Record<string, string> = {
      "Flares": "Extend van width for extra space. Sleek design.",
      "Black Rhino Warlord BFG AT": "17\" Black Dark Tint wheels with 225/65/17 BF Goodrich T/A KO2 tyres.",
      "Black Rhino Warlord": "17\" Black Dark Tint wheels with 225/65/17 BF Goodrich T/A KO2 tyres.",
      "Bravo Snorkel": "Raise air intake. Protects engine off-road.",
      "Front Bull Bar": "Front-end protection. Strong, clean design.",
      "Lazer Lights - Grille": "Grille-mounted Lazer LED lights for enhanced visibility.",
      "Base Rack": "5083 aluminum roof rack. Powder-coated textured black.",
      "Deck Panels": "Single walkable 5083 aluminum panel. Textured black.",
      "Full Deck": "9x 5083 aluminum panels. Full roof coverage.",
      "Full Deck Rear MaxxFan": "9x deck panels with MaxxFan cutout.",
      "Rear Deck": "3x rear 5083 aluminum panels. Rugged surface.",
      "Rear Deck Rear MaxxFan": "3x rear panels with MaxxFan cutout.",
      "Middle Deck": "3x middle panels. Strong walkable surface.",
      "Front Deck": "3x front panels. Durable roof access.",
      "Awning Brackets": "Set of 3 brackets. Powder-coated 5083 aluminum.",
      "Fiamma F45s Awning 3.2m": "3.2m durable awning. Black/anthracite.",
      "Side Ladder": "5083 aluminum ladder. Powder-coated black.",
      "10x L-Track Eyelets": "10 strong eyelets. Secure your gear.",
      "Front Runner Wolfpack Pro - 2x L": "Two Front Runner WolfPack Pro storage boxes (Left side), robust and stackable.",
      "Front Runner Wolfpack Pro - 2x R": "Two Front Runner WolfPack Pro storage boxes (Right side), robust and stackable.",
      "Front Runner Wolfpack Pro - 1x M": "Single Front Runner WolfPack Pro storage box (Middle), robust and stackable.",
      "NS Mini Carrier": "Near-side compact carrier. Aluminum, black coated.",
      "OS Mini Carrier": "Off-side compact carrier. Aluminum, black coated.",
      "NS Midi Carrier": "Near-side mid-size carrier. 5083 aluminum.",
      "OS Midi Carrier": "Off-side mid-size carrier. Durable aluminum.",
      "Wheel Carrier Module": "Spare wheel mount. Heavy-duty 5083 aluminum."
    };
    
    // Check if we have a custom description for this item
    if (option.name && customDescriptions[option.name]) {
      return customDescriptions[option.name];
    }
    
    // Fallback to the option description from the data if available
    return option.description || '';
  };

  // Get estimated delivery time based on selected options
  const getEstimatedDelivery = () => {
    // Always return 5-7 working days
    return { min: 5, max: 7 };
  };
  
  const deliveryTime = getEstimatedDelivery();

  const [expandedItems, setExpandedItems] = React.useState(true);
  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([]);

  const toggleItemExpanded = (id: string) => {
    if (expandedItemIds.includes(id)) {
      setExpandedItemIds(prev => prev.filter(i => i !== id));
    } else {
      setExpandedItemIds(prev => [...prev, id]);
    }
  };

  // Filter out visual-only items from the addOnPrices for display
  const filteredAddOnPrices = Object.entries(addOnPrices)
    .filter(([id]) => !isVisualOnly(id))
    .reduce((acc, [id, price]) => {
      acc[id] = price;
      return acc;
    }, {} as Record<string, number>);

  // Group options by discount eligibility (excluding visual-only items)
  const groupedOptions = Object.entries(filteredAddOnPrices).reduce(
    (acc, [id, price]) => {
      if (isExcludedFromDiscount(id)) {
        acc.excluded.push({ id, price });
      } else {
        acc.included.push({ id, price });
      }
      return acc;
    },
    { included: [] as { id: string; price: number }[], excluded: [] as { id: string; price: number }[] }
  );

  if (detailed) {
    return (
      <div className="space-y-6 font-mono">
        {/* 12.5% Discount banner - more compact and with smaller font */}
        {discountPercentage > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3 flex items-center shadow-sm">
            <div className="flex-shrink-0 mr-3">
              <div className="bg-amber-500/20 p-2 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="font-medium text-amber-800 text-base">{discountPercentage}% Discount</div>
              <div className="text-xs text-amber-700">
                When purchased as a bundle
              </div>
            </div>
          </div>
        )}
        
        {/* Price Breakdown - reduced font sizes */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm">Subtotal</span>
            <span className="text-sm">£{totalPrice.toLocaleString()}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-amber-600">
              <span className="text-sm">Bundle Discount ({discountPercentage}%)</span>
              <span className="text-sm">-£{discountAmount.toLocaleString()}</span>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-900 text-sm font-medium">Total Price</span>
            <span className="text-base font-medium text-black">£{finalPrice.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Selected Options with thumbnails - smaller headings */}
        {Object.entries(filteredAddOnPrices).length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-2 border-b border-gray-200">
              <button 
                onClick={() => setExpandedItems(prev => !prev)} 
                className="flex justify-between items-center w-full font-medium text-xs text-gray-900 uppercase tracking-wide"
                aria-expanded={expandedItems}
              >
                <span>What&apos;s Included ({Object.entries(filteredAddOnPrices).length} items)</span>
                <div className={`transition-transform duration-200 ${expandedItems ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </button>
            </div>
            
            {expandedItems && (
              <div className="p-2 space-y-3">
                {/* Discount-eligible components */}
                {groupedOptions.included.length > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-gray-700 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                      Discount-Eligible Components
                    </h3>
                    <div className="space-y-1 pl-1">
                      {groupedOptions.included.map(({ id, price }) => {
                        const option = getOption(id);
                        const optionName = option ? option.name : id;
                        const description = getOptionDescription(id);
                        const isItemExpanded = expandedItemIds.includes(id);
                        
                        return (
                          <div key={id} className="border border-gray-100 rounded-md overflow-hidden">
                            <div 
                              className="flex items-center p-1.5 cursor-pointer bg-gray-50 hover:bg-gray-100"
                              onClick={() => toggleItemExpanded(id)}
                            >
                              <div className="flex-grow flex justify-between items-center w-full">
                                <span className="text-gray-900 text-sm font-medium truncate pr-2 max-w-[65%]">
                                  {optionName}
                                </span>
                                <div className="flex items-center flex-shrink-0 ml-auto">
                                  <span className="text-amber-500 text-sm mr-1 whitespace-nowrap">+£{price.toLocaleString()}</span>
                                  <div className={`transition-transform duration-200 w-4 flex items-center justify-center ${isItemExpanded ? 'rotate-180' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m6 9 6 6 6-6"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {isItemExpanded && description && (
                              <div className="p-2 bg-gray-50 border-t border-gray-100 text-sm text-gray-700">
                                {description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Non-discountable components */}
                {groupedOptions.excluded.length > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-gray-700 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1 text-gray-500" />
                      Components Not Eligible for Discount
                    </h3>
                    <div className="space-y-1 pl-1">
                      {groupedOptions.excluded.map(({ id, price }) => {
                        const option = getOption(id);
                        const optionName = option ? option.name : id;
                        const description = getOptionDescription(id);
                        const isItemExpanded = expandedItemIds.includes(id);
                        
                        return (
                          <div key={id} className="border border-gray-100 rounded-md overflow-hidden">
                            <div 
                              className="flex items-center p-1.5 cursor-pointer bg-gray-50 hover:bg-gray-100"
                              onClick={() => toggleItemExpanded(id)}
                            >
                              <div className="flex-grow flex justify-between items-center w-full">
                                <span className="text-gray-900 text-sm font-medium truncate pr-2 max-w-[65%]">
                                  {optionName}
                                </span>
                                <div className="flex items-center flex-shrink-0 ml-auto">
                                  <span className="text-gray-500 text-sm mr-1 whitespace-nowrap">+£{price.toLocaleString()}</span>
                                  <div className={`transition-transform duration-200 w-4 flex items-center justify-center ${isItemExpanded ? 'rotate-180' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m6 9 6 6 6-6"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {isItemExpanded && description && (
                              <div className="p-2 bg-gray-50 border-t border-gray-100 text-sm text-gray-700">
                                {description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Delivery estimate - updated with smaller fonts */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">Delivery Estimate</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Truck className="w-4 h-4 mr-2 text-amber-500" />
              <span className="text-gray-700">Estimated Delivery</span>
            </div>
            <span className="font-medium text-amber-700">{deliveryTime.min}-{deliveryTime.max} working days</span>
          </div>
          
          <div className="text-xs text-gray-500 pl-6">
            Free shipping within mainland UK
          </div>
        </div>
      </div>
    );
  }

  // Simplified view for non-detailed display
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden font-mono">
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-900 tracking-tight">What&apos;s Included ({Object.entries(filteredAddOnPrices).length} Items)</h2>
      </div>
      
      <div className="p-3 space-y-3">
        {/* Discount-eligible components */}
        {groupedOptions.included.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-amber-500" />
              Discount-Eligible Components
            </h3>
            {groupedOptions.included.map(({ id, price }) => (
              <div key={id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate pr-2 max-w-[65%]">• {getOption(id)?.name || id}</span>
                <span className="text-amber-600 flex-shrink-0 whitespace-nowrap">+£{price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Non-discountable components */}
        {groupedOptions.excluded.length > 0 && (
          <div className="space-y-2 pt-3 mt-3 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 text-gray-500" />
              Components Not Eligible for Discount
            </h3>
            {groupedOptions.excluded.map(({ id, price }) => (
              <div key={id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate pr-2 max-w-[65%]">• {getOption(id)?.name || id}</span>
                <span className="text-gray-500 flex-shrink-0 whitespace-nowrap">+£{price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay; 