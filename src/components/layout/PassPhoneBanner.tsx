'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Sparkles } from 'lucide-react';
import { Player } from '@/lib/types/game';

interface PassPhoneBannerProps {
  player: Player;
  turnNumber?: number;
}

export const PassPhoneBanner: React.FC<PassPhoneBannerProps> = ({ player, turnNumber }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={player.id}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-base shadow-md ${player.avatarColor}`}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-zinc-950 p-1 rounded-full border border-zinc-700 text-amber-400">
              <Smartphone className="w-2.5 h-2.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ตาของคุณแล้ว</span>
              {turnNumber !== undefined && (
                <span className="px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-400 font-mono text-[10px]">
                  #{turnNumber}
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-white tracking-wide truncate max-w-[180px]">
              {player.name}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            📱 ส่งมือถือมาเลย
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
