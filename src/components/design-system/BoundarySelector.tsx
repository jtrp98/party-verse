'use client';

import React from 'react';
import { Shield, Sparkles, Wine, MessageCircle, HandHeart } from 'lucide-react';
import { SessionBoundaries } from '@/lib/types/redesign';
import { sounds } from '@/lib/sound/webAudio';

export interface BoundarySelectorProps {
  boundaries: SessionBoundaries;
  onChange: (boundaries: SessionBoundaries) => void;
  className?: string;
}

export const BoundarySelector: React.FC<BoundarySelectorProps> = ({
  boundaries,
  onChange,
  className = '',
}) => {
  const toggle = (key: keyof SessionBoundaries) => {
    sounds.playClick();
    onChange({
      ...boundaries,
      [key]: !boundaries[key],
    });
  };

  const options: {
    key: keyof SessionBoundaries;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'allowPhysical',
      title: 'สกินชิพ & สัมผัสทางกาย',
      desc: 'จับมือ กอด ซบ หรือใกล้ชิด (ข้ามได้เสมอหากใครไม่สะดวก)',
      icon: <HandHeart className="w-5 h-5 text-amber-400" />,
    },
    {
      key: 'allowAlcohol',
      title: 'ภารกิจเกี่ยวกับแอลกอฮอล์',
      desc: 'หากปิด จะแสดงทางเลือกสายคลีน/สนุกแบบไร้แอลกอฮอล์แทน',
      icon: <Wine className="w-5 h-5 text-rose-400" />,
    },
    {
      key: 'allowExplicitTalk',
      title: 'คำถามเปิดอก 18+ เรื่องบนเตียง',
      desc: 'เรื่องลับ ประสบการณ์ และความชอบส่วนตัว',
      icon: <MessageCircle className="w-5 h-5 text-sky-400" />,
    },
  ];

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-black text-white">
            อะไรที่โอเคสำหรับทุกคน?
          </h3>
        </div>
        <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full">
          Safe & Respectful
        </span>
      </div>

      <div className="space-y-2.5">
        {options.map((opt) => {
          const isChecked = boundaries[opt.key];
          return (
            <button
              key={opt.key}
              type="button"
              role="switch"
              aria-checked={isChecked}
              onClick={() => toggle(opt.key)}
              className={`w-full min-h-[58px] p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all duration-200 active:scale-[0.99] select-none ${
                isChecked
                  ? 'bg-zinc-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-xl flex-shrink-0 ${isChecked ? 'bg-zinc-800' : 'bg-zinc-900 opacity-60'}`}>
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm sm:text-base font-black truncate ${isChecked ? 'text-white' : 'text-zinc-400'}`}>
                    {opt.title}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 leading-snug line-clamp-1">
                    {opt.desc}
                  </div>
                </div>
              </div>

              {/* Toggle switch visual indicator */}
              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0 duration-200 ease-in-out ${
                  isChecked ? 'bg-amber-400' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-stone-950 shadow-md transform transition-transform duration-200 ease-in-out ${
                    isChecked ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>ไม่สะดวกเมื่อไหร่ ข้ามได้เสมอ ทุกภารกิจต้องได้รับความยินยอมพร้อมใจ</span>
      </div>
    </div>
  );
};
