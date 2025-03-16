import React, { useEffect, useState } from 'react';
import useConfiguratorStore from '@/store/configurator';
import { VanOption } from '@/types/configurator';
import { ChevronDown, ChevronUp, Palette, Car, Cog, Package, Truck, Wrench, Check } from 'lucide-react';

const ConfiguratorControls: React.FC = () => {
  const {
    chassis,
    options,
    chassisId,
    selectedOptionIds,
    setChassis,
    toggleOption,
    setInitialData,
  } = useConfiguratorStore();

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    chassis: true, // Open chassis section by default
  });
  const [selectedColor, setSelectedColor] = useState('White');

  // Load initial data
  useEffect(() => {
    const mockData = {
      chassis: [
        {
          id: 'mwb-crafter',
          name: 'VW Crafter MWB',
          basePrice: 0,
          modelUrl: '/models/van-models/mwb-crafter/chassis/chassis.glb',
          description: 'Medium Wheelbase VW Crafter',
        }
      ],
      options: [
        // Windows and Flares
        {
          id: 'offside-window',
          name: 'Offside Window',
          price: 350,
          modelUrl: '/models/van-models/mwb-crafter/windows-and-flares/offside-window.glb',
          category: 'windows' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Offside window installation',
        },
        {
          id: 'nearside-window',
          name: 'Nearside Window',
          price: 350,
          modelUrl: '/models/van-models/mwb-crafter/windows-and-flares/nearside-window.glb',
          category: 'windows' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Nearside window installation',
        },
        {
          id: 'flares-with-windows',
          name: 'Flares with Windows',
          price: 800,
          modelUrl: '/models/van-models/mwb-crafter/windows-and-flares/flares-with-windows.glb',
          category: 'windows' as const,
          isExclusive: true,
          conflictsWith: ['flares-without-windows'],
          description: 'Wheel arch flares with windows',
        },
        {
          id: 'flares-without-windows',
          name: 'Flares without Windows',
          price: 600,
          modelUrl: '/models/van-models/mwb-crafter/windows-and-flares/flares-without-windows.glb',
          category: 'windows' as const,
          isExclusive: true,
          conflictsWith: ['flares-with-windows'],
          description: 'Wheel arch flares without windows',
        },

        // Wheels
        {
          id: 'standard-wheels',
          name: 'Standard Wheels',
          price: 0,
          modelUrl: '/models/van-models/mwb-crafter/wheels/standard.glb',
          category: 'wheels' as const,
          isExclusive: true,
          conflictsWith: ['black-rhino-wheels'],
          description: 'Standard VW Crafter wheels',
        },
        {
          id: 'black-rhino-wheels',
          name: 'Black Rhino AT Wheels',
          price: 2000,
          modelUrl: '/models/van-models/mwb-crafter/wheels/black-rhino-at.glb',
          category: 'wheels' as const,
          isExclusive: true,
          conflictsWith: ['standard-wheels'],
          description: 'Black Rhino all-terrain wheels',
        },

        // Roof Racks
        {
          id: 'roof-rack-front-rear-fairing',
          name: 'Front & Rear Fairing Rack',
          price: 1200,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/roof-rack-front-rear-fairing.glb',
          category: 'roof-racks' as const,
          isExclusive: true,
          conflictsWith: ['roof-rack-full-deck', 'roof-rack-deck-maxxfan-front', 'roof-rack-deck-maxxfan-rear'],
          description: 'Roof rack with front and rear fairings',
        },
        {
          id: 'roof-rack-full-deck',
          name: 'Full Deck Roof Rack',
          price: 1500,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/roof-rack-full-deck.glb',
          category: 'roof-racks' as const,
          isExclusive: true,
          conflictsWith: ['roof-rack-front-rear-fairing', 'roof-rack-deck-maxxfan-front', 'roof-rack-deck-maxxfan-rear'],
          description: 'Full deck roof rack system',
        },
        {
          id: 'fiamma-awning',
          name: 'Fiamma F45s Awning',
          price: 800,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/rack-accessories/fiammaf45s-awning-closed.glb',
          category: 'roof-racks' as const,
          subCategory: 'rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Fiamma F45s retractable awning',
        },

        // Rear Door Accessories
        {
          id: 'nearside-mini-carrier',
          name: 'Nearside Mini Carrier',
          price: 400,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-accessories/nearside/minicarrier.glb',
          category: 'rear-accessories' as const,
          subCategory: 'nearside' as const,
          isExclusive: true,
          conflictsWith: ['nearside-midi-carrier'],
          description: 'Nearside mini storage carrier',
        },
        {
          id: 'nearside-midi-carrier',
          name: 'Nearside Midi Carrier',
          price: 600,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-accessories/nearside/midicarrier.glb',
          category: 'rear-accessories' as const,
          subCategory: 'nearside' as const,
          isExclusive: true,
          conflictsWith: ['nearside-mini-carrier'],
          description: 'Nearside midi storage carrier',
        },
        {
          id: 'wheel-carrier',
          name: 'Spare Wheel Carrier',
          price: 300,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-accessories/options/wheel-carrier.glb',
          category: 'rear-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Rear door spare wheel carrier',
        },

        // Exterior Accessories
        {
          id: 'snorkel',
          name: 'Snorkel',
          price: 450,
          modelUrl: '/models/van-models/mwb-crafter/exterior-accessories/snorkel.glb',
          category: 'exterior-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Raised air intake snorkel',
        },
      ],
    };

    setInitialData(mockData.chassis, mockData.options);
  }, [setInitialData]);

  const handleChassisChange = (id: string) => {
    setChassis(id);
  };

  const handleOptionToggle = (option: VanOption) => {
    toggleOption(option.id);
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const groupedOptions = options.reduce<Record<string, VanOption[]>>((acc, option) => {
    const category = option.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {});

  // Check if any option in a category is selected
  const isCategorySelected = (category: string): boolean => {
    return options
      .filter(option => option.category === category)
      .some(option => selectedOptionIds.has(option.id));
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'chassis': 'Vehicle Model',
      'windows': 'Windows & Flares',
      'wheels': 'Wheels',
      'roof-racks': 'Roof Racks',
      'rack-accessories': 'Rack Accessories',
      'rear-accessories': 'Rear Door Accessories',
      'exterior-accessories': 'Exterior Accessories'
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'chassis': <Truck className="w-5 h-5" />,
      'color': <Palette className="w-5 h-5" />,
      'windows': <Car className="w-5 h-5" />,
      'wheels': <Cog className="w-5 h-5" />,
      'roof-racks': <Package className="w-5 h-5" />,
      'rack-accessories': <Package className="w-5 h-5" />,
      'rear-accessories': <Package className="w-5 h-5" />,
      'exterior-accessories': <Wrench className="w-5 h-5" />
    };
    return icons[category] || <Package className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Chassis Selection */}
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleCategory('chassis')}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-gray-700" />
              <span className="text-gray-900 uppercase font-medium tracking-wide">Vehicle Model</span>
            </div>
            <div className="flex items-center space-x-2">
              {chassisId && (
                <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  Selected
                </div>
              )}
              {openCategories['chassis'] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
        </div>

        {openCategories['chassis'] && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 space-y-3">
              {chassis.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleChassisChange(item.id)}
                  className={`w-full p-3 rounded-md transition-all duration-200 ${
                    chassisId === item.id
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-start">
                    <div className="font-medium text-left text-sm">{item.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleCategory('color')}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-gray-700" />
              <span className="text-gray-900 uppercase font-medium tracking-wide">Vehicle Colour</span>
            </div>
            <div className="flex items-center space-x-2">
              {selectedColor && (
                <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  Selected
                </div>
              )}
              {openCategories['color'] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
        </div>

        {openCategories['color'] && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4">
              <select 
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Silver">Silver</option>
                <option value="Gray">Gray</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Options Selection */}
      <div className="space-y-3">
        {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
          <div key={category} className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {getCategoryIcon(category)}
                <span className="text-gray-900 uppercase font-medium tracking-wide">{getCategoryName(category)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {isCategorySelected(category) && (
                  <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                    Selected
                  </div>
                )}
                {openCategories[category] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {openCategories[category] && (
              <div className="p-4 space-y-3 bg-white border-t border-gray-200">
                {categoryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(option)}
                    className={`w-full p-3 rounded-md transition-all duration-200 ${
                      selectedOptionIds.has(option.id)
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                    disabled={!chassisId}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-left text-sm">{option.name}</div>
                      <div className={`font-medium text-sm ${selectedOptionIds.has(option.id) ? 'text-amber-600' : 'text-gray-600'}`}>
                        +£{option.price.toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfiguratorControls; 