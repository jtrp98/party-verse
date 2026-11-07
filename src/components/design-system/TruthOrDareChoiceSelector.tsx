'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Zap, Dices } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

export interface TruthOrDareChoiceSelectorProps {
  playerName: string;
  avatarColor: string;
  onSelect: (choice: 'TRUTH' | 'DARE' | 'WILDCARD') => void;
  disabled?: boolean;
}

export const TruthOrDareChoiceSelector: React.FC<TruthOrDareChoiceSelectorProps> = ({
  playerName,
  avatarColor,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300">
          <span className={`w-2.5 h-2.5 rounded-full ${avatarColor.split(' ')[0] || 'bg-amber-400'}`} />
          <span>ถึงตา {playerName} ตัดสินใจ</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          เลือกประเภทก่อนเปิดการ์ด
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400">
          การ์ดยังคว่ำอยู่ ตัดสินใจด้วยใจตัวเอง!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
        {/* TRUTH BUTTON */}
        <motion.button
          type="button"
          disabled={disabled}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            sounds.playClick();
            onSelect('TRUTH');
          }}
          className="relative group p-5 rounded-3xl bg-gradient-to-b from-cyan-950/60 to-zinc-900 border-2 border-cyan-500/40 hover:border-cyan-400 text-left transition-all shadow-tactile-rest hover:shadow-cyan-500/20 hover:shadow-lg flex flex-col justify-between min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              ความจริง
            </div>
            <div className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-200">
              TRUTH
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
              เปิดใจตอบคำถามลับอย่างตรงไปตรงมา
            </div>
          </div>
        </motion.button>

        {/* DARE BUTTON */}
        <motion.button
          type="button"
          disabled={disabled}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            sounds.playClick();
            onSelect('DARE');
          }}
          className="relative group p-5 rounded-3xl bg-gradient-to-b from-rose-950/60 to-zinc-900 border-2 border-rose-500/40 hover:border-rose-400 text-left transition-all shadow-tactile-rest hover:shadow-rose-500/20 hover:shadow-lg flex flex-col justify-between min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
              ความกล้า
            </div>
            <div className="text-xl sm:text-2xl font-black text-white group-hover:text-rose-200">
              DARE
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
              รับคำท้าทำภารกิจสุดเร้าใจกับเพื่อน
            </div>
          </div>
        </motion.button>
      </div>

      {/* SURPRISE / WILDCARD OPTION */}
      <motion.button
        type="button"
        disabled={disabled}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          sounds.playClick();
          onSelect('WILDCARD');
        }}
        className="w-full py-3 px-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-400 text-zinc-300 hover:text-amber-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
      >
        <Dices className="w-4 h-4 text-amber-400" />
        <span>ให้โชคชะตากำหนด (สุ่ม Truth หรือ Dare ให้ฉัน!)</span>
      </motion.button>
    </div>
  );
};
