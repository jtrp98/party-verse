'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Play,
  RotateCcw,
  ShieldCheck,
  Flame,
  Smile,
  Wine,
} from 'lucide-react';
import { loadActiveSession, clearActiveSession } from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';
import { GameHeader } from '@/components/design-system/GameHeader';

interface ResumeSessionInfo {
  mode?: string;
  gameId?: string;
  rating?: 'NORMAL' | 'NSFW';
  normalPack?: string;
  currentRound?: number;
  totalRounds?: number;
  players?: Array<{ name: string }>;
  partnerAName?: string;
  partnerBName?: string;
  drawnCards?: Array<{ id: string }>;
  status?: string;
}

export default function HomePage() {
  const [activeSession, setActiveSession] = useState<ResumeSessionInfo | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const session = loadActiveSession<ResumeSessionInfo>();
      if (session && session.status !== 'FINISHED') {
        setActiveSession(session);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleClearSession = () => {
    if (confirm('คุณต้องการยกเลิกเกมที่ค้างอยู่ใช่หรือไม่?')) {
      clearActiveSession();
      setActiveSession(null);
      sounds.playClick();
    }
  };

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="PARTYVERSE" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ===================== HERO SECTION ===================== */}
        <section className="text-center space-y-3 pt-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-black tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>TABLETOP SOCIAL GAME PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">
            PARTY<span className="text-amber-400">VERSE</span>
          </h1>

          <div className="text-sm sm:text-base font-black tracking-widest text-amber-400/90 uppercase">
            CHOOSE. REVEAL. REACT.
          </div>

          <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto">
            เว็บเกมภาษาไทยสำหรับวงที่เล่นด้วยกันและส่งมือถือเครื่องเดียวต่อกัน
            <br />
            <span className="text-zinc-400 text-xs sm:text-sm">
              ทุกเกมมี <strong>Normal</strong> และ <strong>NSFW</strong> พร้อมกติกาแอลกอฮอล์และตัวเลือกไร้แอลกอฮอล์ที่ปลอดภัย
            </span>
          </p>
        </section>

        {/* ===================== CONTINUE PLAYING (IF ACTIVE) ===================== */}
        {activeSession && (
          <section
            aria-label="เกมที่กำลังเล่นค้างอยู่"
            className="p-5 sm:p-6 rounded-3xl bg-zinc-900/95 border-2 border-amber-500/50 shadow-gold-glow space-y-4 max-w-xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm sm:text-base font-black text-amber-300">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>เล่นต่อจากที่ค้างไว้</span>
              </span>

              <span className="text-xs sm:text-sm font-mono text-zinc-300 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                {activeSession.mode === 'PARTY' && `รอบ ${activeSession.currentRound || 1} / ${activeSession.totalRounds || 3}`}
                {activeSession.mode === 'COUPLE' && `รอบ ${activeSession.currentRound || 1} / ${activeSession.totalRounds || 3}`}
                {activeSession.gameId === 'doraemon' && `จั่วแล้ว ${activeSession.drawnCards?.length || 0}/52 ใบ`}
              </span>
            </div>

            <div className="text-base sm:text-lg font-black text-white flex items-center justify-between">
              <span>
                {activeSession.mode === 'PARTY'
                  ? `PARTY: วงเพื่อน (${activeSession.players?.length || 3} คน)`
                  : activeSession.mode === 'COUPLE'
                  ? `COUPLE: สองเรา (${activeSession.partnerAName} & ${activeSession.partnerBName})`
                  : 'DORAEMON ARCADE (ไพ่ 52 ใบ)'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-md font-black border ${activeSession.rating === 'NSFW' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                {activeSession.rating === 'NSFW' ? 'NSFW (18+)' : 'NORMAL'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Link
                href={
                  activeSession.mode === 'PARTY'
                    ? '/games/party'
                    : activeSession.mode === 'COUPLE'
                    ? '/games/couples'
                    : '/games/doraemon'
                }
                onClick={() => sounds.playClick()}
                className="flex-1 min-h-[52px] rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-base text-center flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>เล่นต่อ</span>
              </Link>

              <button
                type="button"
                onClick={handleClearSession}
                className="min-h-[52px] min-w-[52px] p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 flex items-center justify-center active:scale-95 transition-all"
                title="ล้างเกมที่ค้าง"
                aria-label="ล้างเกมที่ค้าง"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {/* ===================== THREE MAIN GAME CARDS (NORMAL & NSFW) ===================== */}
        <section
          aria-label="เลือกโหมดเกม"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-2"
        >
          {/* 1. PARTY MODE */}
          <div className="rounded-3xl bg-zinc-900/90 border-2 border-amber-500/30 hover:border-amber-400/80 p-5 shadow-tactile-rest flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-950 border border-white/10">
                <Image
                  src="/assets/party-hero.jpg"
                  alt="กลุ่มเพื่อนเล่นเกมปาร์ตี้"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md">
                  3–12 คน • SOCIAL CHAOS
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">PARTY</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Truth or Dare เลือกก่อนเปิดการ์ด, โหวตเล่นสนุก, แฉความลับ และ Wildcard Events สนุกสะใจ
                </p>
              </div>
            </div>

            <div className="pt-5 space-y-2.5">
              <Link
                href="/games/party?mode=normal"
                onClick={() => sounds.playClick()}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/40 transition-all"
              >
                <Smile className="w-4 h-4" />
                <span>เล่น Normal (ขำ ๆ / เปิดใจ / แข่งขัน)</span>
              </Link>

              <Link
                href="/games/party?mode=nsfw"
                onClick={() => sounds.playClick()}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 shadow-md transition-all"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>เล่น NSFW (เพดาน 1–5 • 18+)</span>
              </Link>
            </div>
          </div>

          {/* 2. COUPLE MODE */}
          <div className="rounded-3xl bg-zinc-900/90 border-2 border-rose-500/30 hover:border-rose-400/80 p-5 shadow-tactile-rest flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-950 border border-white/10">
                <Image
                  src="/assets/couple-hero.jpg"
                  alt="คู่รักเล่นเกมการ์ด"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md">
                  เล่น 2 คน • INTIMATE CHEMISTRY
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">COUPLE</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  SYNC 3-2-1 นับใจตรงกัน, Truth or Dare คัดตามระดับความสนิท 1–5 และสรุปผลเมื่อจบเกม
                </p>
              </div>
            </div>

            <div className="pt-5 space-y-2.5">
              <Link
                href="/games/couples?mode=normal"
                onClick={() => sounds.playClick()}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/40 transition-all"
              >
                <Smile className="w-4 h-4" />
                <span>เล่น Normal (ขำ ๆ / เปิดใจ / แข่งขัน)</span>
              </Link>

              <Link
                href="/games/couples?mode=nsfw"
                onClick={() => sounds.playClick()}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-md transition-all"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>เล่น NSFW (ความสนิท 1–5 + เพดาน 1–5)</span>
              </Link>
            </div>
          </div>

          {/* 3. DORAEMON CARD MODE */}
          <div className="rounded-3xl bg-zinc-900/90 border-2 border-sky-500/30 hover:border-sky-400/80 p-5 shadow-tactile-rest flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-950 border border-white/10">
                <Image
                  src="/assets/card-back.jpg"
                  alt="สำรับไพ่โดราเอมอน"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md">
                  2–12 คน • ไพ่ 52 ใบแท้
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">DORAEMON</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  จั่วไพ่ 52 ใบไม่ซ้ำ กติกาไทยแท้ A ถึง K พร้อมมินิเกมวงเหล้า และ K ใบที่ 4 ปิดวงสุดระทึก
                </p>
              </div>
            </div>

            <div className="pt-5 space-y-2.5">
              <Link
                href="/games/doraemon?mode=normal"
                onClick={() => sounds.playClick()}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/40 transition-all"
              >
                <Smile className="w-4 h-4" />
                <span>เล่น Normal (3 ชุดโจทย์ + แข่งขัน)</span>
              </Link>

              <Link
                href="/games/doraemon?mode=nsfw"
                onClick={() => sounds.playClick()}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-stone-950 shadow-md transition-all"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>เล่น NSFW (มินิเกมผู้ใหญ่ 1–5 + K ส่งท้าย)</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== CONSENT & BOUNDARIES BANNER ===================== */}
        <section className="p-5 sm:p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 text-center space-y-2 max-w-2xl mx-auto shadow-sm">
          <div className="inline-flex items-center gap-2 text-sm sm:text-base font-black text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <span>กติกาแอลกอฮอล์และความยินยอมพร้อมใจ (CONSENT & PASS)</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            ทั้ง Normal และ NSFW มีกติกาเครื่องดื่ม โดยทุกข้อมีตัวเลือกกิจกรรมแทน และผู้เล่นมีสิทธิ์ขอ <strong>Pass</strong> ข้ามได้ทันทีโดยไม่เสียแต้มและไม่ถูกบังคับดื่ม
          </p>
        </section>
      </main>
    </div>
  );
}
