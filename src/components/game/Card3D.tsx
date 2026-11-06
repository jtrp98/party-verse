'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlayingCard } from '@/lib/types/game';
import { SUIT_SYMBOLS } from '@/lib/engine/cardEngine';
import { Sparkles, Zap } from 'lucide-react';

interface Card3DProps {
  card: PlayingCard | null;
  isFlipped: boolean;
  onCardClick?: () => void;
  disabled?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  card,
  isFlipped,
  onCardClick,
  disabled = false,
}) => {
  const suitInfo = card ? SUIT_SYMBOLS[card.suit] : null;
  const isRed = card?.suit === 'hearts' || card?.suit === 'diamonds';

  return (
    <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[2.5/3.7] perspective-1000 mx-auto select-none">
      <motion.div
        onClick={() => {
          if (!disabled && onCardClick) onCardClick();
        }}
        className="w-full h-full relative cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* ===================== CARD BACK ===================== */}
        <div
          className="w-full h-full absolute inset-0 rounded-3xl p-4 bg-zinc-950 border-2 border-amber-500/50 shadow-2xl shadow-black/80 flex flex-col items-center justify-between overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-2 rounded-2xl border border-dashed border-amber-500/30 pointer-events-none" />
          <div className="w-full flex justify-between text-amber-500/40 text-xs font-mono">
            <span>♠ ♥</span>
            <span>♦ ♣</span>
          </div>

          <div className="text-center relative z-10 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-950/40">
              🍺
            </div>
            <h3 className="font-black text-xl tracking-widest text-amber-400">
              DORAEMON
            </h3>
            <p className="text-[11px] text-amber-300 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              แตะเพื่อเปิดไพ่
            </p>
          </div>

          <div className="w-full flex justify-between text-amber-500/40 text-xs font-mono">
            <span>52 CARDS</span>
            <span>SOLO PASS & PLAY</span>
          </div>
        </div>

        {/* ===================== CARD FRONT ===================== */}
        <div
          className="w-full h-full absolute inset-0 rounded-3xl p-5 bg-zinc-950 border-2 border-zinc-800 shadow-2xl shadow-black/80 flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {card && suitInfo && (
            <>
              {/* Top Left Rank & Suit */}
              <div className="flex items-center justify-between">
                <div className={`flex flex-col items-center leading-none ${isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                  <span className="text-3xl font-black">{card.rank}</span>
                  <span className="text-2xl">{suitInfo.symbol}</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    {suitInfo.nameThai}
                  </span>
                </div>
              </div>

              {/* Center Content / Rule */}
              <div className="my-auto text-center px-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{card.ruleTitle}</span>
                </div>

                <p className="text-sm font-black text-white leading-snug tracking-wide">
                  {card.ruleDescription}
                </p>

                {card.ruleDetails && (
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {card.ruleDetails}
                  </p>
                )}

                {card.triggersMiniGame && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded-xl animate-pulse">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>มีมินิเกมเปิดขึ้น!</span>
                  </div>
                )}
              </div>

              {/* Bottom Right Rank & Suit (Inverted) */}
              <div className="flex items-end justify-between rotate-180">
                <div className={`flex flex-col items-center leading-none ${isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                  <span className="text-3xl font-black">{card.rank}</span>
                  <span className="text-2xl">{suitInfo.symbol}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
