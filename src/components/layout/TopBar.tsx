'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, BarChart3, ArrowLeft } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

interface TopBarProps {
  showBack?: boolean;
  backHref?: string;
  onOverviewClick?: () => void;
  title?: string;
  activePlayerName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  showBack = false,
  backHref = '/',
  onOverviewClick,
  title = 'PARTYVERSE',
  activePlayerName,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(sounds.getIsMuted());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
    if (!next) {
      sounds.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between select-none">
      <div className="flex items-center gap-2.5">
        {showBack && (
          <Link
            href={backHref}
            onClick={() => sounds.playClick()}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
        <div>
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="flex items-center gap-2 text-base font-black tracking-widest text-white hover:opacity-90 transition-opacity"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            <span className="uppercase">{title}</span>
          </Link>
          {activePlayerName && (
            <p className="text-[11px] text-amber-400/90 font-bold">ตาของ: {activePlayerName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onOverviewClick && (
          <button
            onClick={() => {
              sounds.playClick();
              onOverviewClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>OVERVIEW</span>
          </button>
        )}

        <button
          onClick={handleToggleSound}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95"
          aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>
    </header>
  );
};
