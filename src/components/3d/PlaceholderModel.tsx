'use client';

import React from 'react';
import { Mesh } from 'three';
import { useRef } from 'react';

interface PlaceholderModelProps {
  color?: string;
  scale?: number;
}

const PlaceholderModel: React.FC<PlaceholderModelProps> = ({ 
  color = '#666666',
  scale = 1 
}) => {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2 * scale, 1 * scale, 4 * scale]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default PlaceholderModel; 