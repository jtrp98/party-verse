'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

export interface PlayerTurnBannerProps {
  playerName: string;
  avatarColor?: string;
  turnIndex?: number;
  roundInfo?: string;
}

export const PlayerTurnBanner: React.FC<PlayerTurnBannerProps> = ({
  playerName,
  avatarColor,
  turnIndex,
  roundInfo,
}) => {
  return (
    <div
      role="region"
      aria-label="ตาของผู้เล่นปัจจุบัน"
      className="w-full p-4 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700/80 shadow-tactile-rest flex items-center justify-between gap-3 backdrop-blur-md"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <PlayerAvatar name={playerName} avatarColor={avatarColor} size="lg" index={turnIndex} />
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider">
            {roundInfo || 'ถึงตาเล่น'}
          </div>
          <div className="text-xl sm:text-2xl font-black text-white truncate">
            {playerName}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-bold flex-shrink-0">
        <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="hidden xs:inline">ส่งมือถือให้</span>
        <span className="text-white font-black truncate max-w-[80px]">{playerName}</span>
      </div>
    </div>
  );
};
