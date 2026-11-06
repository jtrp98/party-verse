'use client';

import React from 'react';
import { ProgressionPhase } from '@/lib/types/game';
import { PHASE_CONFIG } from '@/lib/engine/progressionEngine';
import { Dices } from 'lucide-react';

interface PartyProgressBarProps {
  currentPhase: ProgressionPhase;
  progressPercent: number; // 0 to 100
  label?: string;
  cleanMode?: boolean;
}

export const PartyProgressBar: React.FC<PartyProgressBarProps> = ({
  currentPhase,
  progressPercent,
  label,
  cleanMode = false,
}) => {
  const phaseInfo = PHASE_CONFIG[currentPhase];

  if (cleanMode) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg select-none">
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>ความคืบหน้า</span>
            </span>
          </div>
          <span className="font-mono font-bold text-amber-400 text-xs">
            {label ? label : `${progressPercent}%`}
          </span>
        </div>

        {/* Clean segmented gradient bar */}
        <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
          <div
            className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 shadow-md"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg select-none">
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full font-bold text-[11px] shadow-sm"
            style={{
              backgroundColor: `${phaseInfo.accentColor}25`,
              color: phaseInfo.accentColor,
              border: `1px solid ${phaseInfo.accentColor}50`,
            }}
          >
            {phaseInfo.badge}
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline truncate max-w-[200px]">
            {phaseInfo.description}
          </span>
        </div>
        <span className="font-mono font-bold text-slate-300">
          {label ? label : `${progressPercent}%`}
        </span>
      </div>

      {/* 4 Phase segmented bar */}
      <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
        {/* Fill */}
        <div
          className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 via-rose-500 to-purple-500 shadow-md"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Markers */}
      <div className="flex justify-between text-[9px] font-bold text-slate-500 mt-1 px-1">
        <span>0% Warm Up</span>
        <span>25% Build Up</span>
        <span>50% Peak</span>
        <span>75% Finale</span>
        <span>100%</span>
      </div>
    </div>
  );
};
