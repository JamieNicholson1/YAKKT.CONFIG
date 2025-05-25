import React from 'react';
import useConfiguratorStore from '@/store/configurator';
import { Truck, Sparkles, Clock } from 'lucide-react';
import { VanOption } from '@/types/configurator';

interface PriceDisplayProps {
  detailed?: boolean;
}

// This should be kept in sync with the one in the store, or ideally imported if possible
// For now, duplicating here for use in PriceDisplay's specific logic.
const NON_DISCOUNTABLE_ITEM_IDS = [
  'flares',
  'front-bull-bar',
  'lazer-lights-grille',
  'fiamma-awning',
  'front-runner-wolfpack-pro-2x-l',
  'front-runner-wolfpack-pro-2x-r',
  'front-runner-wolfpack-pro-1x-m'
];

const PriceDisplay: React.FC<PriceDisplayProps> = ({ detailed = false }) => {
  const { priceData, options, selectedOptionIds } = useConfiguratorStore();
  const { totalPrice, addOnPrices } = priceData;

  // Helper function to get option details from ID
  const getOption = (id: string): VanOption | undefined => {
    return options.find(opt => opt.id === id);
  };

  // Calculate savings based on total price using tiered discount system,
  // excluding non-discountable items from the discount calculation.
  const calculateSavings = (
    currentTotalPrice: number,
    currentSelectedOptionIds: Set<string>,
    allOptions: VanOption[]
  ): { percentage: number; amount: number; finalPrice: number; discountableSubtotal: number; nonDiscountableSubtotal: number } => {
    
    let nonDiscountableSubtotal = 0;
    currentSelectedOptionIds.forEach(optionId => {
      if (NON_DISCOUNTABLE_ITEM_IDS.includes(optionId)) {
        const option = allOptions.find(opt => opt.id === optionId);
        nonDiscountableSubtotal += option?.price || 0;
      }
    });

    const discountableSubtotal = currentTotalPrice - nonDiscountableSubtotal;

    if (discountableSubtotal < 1750) {
      return { 
        percentage: 0, 
        amount: 0, 
        finalPrice: currentTotalPrice, 
        discountableSubtotal, 
        nonDiscountableSubtotal 
      };
    }
    
    const amountOver1750 = discountableSubtotal - 1750;
    const savingTiers = Math.floor(amountOver1750 / 200);
    const savingPercentage = Math.min(savingTiers + 1, 12.5); // Cap at 12.5%
    const savingAmount = (discountableSubtotal * savingPercentage) / 100;
    const finalPrice = currentTotalPrice - savingAmount;
    
    return {
      percentage: savingPercentage,
      amount: savingAmount,
      finalPrice,
      discountableSubtotal,
      nonDiscountableSubtotal
    };
  };

  // Get savings amount and percentage
  const { 
    percentage: savingsPercentage, 
    amount: savingsAmount, 
    finalPrice,
    // discountableSubtotal, // For debugging if needed
    // nonDiscountableSubtotal // For debugging if needed
  } = calculateSavings(totalPrice, selectedOptionIds, options);

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

  if (detailed) {
    return (
      <div className="space-y-6 font-mono">
        {/* Bundle deal savings badge - now more prominent */}
        {savingsAmount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 flex items-center shadow-sm">
            <div className="flex-shrink-0 mr-3">
              <div className="bg-amber-500/20 p-2 rounded-full">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="font-bold text-amber-800 text-lg">
                Save £{savingsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({savingsPercentage.toFixed(1)}%)
              </div>
              <div className="text-sm text-amber-700">
                Bundle discount applied to eligible items!
              </div>
            </div>
          </div>
        )}
        
        {/* Selected Options with thumbnails */}
        {Object.entries(addOnPrices).length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
              <button 
                onClick={() => setExpandedItems(prev => !prev)} 
                className="flex justify-between items-center w-full font-semibold text-sm text-gray-900 uppercase tracking-wide"
                aria-expanded={expandedItems}
              >
                <span>What&apos;s Included ({Object.entries(addOnPrices).length} items)</span>
                <div className={`transition-transform duration-200 ${expandedItems ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </button>
            </div>
            
            {expandedItems && (
              <div className="p-3 space-y-2">
                {Object.entries(addOnPrices).map(([id, price]) => {
                  const option = getOption(id);
                  const optionName = option ? option.name : id;
                  const description = getOptionDescription(id);
                  
                  // Track the expanded state of this specific item
                  const isItemExpanded = expandedItemIds.includes(id);
                  
                  return (
                    <div key={id} className="border border-gray-100 rounded-md overflow-hidden">
                      {/* Item header with expand/collapse functionality */}
                      <div 
                        className="flex items-center p-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        onClick={() => toggleItemExpanded(id)}
                      >
                        {/* Item details */}
                        <div className="flex-grow flex justify-between items-center w-full">
                          <span className="text-gray-900 text-sm font-medium truncate pr-2 max-w-[60%]">
                            {optionName}
                          </span>
                          <div className="flex items-center flex-shrink-0 ml-auto">
                            <span className={`text-sm mr-2 whitespace-nowrap ${NON_DISCOUNTABLE_ITEM_IDS.includes(id) ? 'text-gray-500' : 'text-amber-500'}`}>
                              +£{price.toLocaleString()}
                              {NON_DISCOUNTABLE_ITEM_IDS.includes(id) && <span className="text-xs text-gray-400 ml-1">(Full Price)</span>}
                            </span>
                            <div className={`transition-transform duration-200 w-5 flex items-center justify-center ${isItemExpanded ? 'rotate-180' : ''}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expandable description area */}
                      {isItemExpanded && description && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-700">
                          {description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Delivery estimate - NEW SECTION */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
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
        
        {/* Payment options */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          {savingsAmount > 0 && (
            <div className="flex justify-between items-center text-sm text-green-600">
              <span>Bundle Discount</span>
              <span>- £{savingsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm text-gray-700">
            <span>Subtotal (Before Discount)</span>
            <span>£{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-gray-900 font-medium text-lg">Total Price</span>
            <span className="text-2xl font-bold text-black">£{finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden font-mono">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
          Configuration Total
        </h2>
      </div>
      <div className="p-4 space-y-2">
        {Object.entries(addOnPrices).length > 0 && savingsAmount > 0 && (
          <div className="flex justify-between items-center text-sm text-green-700">
            <span>Bundle Savings</span>
            <span className="font-medium">- £{savingsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xl">
          <span className="text-gray-900 font-semibold">Total Price</span>
          <span className="text-black font-bold">£{finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
         {Object.entries(addOnPrices).length > 0 && totalPrice !== finalPrice && (
          <div className="text-xs text-gray-500 text-right">
            (was £{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </div>
        )}
        {Object.entries(addOnPrices).length === 0 && (
          <div className="text-sm text-gray-500">Select options to see price.</div>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay; 