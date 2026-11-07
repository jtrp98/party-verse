'use client';

import React from 'react';
import { ShieldCheck, RefreshCw, SkipForward, ArrowDownCircle } from 'lucide-react';
import { IntensityLevel } from '@/lib/types/redesign';
import { sounds } from '@/lib/sound/webAudio';

export interface SafetyHUDProps {
  currentCeiling: IntensityLevel;
  onChangeCard?: () => void;
  onSafePass?: () => void;
  onLowerCeiling?: (newLevel: IntensityLevel) => void;
  onPausePlayer?: () => void;
  isTouchChallenge?: boolean;
}

export const SafetyHUD: React.FC<SafetyHUDProps> = ({
  currentCeiling,
  onChangeCard,
  onSafePass,
  onLowerCeiling,
  onPausePlayer,
  isTouchChallenge = false,
}) => {
  return (
    <div className="w-full space-y-2 pt-1 select-none">
      {/* Inline Skinship Consent Chip (non-blocking, gentle reminder) */}
      {isTouchChallenge && (
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold text-center animate-in fade-in">
          <span>🤝</span>
          <span>ภารกิจนี้มีสัมผัสทางกาย: ต้องได้รับความยินยอมพร้อมใจ (Affirmative Consent) จากทุกคนที่เกี่ยวข้อง</span>
        </div>
      )}

      {/* Safety Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 pl-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold hidden sm:inline">SAFE SPACE:</span>
          <span className="text-[11px] text-zinc-400">ข้ามได้เสมอ ไม่เสียแต้ม ไม่บังคับดื่ม</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onPausePlayer && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onPausePlayer();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-300 text-xs font-bold transition-all active:scale-95"
              title="พักชั่วคราว ข้ามตานี้ไปก่อน"
            >
              <span>พักตา</span>
            </button>
          )}

          {onChangeCard && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onChangeCard();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="สุ่มการ์ดใหม่ในระดับเดิม"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>เปลี่ยนการ์ด</span>
            </button>
          )}

          {onSafePass && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSafePass();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-rose-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="ขอ Pass ข้อนี้อย่างปลอดภัย"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>ขอ Pass</span>
            </button>
          )}

          {currentCeiling > 1 && onLowerCeiling && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onLowerCeiling((currentCeiling - 1) as IntensityLevel);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="ลดเพดานความเดือดลง 1 ระดับทันที (หากการ์ดปัจจุบันแรงเกิน จะปิดและจั่วใหม่)"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>ลดเดือด (L{currentCeiling - 1})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
