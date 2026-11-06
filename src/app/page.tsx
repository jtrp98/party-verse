'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Users, ArrowRight, Dices, Clock } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { loadActiveSession, hasActiveSession } from '@/lib/engine/sessionManager';
import { BaseGameSession } from '@/lib/types/game';
import { sounds } from '@/lib/sound/webAudio';

interface GameItem {
  id: string;
  title: string;
  category: 'CARD' | 'PARTY' | 'SOCIAL';
  description: string;
  badge: string;
  isReady: boolean;
  href?: string;
  icon: string;
  playersText: string;
  cardBorder: string;
  badgeColor: string;
}

const ALL_GAMES: GameItem[] = [
  // READY FOR PLAY
  {
    id: 'couple-challenge',
    title: 'Couple Challenge (ทายใจคู่รัก)',
    category: 'SOCIAL',
    description: '125+ คำถามวัดใจ 3-2-1 ทายใจเรื่องบนเตียง และภารกิจสกินชิพจุดไฟรักสำหรับคนคุย แฟน และคู่รัก',
    badge: '💖 125+ ภารกิจ',
    isReady: true,
    href: '/games/couples',
    icon: '💑',
    playersText: '2 คน (คู่รัก/แฟน)',
    cardBorder: 'border-rose-500/40 hover:border-rose-500',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    id: 'doraemon',
    title: 'Doraemon Card Game',
    category: 'CARD',
    description: 'ไพ่โดราเอมอน 52 ใบแท้ กติกาไทย สับและจั่วไม่ซ้ำ พร้อม 50+ มินิเกมวงเหล้า และ Live Tracker',
    badge: '🍺 50+ มินิเกม',
    isReady: true,
    href: '/games/doraemon',
    icon: '🍺',
    playersText: '2–10+ คน',
    cardBorder: 'border-amber-500/40 hover:border-amber-500',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'truth-or-dare',
    title: 'Truth or Dare (จริงหรือกล้า)',
    category: 'PARTY',
    description: '255+ ความท้าทาย ปรับตามความสนิท 5 ระดับ (Chill ถึง Unleashed) ไม่ซ้ำซาก พร้อมระบบไต่ระดับความเดือด',
    badge: '🎭 255+ คำถาม',
    isReady: true,
    href: '/games/truth-or-dare',
    icon: '🎭',
    playersText: '2–10+ คน',
    cardBorder: 'border-zinc-700 hover:border-zinc-600',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },

  // EXPANSION LIBRARY
  {
    id: 'kings-cup',
    title: "King's Cup",
    category: 'CARD',
    description: 'ไพ่กษัตริย์สากล เทรวมลงแก้วกลาง ผู้โชคร้ายใบสุดท้ายดื่มหมดแก้ว',
    badge: 'เร็วๆ นี้',
    isReady: false,
    icon: '👑',
    playersText: '3–10 คน',
    cardBorder: 'border-zinc-800',
    badgeColor: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  },
  {
    id: 'higher-lower',
    title: 'Higher or Lower (สูงหรือต่ำ)',
    category: 'CARD',
    description: 'ทายหน้าไพ่ใบถัดไปว่าจะสูงกว่าหรือต่ำกว่า ทายผิดดื่ม ทายถูกส่งต่อ',
    badge: 'เร็วๆ นี้',
    isReady: false,
    icon: '🃏',
    playersText: '2–8 คน',
    cardBorder: 'border-zinc-800',
    badgeColor: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  },
  {
    id: 'never-have-i-ever',
    title: 'Never Have I Ever (ฉันไม่เคย...)',
    category: 'PARTY',
    description: 'ใครเคยทำดื่ม! เปิดเผยความลับและวีรกรรมสุดพีคของเพื่อนในวง',
    badge: 'เร็วๆ นี้',
    isReady: false,
    icon: '🤫',
    playersText: '3–12 คน',
    cardBorder: 'border-zinc-800',
    badgeColor: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  },
  {
    id: 'bomb-timer',
    title: 'Bomb Timer (ส่งระเบิดเวลา)',
    category: 'PARTY',
    description: 'ตอบคำถามแล้วรีบส่งต่อโทรศัพท์ ระเบิดเวลาในมือใครคนนั้นดื่ม!',
    badge: 'เร็วๆ นี้',
    isReady: false,
    icon: '💣',
    playersText: '3–10 คน',
    cardBorder: 'border-zinc-800',
    badgeColor: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  },
];

export default function HomePage() {
  const [activeSession, setActiveSession] = useState<BaseGameSession | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CARD' | 'PARTY' | 'SOCIAL'>('ALL');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasActiveSession()) {
        const session = loadActiveSession<BaseGameSession>();
        if (session && session.status !== 'FINISHED') {
          setActiveSession(session);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredGames = categoryFilter === 'ALL'
    ? ALL_GAMES
    : ALL_GAMES.filter((g) => g.category === categoryFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12">
      <TopBar />

      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
        {/* ===================== HERO SECTION ===================== */}
        <section className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-black tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ONE DEVICE, ENDLESS PARTY GAMES</span>
          </div>

          <h1 className="text-3xl font-black tracking-widest text-white uppercase">
            PARTYVERSE
          </h1>

          <p className="text-xs text-zinc-400 leading-relaxed px-4">
            รวมเกมวงเหล้า เกมคู่รัก และเกมปาร์ตี้ เล่นร่วมกันผ่านมือถือเครื่องเดียว ผลัดกันจั่วไพ่ ตอบคำถาม และประลองมินิเกม ไม่ต้องโหลดแอป ฟรี 100%
          </p>
        </section>

        {/* ===================== RESUME GAME BANNER ===================== */}
        {activeSession && (
          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>กำลังเล่นค้างอยู่</span>
              </span>
              <h3 className="text-sm font-black text-white">
                {activeSession.gameId === 'doraemon'
                  ? 'Doraemon Card Game'
                  : activeSession.gameId === 'couples'
                  ? 'Couple Challenge'
                  : 'Truth or Dare'}
              </h3>
              <p className="text-xs text-zinc-400">
                ผู้เล่น {activeSession.players?.length || 2} คน • Vibe: {activeSession.level}
              </p>
            </div>

            <Link
              href={
                activeSession.gameId === 'doraemon'
                  ? '/games/doraemon'
                  : activeSession.gameId === 'couples'
                  ? '/games/couples'
                  : '/games/truth-or-dare'
              }
              onClick={() => sounds.playClick()}
              className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-amber-950/40"
            >
              <span>เล่นต่อ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ===================== CATEGORY TABS ===================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-zinc-300 tracking-wider uppercase flex items-center gap-2">
              <Dices className="w-4 h-4 text-amber-400" />
              <span>คลังเกมปาร์ตี้</span>
            </h2>
            <span className="text-[11px] text-zinc-500">เลือกเกมที่ต้องการเล่น</span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'SOCIAL', label: '💑 คู่รัก/สองคน' },
              { id: 'CARD', label: '🃏 เกมไพ่' },
              { id: 'PARTY', label: '🎉 ปาร์ตี้' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setCategoryFilter(tab.id as typeof categoryFilter);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-950/40'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Games List */}
          <div className="space-y-3">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className={`p-4 rounded-3xl border bg-zinc-900/90 transition-all duration-200 ${game.cardBorder}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                      {game.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-white tracking-wide">
                          {game.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border shrink-0 ${game.badgeColor}`}
                  >
                    {game.badge}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>{game.playersText}</span>
                  </span>

                  {game.isReady && game.href ? (
                    <Link
                      href={game.href}
                      onClick={() => sounds.playClick()}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md ${
                        game.id === 'couple-challenge'
                          ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
                          : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-950/40'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>เข้าเล่นเลย</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-zinc-500 font-bold italic">
                      เร็วๆ นี้
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== FOOTER INFO ===================== */}
        <footer className="pt-4 text-center space-y-1 text-zinc-500 text-[11px] border-t border-zinc-800/80">
          <p className="font-bold text-zinc-400">🍻 PARTYVERSE — Drinking & Party Games</p>
          <p>เล่นอย่างมีความรับผิดชอบ • ไม่ขับขี่ยานพาหนะเมื่อดื่มสุรา</p>
        </footer>
      </main>
    </div>
  );
}
