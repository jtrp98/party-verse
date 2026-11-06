'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SecondaryActionButtonProps extends HTMLMotionProps<'button'> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  destructive?: boolean;
}

export const SecondaryActionButton: React.FC<SecondaryActionButtonProps> = ({
  icon,
  children,
  fullWidth = true,
  destructive = false,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[50px] sm:min-h-[54px] px-5 py-3 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 border transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed ${
        destructive
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
          : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-white'
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0 text-zinc-400">{icon}</span>}
      <span className="truncate">{children}</span>
    </motion.button>
  );
};
