'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshBasicMaterial, Group } from 'three';
import { useSpring, animated } from '@react-spring/three';

interface LoadingIndicatorProps {
  progress?: number;
}

export const LoadingIndicator = ({ progress = 0 }: LoadingIndicatorProps) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  
  // Fade animation
  const { opacity } = useSpring({
    opacity: progress < 100 ? 1 : 0,
    config: {
      tension: 280,
      friction: 120,
    },
  });

  // Subtle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  // Update material opacity
  useEffect(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as MeshBasicMaterial;
      material.transparent = true;
      material.opacity = progress < 100 ? 0.4 : 0;
    }
  }, [progress]);

  return (
    <animated.group ref={groupRef} scale={opacity.to(o => o * 0.15)}>
      <mesh ref={meshRef}>
        <torusGeometry args={[1, 0.2, 16, 32]} />
        <meshBasicMaterial color="#94a3b8" transparent />
      </mesh>
    </animated.group>
  );
}; 