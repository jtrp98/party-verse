'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  Flame,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import { loadActiveSession, clearActiveSession } from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';

interface ResumeSessionInfo {
  mode?: string;
  gameId?: string;
  currentRound?: number;
  totalRounds?: number;
  players?: Array<{ name: string }>;
  partnerAName?: string;
  partnerBName?: string;
  status?: string;
}

export default function HomePage() {
  const [activeSession, setActiveSession] = useState<ResumeSessionInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(sounds.getIsMuted());
      const session = loadActiveSession<ResumeSessionInfo>();
      if (session && session.status !== 'FINISHED') {
        setActiveSession(session);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
          <span className="font-black tracking-widest text-white text-base">PARTY-VERSE</span>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = sounds.toggleMute();
            setIsMuted(next);
            if (!next) sounds.playClick();
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white active:scale-95"
          aria-label="สลับเสียง"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
        {/* ===================== HERO SECTION ===================== */}
        <section className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-black tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ONE DEVICE, ENDLESS PARTY GAMES</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
            PARTY<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500">-VERSE</span>
          </h1>

          <p className="text-xs text-zinc-400 leading-relaxed px-4">
            เว็บเกมปาร์ตี้และกระชับรักผู้ใหญ่ เล่นรอบวงผ่านมือถือเครื่องเดียว ไต่ระดับความเร้าใจอย่างเป็นธรรมชาติ ปลอดภัยและมีขอบเขตชัดเจน
          </p>
        </section>

        {/* ===================== RESUME ACTIVE SESSION ===================== */}
        {activeSession && (
          <section className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/40 space-y-3 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-black text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>มีการเล่นค้างอยู่</span>
              </span>
              <span className="text-zinc-400 text-[11px]">
                รอบ {activeSession.currentRound || 1} / {activeSession.totalRounds || 20}
              </span>
            </div>

            <div className="text-xs font-bold text-white">
              {activeSession.mode === 'PARTY'
                ? `Party Mode (${activeSession.players?.length || 3} คน)`
                : activeSession.mode === 'COUPLE'
                ? `Couple Mode (${activeSession.partnerAName} & ${activeSession.partnerBName})`
                : 'เกมการ์ดโดราเอมอน'}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                href={
                  activeSession.mode === 'PARTY'
                    ? '/games/party'
                    : activeSession.mode === 'COUPLE'
                    ? '/games/couples'
                    : '/games/doraemon'
                }
                onClick={() => sounds.playClick()}
                className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>เล่นต่อจากที่ค้างไว้</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (confirm('ต้องการยกเลิกเกมที่ค้างอยู่ใช่หรือไม่?')) {
                    clearActiveSession();
                    setActiveSession(null);
                  }
                }}
                className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400"
                title="ล้างเกมที่ค้าง"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ===================== TWO CORE EXPERIENCES ===================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              โหมดหลักที่แนะนำ (2 CORE EXPERIENCES)
            </h2>
            <span className="text-[10px] text-zinc-500">เลือกบรรยากาศที่ใช่</span>
          </div>

          {/* MODE A: PARTY MODE */}
          <Link
            href="/games/party"
            onClick={() => sounds.playClick()}
            className="block p-5 rounded-3xl bg-zinc-900/90 border border-amber-500/40 hover:border-amber-400 transition-all duration-200 shadow-xl group active:scale-[0.98] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Flame className="w-3.5 h-3.5" />
                  <span>3+ คน • PARTY MODE</span>
                </span>
                <span className="text-xs font-black text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>เริ่มเล่น</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  Party Mode (ปาร์ตี้โหมด 5 ระดับ)
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  เกมวงเหล้าและปาร์ตี้เพื่อนฝูง ละลายพฤติกรรม สบตา แฉความลับ และความท้าทาย 18+ ด้วยระบบไต่ระดับอัจฉริยะ (Warm Up → Build Up → Peak → Finale)
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                  255+ คำถาม & ภารกิจ
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                  Chill ถึง Unleashed
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-amber-400/90 border border-zinc-800">
                  Affirmative Consent
                </span>
              </div>
            </div>
          </Link>

          {/* MODE B: COUPLE MODE */}
          <Link
            href="/games/couples"
            onClick={() => sounds.playClick()}
            className="block p-5 rounded-3xl bg-zinc-900/90 border border-rose-500/40 hover:border-rose-400 transition-all duration-200 shadow-xl group active:scale-[0.98] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>2 คนเท่านั้น • COUPLE MODE</span>
                </span>
                <span className="text-xs font-black text-rose-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>เริ่มเล่น</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white group-hover:text-rose-300 transition-colors">
                  Couple Mode (ทายใจคู่รัก 3 ระยะความสัมพันธ์)
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  ออกแบบแยกเฉพาะตามระยะความสัมพันธ์: คนคุย / แฟนที่กำลังสร้างความไว้ใจ / คู่รักรู้ใจ พร้อมเกม SYNC 3-2-1 ทายใจเรื่องบนเตียงและภารกิจจุดไฟรัก
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                  150+ ภารกิจคู่รัก
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                  SYNC 3-2-1 ทายใจ
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-950 text-rose-400/90 border border-zinc-800">
                  สกินชิพ & ความไว้ใจ
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ===================== BONUS CLASSIC GAMES ===================== */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              เกมวงเหล้าคลาสสิก (DRINKING CARDS)
            </h2>
          </div>

          <Link
            href="/games/doraemon"
            onClick={() => sounds.playClick()}
            className="block p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍺</span>
                <div>
                  <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                    Doraemon Card Game (ไพ่โดราเอมอน)
                  </h3>
                  <p className="text-[11px] text-zinc-400">ไพ่ 52 ใบแท้ กติกาไทย สับและจั่วไม่ซ้ำ พร้อม 50+ มินิเกมวงเหล้า</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </section>

        {/* ===================== CONSENT & BOUNDARIES BANNER ===================== */}
        <section className="p-4 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>SAFE, CONSENSUAL & RESPECTFUL</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed px-2">
            ผู้เล่นทุกคนมีสิทธิ์ปฏิเสธหรือข้ามภารกิจได้ฟรีโดยไม่มีบทลงโทษ และทุกภารกิจที่มีสกินชิพต้องได้รับความยินยอมพร้อมใจ (Affirmative Consent) จากทุกฝ่าย
          </p>
        </section>
      </main>
    </div>
  );
}
