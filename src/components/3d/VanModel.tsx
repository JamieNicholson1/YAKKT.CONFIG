'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import useConfiguratorStore from '@/store/configurator';
import PlaceholderModel from './PlaceholderModel';

interface VanModelProps {
  chassisId: string | null;
  selectedOptionIds: Set<string>;
}

const VanModel: React.FC<VanModelProps> = ({ chassisId, selectedOptionIds }) => {
  const groupRef = useRef<Group>(null);
  const { options } = useConfiguratorStore();

  // Optional: Add some subtle animation
  useFrame((state) => {
    const group = groupRef.current;
    if (group) {
      group.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  if (!chassisId) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Base van model */}
      <PlaceholderModel scale={1} color="#444444" />

      {/* Roof options */}
      {Array.from(selectedOptionIds)
        .filter(id => options.find(opt => opt.id === id)?.category === 'roof-racks')
        .map(id => (
          <group key={id} position={[0, 1, 0]}>
            <PlaceholderModel scale={0.8} color="#666666" />
          </group>
        ))}

      {/* Wheel options */}
      {Array.from(selectedOptionIds)
        .filter(id => options.find(opt => opt.id === id)?.category === 'wheels')
        .map(id => (
          <group key={id} position={[0, -0.4, 0]}>
            <PlaceholderModel scale={0.2} color="#333333" />
          </group>
        ))}

      {/* Carrier options */}
      {Array.from(selectedOptionIds)
        .filter(id => options.find(opt => opt.id === id)?.category === 'rear-door-carriers')
        .map(id => (
          <group key={id} position={[0, 0.5, -2]}>
            <PlaceholderModel scale={0.3} color="#555555" />
          </group>
        ))}
    </group>
  );
};

export default VanModel; 