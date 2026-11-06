'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Type, Sparkles, Volume2, VolumeX, X, Check } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

export interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
        setIsLargeText(document.documentElement.classList.contains('large-text-mode'));
        setIsReducedMotion(localStorage.getItem('partyverse_reduced_motion') === 'true');
        setIsMuted(sounds.getIsMuted());
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const toggleHighContrast = () => {
    sounds.playClick();
    const next = !isHighContrast;
    setIsHighContrast(next);
    if (next) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('partyverse_high_contrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.removeItem('partyverse_high_contrast');
    }
  };

  const toggleLargeText = () => {
    sounds.playClick();
    const next = !isLargeText;
    setIsLargeText(next);
    if (next) {
      document.documentElement.classList.add('large-text-mode');
      localStorage.setItem('partyverse_large_text', 'true');
    } else {
      document.documentElement.classList.remove('large-text-mode');
      localStorage.removeItem('partyverse_large_text');
    }
  };

  const toggleReducedMotion = () => {
    sounds.playClick();
    const next = !isReducedMotion;
    setIsReducedMotion(next);
    localStorage.setItem('partyverse_reduced_motion', String(next));
  };

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
    if (!next) sounds.playClick();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border-2 border-zinc-700 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-amber-400" />
            <h3 id="accessibility-title" className="text-xl font-black text-white">
              การเข้าถึง (Accessibility)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
            aria-label="ปิดการตั้งค่าการเข้าถึง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Large Text Mode */}
          <button
            type="button"
            role="switch"
            aria-checked={isLargeText}
            onClick={toggleLargeText}
            className={`w-full min-h-[54px] p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
              isLargeText
                ? 'bg-amber-500/20 border-amber-500 text-white font-black'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-sm font-black">โหมดตัวอักษรใหญ่พิเศษ</div>
                <div className="text-xs text-zinc-400">ขยายขนาดข้อความให้อ่านง่ายยิ่งขึ้น</div>
              </div>
            </div>
            {isLargeText && <Check className="w-5 h-5 text-amber-400" />}
          </button>

          {/* High Contrast */}
          <button
            type="button"
            role="switch"
            aria-checked={isHighContrast}
            onClick={toggleHighContrast}
            className={`w-full min-h-[54px] p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
              isHighContrast
                ? 'bg-amber-500/20 border-amber-500 text-white font-black'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-sm font-black">โหมดคอนทราสต์สูง</div>
                <div className="text-xs text-zinc-400">เพิ่มความคมชัดของสีและเส้นขอบ</div>
              </div>
            </div>
            {isHighContrast && <Check className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Reduced Motion */}
          <button
            type="button"
            role="switch"
            aria-checked={isReducedMotion}
            onClick={toggleReducedMotion}
            className={`w-full min-h-[54px] p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
              isReducedMotion
                ? 'bg-amber-500/20 border-amber-500 text-white font-black'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-sm font-black">ลดการเคลื่อนไหว (Reduced Motion)</div>
                <div className="text-xs text-zinc-400">เปิดการ์ดทันทีโดยไม่หมุน 3D</div>
              </div>
            </div>
            {isReducedMotion && <Check className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={!isMuted}
            onClick={toggleSound}
            className={`w-full min-h-[54px] p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
              !isMuted
                ? 'bg-amber-500/20 border-amber-500 text-white font-black'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {isMuted ? <VolumeX className="w-5 h-5 text-zinc-500" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
              <div className="text-left">
                <div className="text-sm font-black">เสียงเอฟเฟกต์ (Sound Effects)</div>
                <div className="text-xs text-zinc-400">{isMuted ? 'ปิดเสียงอยู่' : 'เปิดเสียงอยู่'}</div>
              </div>
            </div>
            {!isMuted && <Check className="w-5 h-5 text-amber-400" />}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-base shadow-md"
        >
          เรียบร้อย
        </button>
      </div>
    </div>
  );
};
