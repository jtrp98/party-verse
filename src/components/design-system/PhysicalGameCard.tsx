'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface PhysicalGameCardProps {
  isFlipped: boolean;
  onFlip?: () => void;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  variant?: 'party' | 'couple' | 'doraemon';
  className?: string;
  disabled?: boolean;
  reducedMotionSetting?: boolean;
}

export const PhysicalGameCard: React.FC<PhysicalGameCardProps> = ({
  isFlipped,
  onFlip,
  frontContent,
  backContent,
  variant = 'party',
  className = '',
  disabled = false,
  reducedMotionSetting = false,
}) => {
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = systemReducedMotion || reducedMotionSetting;
  const [isPressed, setIsPressed] = useState(false);

  // Variant glow accents
  const glowShadowClass =
    variant === 'party'
      ? 'shadow-gold-glow border-amber-500/40'
      : variant === 'couple'
      ? 'shadow-rose-glow border-rose-500/40'
      : 'shadow-blue-glow border-sky-500/40';

  if (shouldReduceMotion) {
    return (
      <div
        className={`w-full max-w-md mx-auto aspect-[5/6] sm:aspect-[4/5] rounded-3xl p-6 bg-zinc-900 border-2 ${glowShadowClass} shadow-tactile-rest flex flex-col justify-between ${className}`}
        onClick={!disabled && onFlip ? onFlip : undefined}
      >
        {isFlipped ? frontContent : backContent}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[340px] sm:max-w-[400px] aspect-[5/6] sm:aspect-[4/5] perspective-1200 mx-auto select-none ${className}`}>
      <motion.div
        onClick={() => {
          if (!disabled && onFlip) {
            onFlip();
          }
        }}
        onPointerDown={() => !disabled && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        className="w-full h-full relative cursor-pointer transform-style-3d paper-grain"
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isPressed ? 0.98 : 1,
          y: isPressed ? -2 : 0,
        }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1], // Smooth custom easing
        }}
        whileHover={!disabled ? { y: -6, transition: { duration: 0.2 } } : {}}
      >
        {/* ===================== CARD BACK (UNREVEALED) ===================== */}
        <div
          className={`w-full h-full absolute inset-0 rounded-3xl p-6 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-2 ${glowShadowClass} shadow-tactile-rest flex flex-col items-center justify-between overflow-hidden backface-hidden`}
        >
          {backContent}
        </div>

        {/* ===================== CARD FRONT (REVEALED RESULT) ===================== */}
        <div
          className={`w-full h-full absolute inset-0 rounded-3xl p-6 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 ${glowShadowClass} shadow-tactile-lift flex flex-col justify-between overflow-hidden backface-hidden`}
          style={{ transform: 'rotateY(180deg)' }}
        >
          {frontContent}
        </div>
      </motion.div>
    </div>
  );
};
