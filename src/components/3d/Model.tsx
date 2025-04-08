'use client';

import { useGLTF } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelProps {
  modelPath: string;
  position?: Vector3 | [number, number, number];
  rotation?: Euler | [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
}

// Configure DRACO loader for better compression
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// Configure GLTF loader with DRACO support
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export const Model = ({ modelPath, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, castShadow = true }: ModelProps) => {
  // Use useLoader for better control over loading process
  const gltf = useLoader(GLTFLoader, modelPath, (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });
  
  // Clone the scene to avoid modifying the original
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  
  useEffect(() => {
    if (!scene) {
      console.warn(`Error loading model ${modelPath}`);
      return;
    }

    // Apply optimizations and shadows
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.frustumCulled = true; // Enable frustum culling
        
        // Optimize geometries
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
        
        // Optimize materials
        if (child.material) {
          child.material.dispose();
        }
      }
    });
  }, [modelPath, scene, castShadow]);
  
  if (!scene) {
    return null;
  }
  
  return (
    <primitive 
      object={scene} 
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null} // Prevent automatic disposal
    />
  );
};

// Preload essential models only
const essentialModels = [
  '/models/van-models/mwb-crafter/chassis/chassis.glb',
  '/models/van-models/mwb-crafter/wheels/standard.glb',
];

essentialModels.forEach(path => {
  useGLTF.preload(path);
}); 