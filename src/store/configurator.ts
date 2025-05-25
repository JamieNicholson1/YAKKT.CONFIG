import { create } from 'zustand';
import { ConfiguratorState, VanOption, ConfigSelection } from '@/types/configurator';

// List of items excluded from discount calculation
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

// Function to check if an option is excluded from discount
const isExcludedFromDiscount = (optionId: string): boolean => {
  return DISCOUNT_EXCLUDED_ITEMS.includes(optionId);
};

// Calculate price with separate tracking for discountable and non-discountable items
const calculatePrice = (state: ConfigSelection, options: VanOption[], chassisPrice: number = 0): { 
  totalPrice: number; 
  discountablePrice: number;
  nonDiscountablePrice: number;
  addOnPrices: Record<string, number>;
} => {
  if (!state.chassisId) return { 
    totalPrice: 0, 
    discountablePrice: 0, 
    nonDiscountablePrice: 0, 
    addOnPrices: {} 
  };
  
  let discountablePrice = 0;
  let nonDiscountablePrice = 0;
  const addOnPrices: Record<string, number> = {};

  // Calculate prices for selected options
  Array.from(state.selectedOptionIds).forEach(optionId => {
    const option = options.find(opt => opt.id === optionId);
    if (!option) return;
    
    // Store the price in addOnPrices
    addOnPrices[optionId] = option.price;
    
    // Add to the appropriate price category
    if (isExcludedFromDiscount(optionId)) {
      nonDiscountablePrice += option.price;
    } else {
      discountablePrice += option.price;
    }
  });

  // Add chassis price to discountable total (chassis is usually eligible for discount)
  discountablePrice += chassisPrice;
  
  // Total price is the sum of both categories
  const totalPrice = discountablePrice + nonDiscountablePrice;

  return { 
    totalPrice, 
    discountablePrice, 
    nonDiscountablePrice,
    addOnPrices 
  };
};

// Calculate savings based on discountable price using tiered discount system
const calculateSavings = (discountablePrice: number): { percentage: number; amount: number } => {
  if (discountablePrice < 1750) return { percentage: 0, amount: 0 };
  
  const amountOver1750 = discountablePrice - 1750;
  const savingTiers = Math.floor(amountOver1750 / 200);
  const savingPercentage = Math.min(savingTiers + 1, 17.5); // Increased cap from 12.5% to 17.5%
  const savingAmount = Math.round((discountablePrice * savingPercentage) / 100);
  
  return {
    percentage: savingPercentage,
    amount: savingAmount
  };
};

const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  // Base state
  chassisId: null,
  selectedOptionIds: new Set(),
  chassis: [],
  options: [],
  priceData: {
    totalPrice: 0,
    chassisPrice: 0,
    discountablePrice: 0,
    nonDiscountablePrice: 0,
    addOnPrices: {},
    discountPercentage: 0,
    discountAmount: 0,
    finalPrice: 0,
  },
  isLoading: false,
  error: null,

  // Additional required properties
  vehicleModel: null,
  windowsFlares: [],
  wheels: null,
  exteriorAccessories: [],
  rearDoorCarriers: [],
  rearDoorAccessories: [],
  roofRack: null,
  roofRackAccessories: [],
  totalPrice: 0,

  // Actions
  setChassis: (chassisId: string) => {
    const chassis = get().chassis.find(c => c.id === chassisId);
    if (!chassis) return;

    const priceInfo = calculatePrice(
      { chassisId, selectedOptionIds: get().selectedOptionIds },
      get().options,
      chassis.basePrice
    );
    
    const savings = calculateSavings(priceInfo.discountablePrice);
    const finalPrice = priceInfo.totalPrice - savings.amount;

    set(state => ({
      chassisId,
      priceData: {
        ...state.priceData,
        chassisPrice: chassis.basePrice,
        totalPrice: priceInfo.totalPrice,
        discountablePrice: priceInfo.discountablePrice,
        nonDiscountablePrice: priceInfo.nonDiscountablePrice,
        addOnPrices: priceInfo.addOnPrices,
        discountPercentage: savings.percentage,
        discountAmount: savings.amount,
        finalPrice: finalPrice,
      },
    }));
  },

  toggleOption: (optionId: string) => {
    set(state => {
      const option = state.options.find(opt => opt.id === optionId);
      if (!option) return state;

      const newSelectedOptions = new Set(state.selectedOptionIds);

      if (newSelectedOptions.has(optionId)) {
        newSelectedOptions.delete(optionId);
      } else {
        // Handle exclusive options
        if (option.isExclusive) {
          option.conflictsWith.forEach(conflictId => {
            newSelectedOptions.delete(conflictId);
          });
        }
        newSelectedOptions.add(optionId);
      }

      const chassis = state.chassis.find(c => c.id === state.chassisId);
      const chassisPrice = chassis?.basePrice || 0;
      
      const priceInfo = calculatePrice(
        { chassisId: state.chassisId, selectedOptionIds: newSelectedOptions },
        state.options,
        chassisPrice
      );
      
      const savings = calculateSavings(priceInfo.discountablePrice);
      const finalPrice = priceInfo.totalPrice - savings.amount;

      return {
        ...state,
        selectedOptionIds: newSelectedOptions,
        priceData: {
          ...state.priceData,
          totalPrice: priceInfo.totalPrice,
          discountablePrice: priceInfo.discountablePrice,
          nonDiscountablePrice: priceInfo.nonDiscountablePrice,
          addOnPrices: priceInfo.addOnPrices,
          discountPercentage: savings.percentage,
          discountAmount: savings.amount,
          finalPrice: finalPrice,
        },
      };
    });
  },

  reset: () => {
    set({
      chassisId: null,
      selectedOptionIds: new Set(),
      priceData: {
        totalPrice: 0,
        chassisPrice: 0,
        discountablePrice: 0,
        nonDiscountablePrice: 0,
        addOnPrices: {},
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: 0,
      },
      vehicleModel: null,
      windowsFlares: [],
      wheels: null,
      exteriorAccessories: [],
      rearDoorCarriers: [],
      rearDoorAccessories: [],
      roofRack: null,
      roofRackAccessories: [],
      totalPrice: 0,
    });
  },

  // Data loading
  setInitialData: (chassis, options) => {
    set({
      chassis,
      options,
      isLoading: false,
      error: null,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default useConfiguratorStore; 