'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { PlayingCard } from '@/lib/types/game';
import { SUIT_SYMBOLS } from '@/lib/engine/cardEngine';
import { Sparkles, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

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
  const [showDetails, setShowDetails] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const suitInfo = card ? SUIT_SYMBOLS[card.suit] : null;
  const isRed = card?.suit === 'hearts' || card?.suit === 'diamonds';

  if (shouldReduceMotion) {
    return (
      <div
        onClick={!disabled && onCardClick ? onCardClick : undefined}
        className="w-full max-w-[320px] sm:max-w-[360px] aspect-[2.5/3.7] mx-auto rounded-3xl p-5 bg-zinc-900 border-2 border-sky-500/40 shadow-tactile-lift flex flex-col justify-between select-none cursor-pointer"
      >
        {!isFlipped ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="relative w-28 h-40 rounded-2xl overflow-hidden border border-white/20 shadow-md">
              <Image src="/assets/card-back.jpg" alt="หลังไพ่โดราเอมอน" fill className="object-cover" />
            </div>
            <div className="text-lg font-black text-white">แตะเพื่อจั่วไพ่</div>
          </div>
        ) : (
          card && suitInfo && (
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className={`text-3xl font-black ${isRed ? 'text-rose-500' : 'text-white'}`}>
                  {card.rank} {suitInfo.symbol}
                </span>
                <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg">
                  {suitInfo.nameThai}
                </span>
              </div>
              <div className="text-center py-4 space-y-2">
                <div className="text-xl font-black text-amber-400">{card.ruleTitle}</div>
                <div className="text-base font-bold text-white leading-relaxed">{card.ruleDescription}</div>
              </div>
              <div className="text-xs text-center text-zinc-500 font-mono">52-CARD DECK</div>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[300px] sm:max-w-[340px] aspect-[2.5/3.7] perspective-1200 mx-auto select-none">
      <motion.div
        onClick={() => {
          if (!disabled && onCardClick) onCardClick();
        }}
        className="w-full h-full relative cursor-pointer transform-style-3d paper-grain"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        whileHover={!disabled ? { y: -6 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* ===================== CARD BACK ===================== */}
        <div
          className="w-full h-full absolute inset-0 rounded-3xl bg-zinc-950 border-2 border-sky-400/50 shadow-blue-glow shadow-tactile-lift flex flex-col items-center justify-between overflow-hidden backface-hidden"
        >
          {/* Real Generated Playing Card Back Artwork */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/card-back.jpg"
              alt="หลังไพ่โดราเอมอน"
              fill
              sizes="340px"
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/70" />
          </div>

          {/* Top Label */}
          <div className="relative z-10 w-full p-4 flex justify-between text-amber-300/80 text-xs font-mono font-bold">
            <span>♠ ♥</span>
            <span>52 CARDS</span>
            <span>♦ ♣</span>
          </div>

          {/* Center Call to Action */}
          <div className="relative z-10 text-center flex flex-col items-center gap-2 p-4">
            <div className="text-xl sm:text-2xl font-black tracking-widest text-white drop-shadow-md">
              DORAEMON
            </div>
            <span className="px-4 py-1.5 rounded-full bg-amber-400/95 text-stone-950 text-xs sm:text-sm font-black shadow-lg">
              แตะเพื่อจั่วไพ่
            </span>
          </div>

          {/* Bottom Label */}
          <div className="relative z-10 w-full p-4 text-center text-amber-200/60 text-[11px] font-mono tracking-wider">
            PASS & PLAY ARCADE
          </div>
        </div>

        {/* ===================== CARD FRONT ===================== */}
        <div
          className="w-full h-full absolute inset-0 rounded-3xl p-5 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-zinc-700/80 shadow-tactile-lift flex flex-col justify-between overflow-hidden backface-hidden"
          style={{ transform: 'rotateY(180deg)' }}
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
                  <span className="text-xs font-bold text-zinc-300 bg-zinc-800/90 px-2.5 py-1 rounded-xl border border-zinc-700">
                    {suitInfo.nameThai}
                  </span>
                </div>
              </div>

              {/* Center Content / Rule */}
              <div className="my-auto text-center px-1 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{card.ruleTitle}</span>
                </div>

                <p className="text-lg sm:text-xl font-black text-white leading-snug tracking-wide">
                  {card.ruleDescription}
                </p>

                {/* Collapsible rule details */}
                {card.ruleDetails && (
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        setShowDetails(!showDetails);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-300 font-bold underline decoration-dotted"
                    >
                      <span>{showDetails ? 'ซ่อนกติกา' : 'ดูกติกาเพิ่มเติม'}</span>
                      {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showDetails && (
                      <p className="text-xs text-zinc-300 mt-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left leading-relaxed animate-in fade-in">
                        {card.ruleDetails}
                      </p>
                    )}
                  </div>
                )}

                {card.triggersMiniGame && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-300 bg-sky-950/70 border border-sky-500/40 px-3 py-1 rounded-xl animate-pulse">
                    <Zap className="w-4 h-4 text-sky-400" />
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
