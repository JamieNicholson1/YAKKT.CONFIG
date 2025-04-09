'use client';

import { useRef, useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Vector3, Euler, Group } from 'three';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedModelProps {
  modelPath: string;
  position?: Vector3 | [number, number, number];
  rotation?: Euler | [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  isNew?: boolean;
  lowPerformanceMode?: boolean;
  onLoad?: (gltf: any) => void;
  onError?: (error: Error) => void;
}

const getPosition = (pos: Vector3 | [number, number, number]): [number, number, number] => {
  if (Array.isArray(pos)) {
    return pos;
  }
  return [pos.x, pos.y, pos.z];
};

const getRotation = (rot: Euler | [number, number, number]): [number, number, number] => {
  if (Array.isArray(rot)) {
    return rot;
  }
  return [rot.x, rot.y, rot.z];
};

export const AnimatedModel: React.FC<AnimatedModelProps> = ({ 
  modelPath, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1, 
  castShadow = true,
  isNew = false,
  lowPerformanceMode = false,
  onLoad,
  onError
}) => {
  const groupRef = useRef<Group>(null);
  
  // Use the cached model for better performance
  const { scene } = useGLTF(modelPath);
  const clonedScene = scene.clone();
  
  // Convert position and rotation to arrays
  const posArray = getPosition(position);
  const rotArray = getRotation(rotation);
  
  // Use simpler animation configuration for low performance mode
  const springConfig = {
    mass: 1,
    tension: lowPerformanceMode ? 200 : 320,
    friction: lowPerformanceMode ? 20 : 28,
  };
  
  // Reduce animation complexity on low performance devices
  const dropHeight = lowPerformanceMode ? 0.1 : 0.25;
  const rotationAmount = lowPerformanceMode ? Math.PI * 0.1 : Math.PI * 0.25;
  const initialScale = lowPerformanceMode ? 0.95 : 0.9;
  
  // Animation springs with conditional intensity based on device capability
  const { springPosition, springScale, springRotation } = useSpring({
    springPosition: isNew ? [posArray[0], posArray[1] + dropHeight, posArray[2]] : posArray,
    springScale: isNew ? initialScale : (typeof scale === 'number' ? scale : scale[0]),
    springRotation: isNew ? [rotArray[0], rotArray[1] + rotationAmount, rotArray[2]] : rotArray,
    from: {
      springPosition: isNew ? [posArray[0], posArray[1] + dropHeight, posArray[2]] : posArray,
      springScale: isNew ? initialScale : (typeof scale === 'number' ? scale : scale[0]),
      springRotation: isNew ? [rotArray[0], rotArray[1], rotArray[2]] : rotArray,
    },
    config: springConfig,
  });
  
  // Skip hover effects on low performance devices
  const [hovered, setHovered] = useState(false);
  const handlePointerOver = () => {
    if (!lowPerformanceMode) setHovered(true);
  };
  const handlePointerOut = () => {
    if (!lowPerformanceMode) setHovered(false);
  };

  // Set snorkel color to black if this is the snorkel model
  useEffect(() => {
    if (!clonedScene || !modelPath.includes('bravo-snorkel')) return;
    
    clonedScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const blackMaterial = new THREE.MeshStandardMaterial({
          color: 0x000000,
          roughness: 0.7,
          metalness: 0.2
        });
        child.material = blackMaterial;
      }
    });
  }, [clonedScene, modelPath]);

  // Optimize mesh complexity for low performance mode
  useEffect(() => {
    if (!clonedScene || !lowPerformanceMode) return;
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Simplify materials on low-end devices
        if (child.material && child.material.map) {
          child.material.map.minFilter = THREE.LinearFilter;
          child.material.map.generateMipmaps = false;
        }
      }
    });
  }, [clonedScene, lowPerformanceMode]);

  // Highlight effect for hover with minimal intensity
  useEffect(() => {
    if (!clonedScene || lowPerformanceMode) return; // Skip effect on low performance mode
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Store the original material
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material.clone();
        }
        
        if (hovered) {
          // Create very subtle highlight effect
          const highlightMaterial = child.material.clone();
          highlightMaterial.emissive = new THREE.Color(0x222222);
          highlightMaterial.emissiveIntensity = 0.05;
          child.material = highlightMaterial;
        } else {
          // Restore original material
          child.material = child.userData.originalMaterial;
        }
      }
    });
  }, [hovered, clonedScene, lowPerformanceMode]);

  // Lock-in animation with conditional intensity
  useEffect(() => {
    if (!isNew || !groupRef.current) return;

    // Skip complex animations on low performance mode
    if (lowPerformanceMode) {
      // Simple instant animation for low performance devices
      springPosition.start({
        to: posArray,
        config: { duration: 200 },
      });
      springScale.start({
        to: typeof scale === 'number' ? scale : scale[0],
        config: { duration: 200 },
      });
      springRotation.start({
        to: rotArray,
        config: { duration: 200 },
      });
      return;
    }

    const targetY = posArray[1];
    const startY = targetY + dropHeight;
    
    springPosition.start({
      from: [posArray[0], startY, posArray[2]],
      to: posArray,
      config: springConfig,
    });

    springScale.start({
      from: initialScale,
      to: typeof scale === 'number' ? scale : scale[0],
      config: springConfig,
    });

    springRotation.start({
      from: [rotArray[0], rotArray[1] + rotationAmount, rotArray[2]],
      to: rotArray,
      config: springConfig,
    });
  }, [isNew, lowPerformanceMode]);

  // Apply shadows based on performance mode
  useEffect(() => {
    if (!clonedScene) return;
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Only cast shadows from larger objects on low performance mode
        const meshVolume = child.geometry ? 
          (child.geometry.boundingBox?.max.x - child.geometry.boundingBox?.min.x) * 
          (child.geometry.boundingBox?.max.y - child.geometry.boundingBox?.min.y) * 
          (child.geometry.boundingBox?.max.z - child.geometry.boundingBox?.min.z) : 0;
          
        // Skip shadow casting for small meshes on low performance devices
        child.castShadow = lowPerformanceMode ? 
          (castShadow && meshVolume > 0.1) : castShadow;
      }
    });
  }, [clonedScene, castShadow, lowPerformanceMode]);

  // Fix any types
  const handleLoad = (gltf: any) => {
    // ... existing code ...
  };

  const handleError = (error: Error) => {
    // ... existing code ...
  };

  if (!clonedScene) {
    return null;
  }

  return (
    <animated.group
      ref={groupRef}
      position={springPosition}
      rotation={springRotation}
      scale={springScale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={clonedScene} />
    </animated.group>
  );
}; 