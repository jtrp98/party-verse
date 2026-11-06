'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { loadActiveSession, clearActiveSession } from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';
import { GameHeader } from '@/components/design-system/GameHeader';
import { GameModeCard } from '@/components/design-system/GameModeCard';

interface ResumeSessionInfo {
  mode?: string;
  gameId?: string;
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
            <span>PREMIUM TACTILE PARTY GAME</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">
            PARTY<span className="text-amber-400">VERSE</span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-300 font-bold leading-relaxed">
            เลือกเกม แล้วสนุกไปด้วยกัน
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
                {activeSession.mode === 'PARTY' && `รอบ ${activeSession.currentRound || 1} / ${activeSession.totalRounds || 20}`}
                {activeSession.mode === 'COUPLE' && `รอบ ${activeSession.currentRound || 1} / ${activeSession.totalRounds || 16}`}
                {activeSession.gameId === 'doraemon' && `จั่วแล้ว ${activeSession.drawnCards?.length || 0}/52 ใบ`}
              </span>
            </div>

            <div className="text-base sm:text-lg font-black text-white">
              {activeSession.mode === 'PARTY'
                ? `Party Mode (${activeSession.players?.length || 3} คน)`
                : activeSession.mode === 'COUPLE'
                ? `Couple Mode (${activeSession.partnerAName} & ${activeSession.partnerBName})`
                : 'เกมไพ่โดราเอมอน'}
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

        {/* ===================== THREE MAIN GAME CARDS ===================== */}
        <section
          aria-label="เลือกโหมดเกม"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-2"
        >
          {/* 1. PARTY MODE */}
          <GameModeCard
            href="/games/party"
            title="ปาร์ตี้กับเพื่อน"
            badge="3 คนขึ้นไป • PARTY"
            description="เกมวงเหล้าและปาร์ตี้เพื่อนฝูง สบตา แฉความลับ และภารกิจฮา ปลอดภัยด้วยขอบเขตชัดเจน"
            imageSrc="/assets/party-hero.jpg"
            imageAlt="กลุ่มเพื่อนผู้ใหญ่นั่งล้อมโต๊ะเล่นเกมไพ่ปาร์ตี้"
            ctaText="เริ่มเล่น"
            variant="party"
          />

          {/* 2. COUPLE MODE */}
          <GameModeCard
            href="/games/couples"
            title="เกมสำหรับคู่รัก"
            badge="เล่น 2 คน • COUPLE"
            description="กระชับความสัมพันธ์ ทายใจ SYNC 3-2-1 สำรวจความรู้ใจและจุดไฟรักอย่างเป็นธรรมชาติ"
            imageSrc="/assets/couple-hero.jpg"
            imageAlt="คู่รักสองคนนั่งคุยและเล่นเกมการ์ดบนโซฟาในบรรยากาศอบอุ่น"
            ctaText="เริ่มเล่น"
            variant="couple"
          />

          {/* 3. DORAEMON CARD MODE */}
          <GameModeCard
            href="/games/doraemon"
            title="เกมไพ่โดราเอมอน"
            badge="จั่วไพ่ 52 ใบ • ARCADE"
            description="ไพ่ 52 ใบแท้ กติกาไทยแท้ สับและจั่วไม่ซ้ำ พร้อมเพดานความเดือดและมินิเกมวงเหล้า"
            imageSrc="/assets/card-back.jpg"
            imageAlt="สำรับไพ่โดราเอมอนสีน้ำเงินทองและลวดลายเรโทรอาร์เคด"
            ctaText="เริ่มจั่วไพ่"
            variant="doraemon"
          />
        </section>

        {/* ===================== CONSENT & BOUNDARIES BANNER ===================== */}
        <section className="p-5 sm:p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 text-center space-y-2 max-w-2xl mx-auto shadow-sm">
          <div className="inline-flex items-center gap-2 text-sm sm:text-base font-black text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <span>SAFE, CONSENSUAL & RESPECTFUL</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            ผู้เล่นทุกคนมีสิทธิ์ข้ามภารกิจได้เสมอโดยไม่มีบทลงโทษ และทุกภารกิจต้องได้รับความยินยอมพร้อมใจ (Affirmative Consent) จากทุกคนในวง
          </p>
        </section>
      </main>
    </div>
  );
}
