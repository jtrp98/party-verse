'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, ShieldX, Users, Swords, ChevronRight } from 'lucide-react';
import { ActiveMiniGameInstance, Player } from '@/lib/types/game';
import { sounds } from '@/lib/sound/webAudio';

interface MiniGameModalProps {
  isOpen: boolean;
  instance: ActiveMiniGameInstance | null;
  players: Player[];
  onComplete: (winnerPlayerId?: string) => void;
  onSkip?: () => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  isOpen,
  instance,
  players,
  onComplete,
  onSkip,
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Dolphin Game Tracker State
  const [dolphinCount, setDolphinCount] = useState<number>(1);
  const [dolphinSubStep, setDolphinSubStep] = useState<number>(0); // 0: โลมา N ตัว, 1: กระโดดน้ำ N ครั้ง, 2..: บุ๋ม!

  // Point of Doom 3-2-1 State
  const [pointCountdown, setPointCountdown] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (instance?.game.durationSeconds) {
        setTimeLeft(instance.game.durationSeconds);
        setIsTimerRunning(false);
      } else {
        setTimeLeft(null);
        setIsTimerRunning(false);
      }
      setDolphinCount(1);
      setDolphinSubStep(0);
      setPointCountdown(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [instance]);

  // Timer Tick Interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            sounds.playBuzzer();
            return 0;
          }
          if (prev <= 4) {
            sounds.playHeartbeat();
          } else {
            sounds.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  // Point of Doom 3-2-1
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pointCountdown !== null && pointCountdown > 0) {
      sounds.playHeartbeat();
      interval = setInterval(() => {
        setPointCountdown((prev) => {
          if (prev === null || prev <= 1) {
            sounds.playImpactSlam();
            return 0;
          }
          sounds.playHeartbeat();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pointCountdown]);

  if (!isOpen || !instance) return null;

  const { game, participantIds, roleDescriptions } = instance;
  const participantPlayers = players.filter((p) => participantIds.includes(p.id));

  const toggleTimer = () => {
    sounds.playClick();
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    sounds.playClick();
    setIsTimerRunning(false);
    setTimeLeft(game.durationSeconds || null);
  };

  // Dolphin next step helper
  const handleNextDolphinStep = () => {
    sounds.playClick();
    const maxSubStep = 1 + dolphinCount;
    if (dolphinSubStep < maxSubStep) {
      setDolphinSubStep(dolphinSubStep + 1);
    } else {
      setDolphinCount(dolphinCount + 1);
      setDolphinSubStep(0);
    }
  };

  const getDolphinCurrentPhrase = () => {
    if (dolphinSubStep === 0) return `🐬 พูดว่า: "ปลาโลมา ${dolphinCount} ตัว"`;
    if (dolphinSubStep === 1) return `🌊 พูดว่า: "กระโดดน้ำ ${dolphinCount} ครั้ง"`;
    const boomIndex = dolphinSubStep - 1;
    return `💥 พูดว่า: "บุ๋ม!" (ครั้งที่ ${boomIndex}/${dolphinCount})`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-zinc-950 border-2 border-zinc-800 rounded-3xl shadow-2xl p-5 flex flex-col gap-4 text-white"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wide">
              <Swords className="w-3.5 h-3.5" />
              <span>MINI GAME CHALLENGE</span>
            </div>
            <h3 className="text-xl font-black text-white">{game.title}</h3>
            <p className="text-xs text-zinc-400">{game.description}</p>
          </div>

          {/* Special Helper for Dolphin Game */}
          {game.id === 'chill_dolphin_dive' && (
            <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-3.5 space-y-2 text-center">
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase block">
                ตัวช่วยนับรอบปลาโลมา
              </span>
              <div className="text-base font-black text-white bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                {getDolphinCurrentPhrase()}
              </div>
              <button
                type="button"
                onClick={handleNextDolphinStep}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1 active:scale-95"
              >
                <span>คนถัดไปพูดต่อ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Special Helper for Point of Doom */}
          {game.id === 'chill_point_of_doom' && (
            <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl p-3.5 text-center space-y-2">
              <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase block">
                ปุ่มนับ 3-2-1 ชี้หน้าพร้อมกัน
              </span>
              {pointCountdown === null ? (
                <button
                  type="button"
                  onClick={() => setPointCountdown(3)}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs active:scale-95"
                >
                  เริ่มนับ 3-2-1 ชี้หน้า!
                </button>
              ) : pointCountdown > 0 ? (
                <span className="font-mono text-3xl font-black text-amber-400 animate-pulse block">
                  {pointCountdown}
                </span>
              ) : (
                <span className="font-black text-rose-500 text-lg block animate-bounce">
                  👉 ชี้หน้าคนนั้นเลย!
                </span>
              )}
            </div>
          )}

          {/* Participant Badges */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>ผู้ร่วมภารกิจ ({game.playerRequirement}):</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {participantPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border ${p.avatarColor}`}
                  >
                    {p.name.slice(0, 1)}
                  </div>
                  <span>{p.name}</span>
                  {roleDescriptions && roleDescriptions[p.id] && (
                    <span className="text-[10px] text-amber-400 font-normal">
                      ({roleDescriptions[p.id]})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optional Timer */}
          {timeLeft !== null && (
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">เวลานับถอยหลัง</span>
                <span
                  className={`font-mono text-3xl font-black ${
                    timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-amber-400'
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTimer}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 ${
                    isTimerRunning
                      ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                      : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'หยุด' : 'เริ่มจับเวลา'}</span>
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white active:scale-95"
                  title="รีเซ็ตเวลา"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Instructions Checklist */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-zinc-300">วิธีเล่น:</span>
            <ul className="space-y-1 text-xs text-zinc-300">
              {game.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/50">
                  <span className="text-amber-400 font-bold font-mono">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Penalty Callout */}
          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-center text-xs font-bold text-rose-300">
            🍺 {game.penaltyText}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {onSkip && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSkip();
                }}
                className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all border border-zinc-800"
              >
                <ShieldX className="w-4 h-4 text-zinc-400" />
                <span>ข้ามมินิเกม</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sounds.playTurnChime();
                onComplete();
              }}
              className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-amber-950/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>เล่นเสร็จสิ้น (ไปต่อ)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
