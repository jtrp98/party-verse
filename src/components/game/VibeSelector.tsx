'use client';

import React from 'react';
import { GameVibeLevel } from '@/lib/types/game';
import { sounds } from '@/lib/sound/webAudio';
import { Sparkles, ShieldAlert } from 'lucide-react';

interface VibeSelectorProps {
  selectedLevel: GameVibeLevel;
  onSelectLevel: (level: GameVibeLevel) => void;
}

export interface VibeItem {
  level: GameVibeLevel;
  icon: string;
  name: string;
  tagline: string;
  description: string;
  ageTag?: string;
  borderColor: string;
  badgeBg: string;
}

export const VIBE_ITEMS: VibeItem[] = [
  {
    level: 'CHILL',
    icon: '🍻',
    name: 'CHILL (สายฮา & วงเหล้าไทย)',
    tagline: 'เพื่อนสนิท แกล้งกัน ชิงไหวพริบ',
    description: 'เกมปลาโลมา (โดดน้ำ บุ๋ม!), นับเลข 7/3-6-9, 007 บ่างช่างปืน, ชี้หน้ามรณะ และหมวดหมู่สายฟ้าแลบ',
    borderColor: 'border-amber-500/60',
    badgeBg: 'bg-amber-500/10 text-amber-300',
  },
  {
    level: 'FLIRTY',
    icon: '💕',
    name: 'FLIRTY (คนคุย & หยอดเสน่ห์)',
    tagline: 'ชวนเขิน สบตาระยะประชิด ใจเต้นแรง',
    description: 'สบตาห่าง 3 ซม. ห้ามยิ้ม, ดมกลิ่นน้ำหอม, สุ่มจับมือค้าง 1 รอบ, หยอดคำหวานข้างหู',
    borderColor: 'border-rose-400/60',
    badgeBg: 'bg-rose-500/10 text-rose-300',
  },
  {
    level: 'SPICY',
    icon: '🔥',
    name: 'SPICY (18+ ปาร์ตี้ผู้ใหญ่)',
    tagline: 'อุณหภูมิห้องเริ่มร้อน สกินชิพใกล้ชิด',
    description: 'นั่งตักสบตา, ซุกไซ้ซอกคอ 5 วิ, ปลดกระดุม, แลกจูบดูดดื่ม, สุ่มจับคู่ทำภารกิจใกล้ชิดสองคน',
    ageTag: '18+',
    borderColor: 'border-amber-500/80',
    badgeBg: 'bg-amber-500/20 text-amber-300',
  },
  {
    level: 'NAUGHTY',
    icon: '😈',
    name: 'NAUGHTY (20+ เรื่องบนเตียง & แฟนตาซี)',
    tagline: 'เปิดอกความลับเรื่องความฟิน & Dirty Talk',
    description: 'ท่าโปรดที่เสร็จไวสุด, จุดเสียวที่สัมผัสแล้วขนลุก, ตีก้น (Spank), สัมผัสใต้ร่มผ้า, ถอดเสื้อผ้า 1 ชิ้น',
    ageTag: '20+',
    borderColor: 'border-rose-500/80',
    badgeBg: 'bg-rose-500/20 text-rose-300',
  },
  {
    level: 'UNLEASHED',
    icon: '🖤',
    name: 'UNLEASHED (20+ ปลดปล่อยขีดจำกัด)',
    tagline: 'ขั้นสุดของความท้าทาย & บทบาทสมมติ',
    description: 'ระดับสูงสุดสำหรับผู้ใหญ่ สำรวจบทบาทสมมติ (Roleplay) ออกคำสั่ง Master และการกล้าได้กล้าเสีย',
    ageTag: '20+ Adv',
    borderColor: 'border-purple-500/80',
    badgeBg: 'bg-purple-500/20 text-purple-300',
  },
];

export const VibeSelector: React.FC<VibeSelectorProps> = ({ selectedLevel, onSelectLevel }) => {
  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-black text-zinc-300 tracking-wider uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>เลือกระดับความเข้มข้น (5 LEVELS)</span>
        </label>
        <span className="text-[11px] text-zinc-500">ไต่ระดับความเร้าใจ</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {VIBE_ITEMS.map((vibe) => {
          const isSelected = selectedLevel === vibe.level;
          return (
            <button
              key={vibe.level}
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectLevel(vibe.level);
              }}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                isSelected
                  ? `bg-zinc-900 ${vibe.borderColor} shadow-lg ring-1 ring-white/10`
                  : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{vibe.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs tracking-wide text-white">
                        {vibe.name}
                      </span>
                      {vibe.ageTag && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <ShieldAlert className="w-2.5 h-2.5 inline" />
                          {vibe.ageTag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-amber-400/90">{vibe.tagline}</p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-amber-400 bg-amber-400/20' : 'border-zinc-700 bg-transparent'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </div>

              <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed pl-9">
                {vibe.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
