'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Vector3, Euler, Group } from 'three';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface AnimatedModelProps {
  modelPath: string;
  position?: Vector3 | [number, number, number];
  rotation?: Euler | [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  springConfig?: object;
  initialAnimation?: boolean;
  isNew?: boolean;
  lowPerformanceMode?: boolean;
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

const getScale = (s: number | [number, number, number]): [number, number, number] => {
  if (typeof s === 'number') {
    return [s, s, s];
  }
  return s;
};

export const AnimatedModel: React.FC<AnimatedModelProps> = ({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  springConfig = { mass: 1, tension: 170, friction: 26 },
  initialAnimation = true,
  isNew = false,
  lowPerformanceMode = false,
}) => {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(modelPath);

  // Memoize the cloned scene
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // State for initial animation effect
  const [animateIn, setAnimateIn] = useState(initialAnimation);

  // Prepare arrays for spring animations
  const posArray = useMemo(() => getPosition(position), [position]);
  const rotArray = useMemo(() => getRotation(rotation), [rotation]);
  const scaleArray = useMemo(() => getScale(scale), [scale]);

  // Calculate initial animation parameters
  const dropHeight = 1; // How far up it starts
  const rotationAmount = Math.PI / 4; // How much it rotates
  const initialScale = 0.5; // Starting scale

  // Define spring animations
  const { springPosition, springRotation, springScale } = useSpring({
    from: {
      springPosition: animateIn ? [posArray[0], posArray[1] + dropHeight, posArray[2]] : posArray,
      springRotation: animateIn ? [rotArray[0], rotArray[1] + rotationAmount, rotArray[2]] : rotArray,
      springScale: animateIn ? [initialScale, initialScale, initialScale] : scaleArray,
    },
    to: {
      springPosition: posArray,
      springRotation: rotArray,
      springScale: scaleArray,
    },
    config: springConfig,
    delay: isNew ? 200 : 0, // Add delay for new items
    onRest: () => setAnimateIn(false), // Turn off animation state after completion
  });

  // Apply shadows recursively
  useEffect(() => {
    const isBravoSnorkel = modelPath === '/models/van-models/mwb-crafter/exterior-accessories/bravo-snorkel.glb';
    const isFiammaAwning = modelPath === '/models/van-models/mwb-crafter/roof-rack-accessories/fiammaf45s-awning-closed.glb';

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;

        // If it's the Bravo Snorkel OR the Fiamma Awning, set its material color to black
        if (isBravoSnorkel || isFiammaAwning) {
          if (Array.isArray(child.material)) {
            // If material is an array, iterate through them
            child.material.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial) {
                material.color.set('black');
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            // If it's a single material
            child.material.color.set('black');
          }
        }

        // Optimization: disable matrix auto updates for static parts after initial placement
        if (!lowPerformanceMode && !initialAnimation) {
           child.matrixAutoUpdate = false;
        }
      }
    });
  }, [clonedScene, castShadow, receiveShadow, lowPerformanceMode, initialAnimation, modelPath]);

  // Fade in effect for new items
  useFrame((state, delta) => {
    if (groupRef.current && isNew) {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.transparent === false) {
            material.transparent = true; // Ensure material is transparent for fade-in
          }
          material.opacity = Math.min(material.opacity + delta * 2, 1); // Fade in over ~0.5 seconds
        }
      });
    }
  });

  // Add useEffect dependencies
  useEffect(() => {
    // If initialAnimation is false, immediately set to target state without spring
    if (!initialAnimation) {
       if (groupRef.current) {
        groupRef.current.position.set(...posArray);
        groupRef.current.rotation.set(...rotArray);
        groupRef.current.scale.set(...scaleArray);
      }
    }
    // This effect handles the initial spring setup and updates
    // Dependencies added based on linter warning
  }, [initialAnimation, posArray, rotArray, scaleArray, springConfig, dropHeight, rotationAmount, initialScale, springPosition, springRotation, springScale]);

  if (!clonedScene) {
    return null; // Or a loading indicator
  }

  return (
    <animated.group
      ref={groupRef}
      position={springPosition as any} // Keep any for spring values
      rotation={springRotation as any} // Keep any for spring values
      scale={springScale as any} // Keep any for spring values
      dispose={null} // Prevent disposal by parent components
    >
      <primitive object={clonedScene} />
    </animated.group>
  );
}; 