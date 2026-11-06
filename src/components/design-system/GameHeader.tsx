'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2, VolumeX, Eye } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';
import { AccessibilityModal } from './AccessibilityModal';

export interface GameHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title = 'PARTY-VERSE',
  showBack = false,
  backHref = '/',
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(sounds.getIsMuted());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/85 border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <Link
                href={backHref}
                onClick={() => sounds.playClick()}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 transition-all"
                aria-label="ย้อนกลับไปหน้าหลัก"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              <span className="font-black tracking-widest text-white text-base sm:text-lg uppercase">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsA11yOpen(true);
              }}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 flex items-center justify-center active:scale-95 transition-all"
              aria-label="เปิดการตั้งค่าการเข้าถึง"
            >
              <Eye className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                const next = sounds.toggleMute();
                setIsMuted(next);
                if (!next) sounds.playClick();
              }}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 transition-all"
              aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-zinc-500" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      <AccessibilityModal isOpen={isA11yOpen} onClose={() => setIsA11yOpen(false)} />
    </>
  );
};
