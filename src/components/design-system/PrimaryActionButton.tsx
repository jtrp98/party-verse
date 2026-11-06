'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface PrimaryActionButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'gold' | 'rose' | 'blue' | 'emerald';
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  variant = 'gold',
  icon,
  children,
  fullWidth = true,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const variantStyles = {
    gold: 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-stone-950 shadow-gold-glow hover:brightness-105',
    rose: 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 text-white shadow-rose-glow hover:brightness-105',
    blue: 'bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 text-stone-950 shadow-blue-glow hover:brightness-105',
    emerald: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 text-stone-950 shadow-md hover:brightness-105',
  }[variant];

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[58px] sm:min-h-[64px] px-6 py-3.5 rounded-2xl font-black text-lg sm:text-xl tracking-wide flex items-center justify-center gap-2.5 transition-all duration-150 border border-white/20 select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 disabled:opacity-40 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </motion.button>
  );
};
