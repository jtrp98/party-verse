'use client';

import React from 'react';

export interface PlayerAvatarProps {
  name: string;
  avatarColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  index?: number;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  avatarColor = 'bg-amber-500 text-stone-950 border-amber-300',
  size = 'md',
  index,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-11 h-11 text-base rounded-2xl',
    lg: 'w-14 h-14 text-xl rounded-2xl',
    xl: 'w-16 h-16 text-2xl rounded-3xl',
  }[size];

  const firstLetter = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`flex items-center justify-center font-black border shadow-sm select-none flex-shrink-0 ${sizeClasses} ${avatarColor}`}
      aria-label={`ผู้เล่น ${name}`}
    >
      {index !== undefined ? index + 1 : firstLetter}
    </div>
  );
};
