'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';
import confetti from 'canvas-confetti';

export interface SecretRevealWidgetProps {
  playerName: string;
  secretPrompt: string;
}

export const SecretRevealWidget: React.FC<SecretRevealWidgetProps> = ({
  playerName,
  secretPrompt,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleReveal = () => {
    if (!isRevealed) {
      sounds.playCardFlip();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } else {
      sounds.playClick();
    }
    setIsRevealed(!isRevealed);
  };

  return (
    <div className="w-full rounded-3xl bg-zinc-950/80 border-2 border-amber-500/40 p-4 sm:p-5 space-y-3 shadow-lg text-slate-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            คำตอบลับของ {playerName}
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">
          {isRevealed ? 'เปิดเผยแล้ว' : 'ซ่อนอยู่'}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center min-h-[90px] flex items-center justify-center">
        {isRevealed ? (
          <div className="space-y-1 animate-in fade-in duration-300">
            <div className="text-xs font-bold text-amber-400">
              ความลับถูกเปิดเผย:
            </div>
            <p className="text-base sm:text-lg font-black text-white">
              {secretPrompt}
            </p>
          </div>
        ) : (
          <div className="space-y-1 text-zinc-400">
            <p className="text-xs sm:text-sm font-bold">
              ให้เพื่อนในวงทายคำตอบของ {playerName} ก่อน...
            </p>
            <p className="text-[11px] text-zinc-400">
              เมื่อทายเสร็จแล้ว แตะปุ่มด้านล่างเพื่อเฉลยพร้อมกัน!
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleReveal}
        className={`w-full min-h-[46px] rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
          isRevealed
            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-stone-950 shadow-md'
        }`}
      >
        {isRevealed ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span>ซ่อนคำตอบอีกครั้ง</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span>แตะเพื่อเฉลยคำตอบลับ!</span>
            <Sparkles className="w-4 h-4 fill-current" />
          </>
        )}
      </button>
    </div>
  );
};
