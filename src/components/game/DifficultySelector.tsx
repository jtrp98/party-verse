'use client';

import React from 'react';
import { GameDifficulty } from '@/lib/types/game';
import { sounds } from '@/lib/sound/webAudio';
import { Zap, Flame, Skull } from 'lucide-react';

interface DifficultySelectorProps {
  selectedDifficulty: GameDifficulty;
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
}

export const DIFFICULTY_OPTIONS: {
  id: GameDifficulty;
  name: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'EASY',
    name: 'EASY',
    desc: 'เล่นชิล กติกาไม่ซับซ้อน เวลาคิดเยอะ',
    icon: <Zap className="w-3.5 h-3.5 text-zinc-300" />,
  },
  {
    id: 'HARD',
    name: 'HARD',
    desc: 'ท้าทายขึ้น มีเวลาจำกัด เพิ่มกฎพิเศษ',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: 'EXTREME',
    name: 'EXTREME',
    desc: 'บทลงโทษเข้มข้น ดวลไหวพริบดุเดือด',
    icon: <Skull className="w-3.5 h-3.5 text-rose-500" />,
  },
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onSelectDifficulty,
}) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-black text-zinc-300 tracking-wider uppercase">
          DIFFICULTY (ระดับความยาก)
        </label>
        <span className="text-[11px] text-zinc-500">ความเข้มข้นของกติกา</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTY_OPTIONS.map((item) => {
          const isSelected = selectedDifficulty === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectDifficulty(item.id);
              }}
              className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 active:scale-95 ${
                isSelected
                  ? 'bg-zinc-900 border-amber-500/80 text-white shadow-lg ring-1 ring-amber-500/30'
                  : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-1">
                {item.icon}
                <span className="font-black text-xs">{item.name}</span>
              </div>
              <span className="text-[10px] leading-tight line-clamp-2 text-zinc-500">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
