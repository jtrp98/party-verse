'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

export interface SyncCountdownProps {
  onComplete: () => void;
  options?: [string, string];
}

export const SyncCountdown: React.FC<SyncCountdownProps> = ({ onComplete, options }) => {
  const [count, setCount] = useState(3);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    sounds.playHeartbeat();
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sounds.playFanfare();
          setTimeout(onComplete, 400);
          return 0;
        }
        sounds.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="assertive"
      className="p-6 rounded-3xl bg-zinc-950/90 border-2 border-rose-500/50 shadow-2xl shadow-rose-950/50 text-center space-y-4"
    >
      <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-black uppercase tracking-wider">
        <Heart className="w-4 h-4 fill-current" />
        <span>SYNC 3-2-1 นับพร้อมกันแล้วตอบทันที!</span>
      </div>

      {options && (
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-black text-rose-300">
            A: {options[0]}
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-black text-amber-300">
            B: {options[1]}
          </div>
        </div>
      )}

      <div className="py-2 flex items-center justify-center min-h-[100px]">
        {count > 0 ? (
          shouldReduceMotion ? (
            <div className="text-6xl font-black text-amber-400 font-mono">
              {count}
            </div>
          ) : (
            <motion.div
              key={count}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-6xl sm:text-7xl font-black text-amber-400 font-mono tracking-widest drop-shadow-lg"
            >
              {count}
            </motion.div>
          )
        ) : (
          <div className="text-3xl sm:text-4xl font-black text-rose-400 animate-bounce flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            <span>ตอบพร้อมกันเลย!</span>
          </div>
        )}
      </div>
    </div>
  );
};
