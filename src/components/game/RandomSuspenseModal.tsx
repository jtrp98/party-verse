'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { HelpCircle, Flame, FastForward, Disc3, Shuffle, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

interface RandomSuspenseModalProps {
  isOpen: boolean;
  targetType: 'TRUTH' | 'DARE';
  onComplete: (type: 'TRUTH' | 'DARE') => void;
  onClose?: () => void;
}

type RandomMode = 'WHEEL' | 'SHUFFLE';

// Wheel slices: 6 slices (60 deg each)
const SLICES = [
  { type: 'TRUTH' as const, label: 'TRUTH', icon: '❓', color: '#eab308', textColor: '#422006' },
  { type: 'DARE' as const, label: 'DARE', icon: '🔥', color: '#f43f5e', textColor: '#4c0519' },
  { type: 'TRUTH' as const, label: 'TRUTH', icon: '❓', color: '#f59e0b', textColor: '#451a03' },
  { type: 'DARE' as const, label: 'DARE', icon: '🔥', color: '#e11d48', textColor: '#4c0519' },
  { type: 'TRUTH' as const, label: 'TRUTH', icon: '❓', color: '#d97706', textColor: '#451a03' },
  { type: 'DARE' as const, label: 'DARE', icon: '🔥', color: '#be123c', textColor: '#4c0519' },
];

export const RandomSuspenseModal: React.FC<RandomSuspenseModalProps> = ({
  isOpen,
  targetType,
  onComplete,
}) => {
  const [mode, setMode] = useState<RandomMode>('WHEEL');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [hasLanded, setHasLanded] = useState(false);

  // Shuffle mode states
  const [shufflingCurrentType, setShufflingCurrentType] = useState<'TRUTH' | 'DARE'>('TRUTH');

  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  }, []);

  // Run Wheel Animation
  const runWheelAnimation = useCallback(() => {
    sounds.playSuspenseRiser();

    // Slices for targetType
    const matchingIndices = SLICES.map((s, idx) => (s.type === targetType ? idx : -1)).filter(
      (idx) => idx !== -1
    );
    // Pick one random matching slice index
    const chosenIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
    const midAngle = chosenIndex * 60 + 30;

    // Top pointer is at 12 o'clock (0 degrees).
    const baseTargetOffset = (360 - midAngle) % 360;
    const fullSpins = 5; // 5 full revolutions for drama
    const finalDegree = 360 * fullSpins + baseTargetOffset;

    setWheelRotation(finalDegree);

    // Schedule realistic peg ticking sounds as it decelerates over 2.6 seconds
    const tickDelays = [
      80, 160, 240, 320, 400, 480, 560, 650, 750, 860, 980, 1120, 1280, 1460, 1660, 1880, 2120, 2380,
    ];
    tickDelays.forEach((delay) => {
      const t = setTimeout(() => {
        sounds.playTick();
      }, delay);
      timerRef.current.push(t);
    });

    // Landing sequence at 2.6s
    const landTimer = setTimeout(() => {
      setIsSpinning(false);
      setHasLanded(true);
      sounds.playImpactSlam();
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.55 },
      });

      // Auto-advance to card after 950ms
      const finishTimer = setTimeout(() => {
        onComplete(targetType);
      }, 950);
      timerRef.current.push(finishTimer);
    }, 2600);

    timerRef.current.push(landTimer);
  }, [targetType, onComplete]);

  // Run Rapid Shuffle Animation
  const runShuffleAnimation = useCallback(() => {
    sounds.playCardShuffle();

    // Sequence of flips with progressive deceleration
    const intervals = [60, 70, 80, 90, 110, 130, 160, 200, 250, 320, 420, 560, 740];
    let elapsed = 0;

    intervals.forEach((step, idx) => {
      elapsed += step;
      const isLast = idx === intervals.length - 1;
      const t = setTimeout(() => {
        if (isLast) {
          setShufflingCurrentType(targetType);
          setIsSpinning(false);
          setHasLanded(true);
          sounds.playImpactSlam();
          confetti({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.55 },
          });

          const finishTimer = setTimeout(() => {
            onComplete(targetType);
          }, 950);
          timerRef.current.push(finishTimer);
        } else {
          setShufflingCurrentType((prev) => (prev === 'TRUTH' ? 'DARE' : 'TRUTH'));
          if (idx > intervals.length - 4) {
            sounds.playHeartbeat();
          } else {
            sounds.playTick();
          }
        }
      }, elapsed);
      timerRef.current.push(t);
    });
  }, [targetType, onComplete]);

  // Handle immediate Skip
  const handleSkip = () => {
    clearAllTimers();
    sounds.playCardFlip();
    onComplete(targetType);
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Trigger spin/shuffle whenever modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        clearAllTimers();
        setHasLanded(false);
        setIsSpinning(true);

        if (mode === 'WHEEL') {
          runWheelAnimation();
        } else {
          runShuffleAnimation();
        }
      } else {
        clearAllTimers();
        setIsSpinning(false);
        setHasLanded(false);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      clearAllTimers();
    };
  }, [isOpen, mode, runWheelAnimation, runShuffleAnimation, clearAllTimers]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center relative overflow-hidden"
        >
          {/* Subtle Ambient Backlight Glow */}
          <div
            className={`absolute -top-16 inset-x-0 h-40 blur-3xl rounded-full opacity-30 pointer-events-none transition-colors duration-500 ${
              targetType === 'TRUTH' ? 'bg-amber-500' : 'bg-rose-500'
            }`}
          />

          {/* Top Bar with Mode Switch & Skip */}
          <div className="w-full flex items-center justify-between mb-4 z-10">
            {/* Mode Toggle Button */}
            <div className="inline-flex rounded-xl bg-zinc-900 p-0.5 border border-zinc-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setMode('WHEEL');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  mode === 'WHEEL'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Disc3 className="w-3 h-3" />
                <span>วงล้อ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setMode('SHUFFLE');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  mode === 'SHUFFLE'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Shuffle className="w-3 h-3" />
                <span>สับการ์ด</span>
              </button>
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[11px] font-bold active:scale-95 transition-all"
            >
              <span>ข้าม</span>
              <FastForward className="w-3 h-3" />
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-4 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              <Sparkles className="w-3 h-3" />
              <span>โชคชะตากำลังเลือก</span>
            </span>
            <h3 className="text-lg font-black text-white mt-1">
              {mode === 'WHEEL' ? 'วงล้อเสี่ยงทาย TRUTH / DARE' : 'กำลังสับการ์ดสลับไปมา...'}
            </h3>
          </div>

          {/* ================= WHEEL MODE ================= */}
          {mode === 'WHEEL' && (
            <div className="relative w-64 h-64 flex items-center justify-center my-3 z-10">
              {/* Top Needle Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 z-30 flex flex-col items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 animate-bounce" />
                <div className="w-2.5 h-2.5 rounded-full bg-white -mt-1 shadow-md shadow-amber-400" />
              </div>

              {/* The Spinning Wheel */}
              <div
                className="w-56 h-56 rounded-full relative shadow-[0_0_40px_rgba(0,0,0,0.9)] border-4 border-zinc-800 overflow-hidden"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning
                    ? 'transform 2600ms cubic-bezier(0.12, 0.85, 0.22, 1)'
                    : 'none',
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {SLICES.map((slice, i) => {
                    const startAngle = i * 60;
                    const endAngle = (i + 1) * 60;
                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                    const textAngle = startAngle + 30;
                    const tx = 50 + 32 * Math.cos((Math.PI * textAngle) / 180);
                    const ty = 50 + 32 * Math.sin((Math.PI * textAngle) / 180);

                    return (
                      <g key={i}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={slice.color}
                          stroke="#18181b"
                          strokeWidth="1"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize="6.5"
                          fontWeight="900"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                          className="drop-shadow-sm select-none"
                        >
                          {slice.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Center Hub */}
                <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 shadow-inner" />
                </div>
              </div>
            </div>
          )}

          {/* ================= SHUFFLE MODE ================= */}
          {mode === 'SHUFFLE' && (
            <div className="relative w-64 h-64 flex items-center justify-center my-3 z-10">
              <motion.div
                key={shufflingCurrentType}
                initial={{ scale: 0.9, rotateY: 90 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ duration: 0.08 }}
                className={`w-48 h-56 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 border-4 shadow-2xl text-center select-none ${
                  shufflingCurrentType === 'TRUTH'
                    ? 'bg-zinc-900 border-amber-400 text-amber-400 shadow-amber-500/20'
                    : 'bg-zinc-900 border-rose-500 text-rose-400 shadow-rose-500/20'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border ${
                    shufflingCurrentType === 'TRUTH'
                      ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {shufflingCurrentType === 'TRUTH' ? (
                    <HelpCircle className="w-8 h-8" />
                  ) : (
                    <Flame className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h4 className="text-2xl font-black tracking-wider text-white">
                    {shufflingCurrentType}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {shufflingCurrentType === 'TRUTH' ? 'ตอบความจริง' : 'ทำภารกิจท้าทาย'}
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Reveal Result Banner */}
          <div className="w-full text-center mt-2 min-h-[48px] flex items-center justify-center z-10">
            {hasLanded ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl ${
                  targetType === 'TRUTH'
                    ? 'bg-amber-400 text-zinc-950 shadow-amber-400/30'
                    : 'bg-rose-500 text-white shadow-rose-500/30'
                }`}
              >
                <span>🎉 สรุปผล: ได้</span>
                <span className="text-base tracking-wider uppercase">
                  {targetType === 'TRUTH' ? '❓ TRUTH' : '🔥 DARE'}!
                </span>
              </motion.div>
            ) : (
              <p className="text-xs text-zinc-400 animate-pulse">
                {mode === 'WHEEL'
                  ? 'ลุ้นว่าวงล้อจะหยุดที่ TRUTH หรือ DARE...'
                  : 'กำลังสับไพ่เลือกชะตากรรม...'}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
