'use client';

import { useGLTF } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import { useEffect } from 'react';

interface ModelProps {
  modelPath: string;
  position?: Vector3 | [number, number, number];
  rotation?: Euler | [number, number, number];
  scale?: number | [number, number, number];
}

export const Model = ({ modelPath, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: ModelProps) => {
  const { scene } = useGLTF(modelPath);
  
  useEffect(() => {
    if (!scene) {
      console.warn(`Error loading model ${modelPath}`);
    }
  }, [modelPath, scene]);
  
  if (!scene) {
    return null;
  }
  
  return (
    <primitive 
      object={scene} 
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};

// Pre-load the models we know exist
useGLTF.preload('/models/van-models/mwb-crafter/chassis/chassis.glb');
useGLTF.preload('/models/van-models/mwb-crafter/windows-and-flares/offside-window.glb');
useGLTF.preload('/models/van-models/mwb-crafter/windows-and-flares/nearside-window.glb');
useGLTF.preload('/models/van-models/mwb-crafter/windows-and-flares/flares-with-windows.glb');
useGLTF.preload('/models/van-models/mwb-crafter/windows-and-flares/flares-without-windows.glb');
useGLTF.preload('/models/van-models/mwb-crafter/wheels/standard.glb');
useGLTF.preload('/models/van-models/mwb-crafter/wheels/black-rhino-at.glb');
useGLTF.preload('/models/van-models/mwb-crafter/roof-racks/roof-rack-front-rear-fairing.glb');
useGLTF.preload('/models/van-models/mwb-crafter/roof-racks/roof-rack-full-deck.glb');
useGLTF.preload('/models/van-models/mwb-crafter/roof-racks/rack-accessories/fiammaf45s-awning-closed.glb');
useGLTF.preload('/models/van-models/mwb-crafter/rear-door-accessories/nearside/minicarrier.glb');
useGLTF.preload('/models/van-models/mwb-crafter/rear-door-accessories/nearside/midicarrier.glb');
useGLTF.preload('/models/van-models/mwb-crafter/rear-door-accessories/options/wheel-carrier.glb');
useGLTF.preload('/models/van-models/mwb-crafter/exterior-accessories/snorkel.glb'); 