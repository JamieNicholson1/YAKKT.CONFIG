'use client';

import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/web'; // Use web for HTML animations

interface LoadingIndicatorProps {
  progress?: number;
}

export const LoadingIndicator = ({ progress = 0 }: LoadingIndicatorProps) => {
  const { opacity } = useSpring({
    opacity: progress < 100 ? 1 : 0,
    config: { tension: 280, friction: 60 }, // Adjusted friction for potentially smoother fade
    delay: progress < 100 ? 0 : 300, // Optional: slight delay before fading out
  });

  // Early return if fully loaded and opacity is zero to avoid rendering an empty Html component
  if (progress >= 100 && opacity.get() === 0) {
    return null;
  }

  return (
    <Html center style={{ pointerEvents: 'none' }}> {/* Added pointerEvents: none to prevent blocking interactions */}
      <animated.div style={{ opacity }} className="flex flex-col items-center justify-center">
        {/* TailwindCSS Spinner */}
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        {/* Optional: Progress percentage text */}
        {progress < 100 && (
          <p className="mt-3 text-sm text-gray-600 font-medium">{Math.round(progress)}%</p>
        )}
      </animated.div>
    </Html>
  );
}; 