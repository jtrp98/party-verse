'use client';

import React, { useState } from 'react';
import { Flame, TrendingDown, X, Check } from 'lucide-react';
import { IntensityLevel, INTENSITY_TO_VIBE } from '@/lib/types/redesign';
import { sounds } from '@/lib/sound/webAudio';

export interface IntensityCeilingControlProps {
  currentCeiling: IntensityLevel;
  onLowerCeiling: (newCeiling: IntensityLevel) => void;
  className?: string;
}

const INTENSITY_DESCRIPTIONS: Record<IntensityLevel, { title: string; desc: string }> = {
  1: { title: 'CHILL (ระดับ 1)', desc: 'สายฮา ขำขัน ปลอดภัย เหมาะกับทุกคน' },
  2: { title: 'FLIRTY (ระดับ 2)', desc: 'หยอดเสน่ห์ สบตา ชวนเขินเบาๆ' },
  3: { title: 'SPICY (ระดับ 3)', desc: '18+ คุยเรื่องลับ สกินชิพใกล้ชิด' },
  4: { title: 'NAUGHTY (ระดับ 4)', desc: '20+ เรื่องบนเตียง สัมผัสถึงใจ' },
  5: { title: 'UNLEASHED (ระดับ 5)', desc: '20+ ปลดขีดจำกัด บทบาทสมมติ' },
};

export const IntensityCeilingControl: React.FC<IntensityCeilingControlProps> = ({
  currentCeiling,
  onLowerCeiling,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm ${className}`}>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500 fill-rose-500/30" />
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              เพดานความเดือดสูงสุด
            </div>
            <div className="text-sm font-black text-white">
              Level {currentCeiling} ({INTENSITY_TO_VIBE[currentCeiling]})
            </div>
          </div>
        </div>

        {currentCeiling > 1 && (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsOpen(true);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-500/30 text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>ลดระดับความเดือด</span>
          </button>
        )}
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ceiling-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border-2 border-zinc-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-rose-400" />
                <h3 id="ceiling-modal-title" className="text-xl font-black text-white">
                  ลดระดับความเดือด
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              เลือกระดับเพดานความเดือดใหม่ เกมรอบถัดไปจะไม่เกินระดับที่คุณเลือกโดยเด็ดขาด
            </p>

            <div className="space-y-2">
              {([1, 2, 3, 4, 5] as IntensityLevel[])
                .filter((lvl) => lvl < currentCeiling)
                .map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      sounds.playFanfare();
                      onLowerCeiling(lvl);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-400 transition-all flex items-center justify-between active:scale-98"
                  >
                    <div>
                      <div className="text-sm font-black text-amber-400">
                        {INTENSITY_DESCRIPTIONS[lvl].title}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {INTENSITY_DESCRIPTIONS[lvl].desc}
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-amber-400" />
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </>
  );
};
