'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, RotateCcw, Flame } from 'lucide-react';
import { Player } from '@/lib/types/redesign';
import { sounds } from '@/lib/sound/webAudio';
import confetti from 'canvas-confetti';

export interface SocialVoteWidgetProps {
  players: Player[];
  prompt: string;
  onComplete?: (winnerPlayerId: string) => void;
}

export const SocialVoteWidget: React.FC<SocialVoteWidgetProps> = ({
  players,
  prompt,
  onComplete,
}) => {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [hasRevealed, setHasRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const totalVotesCast = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (playerId: string) => {
    sounds.playClick();
    setVotes((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1,
    }));
  };

  const handleStart321Countdown = () => {
    sounds.playFanfare();
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          sounds.playBuzzer();
          setHasRevealed(true);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          return null;
        }
        sounds.playHeartbeat();
        return prev - 1;
      });
    }, 1000);
  };

  // Find winner
  let maxVotes = 0;
  let winnerId: string | null = null;
  Object.entries(votes).forEach(([pId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = pId;
    }
  });

  const winner = winnerId ? players.find((p) => p.id === winnerId) : null;

  return (
    <div className="w-full rounded-3xl bg-zinc-950/80 border-2 border-purple-500/40 p-4 sm:p-5 space-y-4 shadow-lg text-slate-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-purple-400">
            โหวตลับในวง (SOCIAL VOTE)
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800">
          ลงคะแนนแล้ว {totalVotesCast} คน
        </span>
      </div>

      <div className="text-center py-1">
        <p className="text-sm sm:text-base font-bold text-zinc-200">
          {prompt}
        </p>
      </div>

      {/* 3-2-1 Real life pointing mode banner */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-600 text-white text-center shadow-xl space-y-2"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-purple-200">
              เตรียมชี้นิ้วพร้อมกันใน...
            </div>
            <div className="text-6xl font-black font-mono animate-bounce">
              {countdown}
            </div>
            <div className="text-xs text-white/90">
              นับถึง 0 แล้วชี้นิ้วไปที่คนที่ใช่ที่สุดพร้อมกัน!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Vote Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players.map((p) => {
          const count = votes[p.id] || 0;
          const isWinner = hasRevealed && winnerId === p.id && maxVotes > 0;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleVote(p.id)}
              className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                isWinner
                  ? 'bg-purple-500/25 border-purple-400 ring-2 ring-purple-400 shadow-purple-500/30 shadow-lg'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 active:scale-95'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${p.avatarColor.split(' ')[0] || 'bg-amber-400'}`} />
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isWinner && <Crown className="w-4 h-4 text-amber-400" />}
                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-full ${
                  count > 0 ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls: 3-2-1 Countdown OR Reveal */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleStart321Countdown}
          className="flex-1 min-h-[44px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs sm:text-sm font-black text-purple-300 flex items-center justify-center gap-1.5 transition-all"
        >
          <Flame className="w-4 h-4 text-purple-400" />
          <span>นับ 3-2-1 ชี้ในวง</span>
        </button>

        {!hasRevealed ? (
          <button
            type="button"
            onClick={() => {
              sounds.playFanfare();
              setHasRevealed(true);
              if (winnerId && onComplete) onComplete(winnerId);
              confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
            }}
            disabled={totalVotesCast === 0}
            className="flex-1 min-h-[44px] rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <Crown className="w-4 h-4" />
            <span>เปิดเผยผลโหวต</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setVotes({});
              setHasRevealed(false);
            }}
            className="min-h-[44px] px-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
            title="รีเซ็ตคะแนน"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Winner announcement */}
      {hasRevealed && winner && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/50 text-center text-xs sm:text-sm text-purple-200"
        >
          👑 <strong>{winner.name}</strong> ได้คะแนนโหวตสูงสุดในรอบนี้ ({maxVotes} โหวต)!
        </motion.div>
      )}
    </div>
  );
};
