'use client';

import React, { useState } from 'react';
import Scene from '@/components/3d/Scene';
import ConfiguratorControls from '@/components/ui/ConfiguratorControls';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { ShoppingCart, Loader2 } from 'lucide-react';
import useConfiguratorStore from '@/store/configurator';
import useCheckout from '@/hooks/useCheckout';

const ConfiguratorLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'configure' | 'summary'>('configure');
  const { priceData, chassisId } = useConfiguratorStore();
  const { totalPrice } = priceData;
  const { isLoading, error, handleCheckout } = useCheckout();
  
  // Handle checkout button click
  const handleCheckoutClick = () => {
    handleCheckout();
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 3D View */}
      <div className="flex-1 relative">
        <Scene />
      </div>

      {/* Controls Panel */}
      <div className="w-[420px] bg-white shadow-xl flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('configure')}
            className={`flex-1 py-4 px-6 text-center font-mono uppercase font-medium tracking-wide ${
              activeTab === 'configure' 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-gray-500'
            }`}
            aria-label="Configure tab"
            tabIndex={0}
          >
            Configure
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-4 px-6 text-center font-mono uppercase font-medium tracking-wide ${
              activeTab === 'summary' 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-gray-500'
            }`}
            aria-label="Summary tab"
            tabIndex={0}
          >
            Summary
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'configure' ? (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 font-mono uppercase tracking-wide">
                YAKKT CONFIGURATOR
              </h1>
              <ConfiguratorControls />
            </div>
          ) : (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 font-mono uppercase tracking-wide">
                Order Summary
              </h1>
              <PriceDisplay detailed />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-6 py-2 bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Total and Checkout */}
        <div className="border-t p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900 font-mono uppercase tracking-wide">TOTAL</span>
            <span className="text-2xl font-bold text-amber-500">£{totalPrice.toLocaleString()}</span>
          </div>
          <button 
            className={`w-full py-4 rounded-md font-mono uppercase tracking-wide flex items-center justify-center space-x-2 ${
              !chassisId || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-600 transition-colors'
            }`}
            onClick={handleCheckoutClick}
            disabled={!chassisId || isLoading}
            aria-label="Checkout"
            tabIndex={0}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>Checkout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguratorLayout; 