'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  Heart,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Check,
  X,
  HeartHandshake,
  TrendingDown,
  Timer as TimerIcon,
  Flame,
  Zap,
} from 'lucide-react';
import {
  CoupleSessionData,
  RelationshipStage,
  IntensityLevel,
  UnifiedChallenge,
  SessionBoundaries,
} from '@/lib/types/redesign';
import { COUPLE_CHALLENGES } from '@/lib/data/coupleChallenges';
import {
  calculateGamePhase,
  calculateAllowedIntensity,
  GAME_PHASES,
} from '@/lib/engine/pacingEngine';
import {
  selectNextUnifiedChallenge,
} from '@/lib/engine/coreSelectionEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
} from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';

export default function CoupleGamePage() {
  // Setup State
  const [partnerA, setPartnerA] = useState('ที่รัก');
  const [partnerB, setPartnerB] = useState('ตัวเอง');
  const [relationshipStage, setRelationshipStage] = useState<RelationshipStage>('BEFORE_INTIMACY');
  const [maxIntensity, setMaxIntensity] = useState<IntensityLevel>(3);
  const [totalRounds, setTotalRounds] = useState<number>(16);
  const [boundaries, setBoundaries] = useState<SessionBoundaries>({
    allowPhysical: true,
    allowAlcohol: true,
    allowExplicitTalk: true,
  });
  const [isSetup, setIsSetup] = useState(true);

  // In-Game State
  const [session, setSession] = useState<CoupleSessionData | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<UnifiedChallenge | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingConsentChallenge, setPendingConsentChallenge] = useState<UnifiedChallenge | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSyncCountdown, setIsSyncCountdown] = useState(false);
  const [syncCount, setSyncCount] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mount logic: Load active session
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(sounds.getIsMuted());
      const saved = loadActiveSession<CoupleSessionData>();
      if (saved && saved.mode === 'COUPLE' && saved.status !== 'FINISHED') {
        setSession(saved);
        setCurrentChallenge(saved.currentChallenge || null);
        setPartnerA(saved.partnerAName || 'ที่รัก');
        setPartnerB(saved.partnerBName || 'ตัวเอง');
        setRelationshipStage(saved.relationshipStage || 'BEFORE_INTIMACY');
        setMaxIntensity(saved.maxAllowedIntensity || 3);
        setTotalRounds(saved.totalRounds || 16);
        setBoundaries(saved.boundaries || { allowPhysical: true, allowAlcohol: true, allowExplicitTalk: true });
        setIsSetup(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save session sync
  useEffect(() => {
    if (session && !isSetup) {
      saveActiveSession(session);
    }
  }, [session, isSetup]);

  // Regular Timer Tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            sounds.playBuzzer();
            return 0;
          }
          if (prev <= 5) {
            sounds.playHeartbeat();
          } else {
            sounds.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  // SYNC 3-2-1 Countdown Effect
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    if (isSyncCountdown) {
      sounds.playHeartbeat();
      syncInterval = setInterval(() => {
        setSyncCount((prev) => {
          if (prev <= 1) {
            setIsSyncCountdown(false);
            sounds.playFanfare();
            return 0;
          }
          sounds.playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(syncInterval);
  }, [isSyncCountdown]);

  // Start Couple Game
  const handleStartGame = () => {
    sounds.playFanfare();

    const initialAllowed = calculateAllowedIntensity(1, totalRounds, maxIntensity);
    const initialPhase = calculateGamePhase(1, totalRounds);

    const firstSelection = selectNextUnifiedChallenge({
      pool: COUPLE_CHALLENGES,
      mode: 'COUPLE',
      currentPermittedIntensity: initialAllowed,
      maxAllowedIntensity: maxIntensity,
      currentPhase: initialPhase,
      boundaries,
      completedIds: [],
      playerCount: 2,
      relationshipStage,
      partnerAName: partnerA,
      partnerBName: partnerB,
    });

    const newSession: CoupleSessionData = {
      mode: 'COUPLE',
      sessionId: `couple_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'PLAYING',
      currentRound: 1,
      totalRounds,
      currentPhase: initialPhase,
      currentAllowedIntensity: initialAllowed,
      maxAllowedIntensity: maxIntensity,
      boundaries,
      partnerAName: partnerA,
      partnerBName: partnerB,
      relationshipStage,
      syncScore: { matches: 0, total: 0 },
      currentTurn: firstSelection?.challenge.type === 'SYNC' ? 'BOTH' : 'A',
      completedChallengeIds: firstSelection ? [firstSelection.challenge.id] : [],
      currentChallenge: firstSelection?.challenge,
      history: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: Date.now(),
          type: 'START',
          summary: `เริ่มเกม Couple Mode (${totalRounds} รอบ) ขั้นความสัมพันธ์: ${relationshipStage}`,
        },
      ],
    };

    setSession(newSession);
    setCurrentChallenge(firstSelection?.challenge || null);
    setIsSetup(false);
    setIsGameOver(false);

    if (firstSelection?.challenge.requiresConsent) {
      setPendingConsentChallenge(firstSelection.challenge);
      setIsConsentModalOpen(true);
    }
  };

  // Next round logic
  const handleNextTurn = (syncMatched?: boolean) => {
    if (!session) return;

    if (session.currentRound >= session.totalRounds) {
      sounds.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setSession({ ...session, status: 'FINISHED' });
      setIsGameOver(true);
      clearActiveSession();
      return;
    }

    const nextRound = session.currentRound + 1;
    const nextPhase = calculateGamePhase(nextRound, session.totalRounds);
    const nextAllowed = calculateAllowedIntensity(nextRound, session.totalRounds, session.maxAllowedIntensity);

    // Update sync score if applicable
    const updatedSync = { ...session.syncScore };
    if (currentChallenge?.type === 'SYNC') {
      updatedSync.total += 1;
      if (syncMatched) updatedSync.matches += 1;
    }

    // Alternate turns A -> B -> BOTH (if SYNC)
    const nextTurn = nextRound % 2 === 1 ? 'A' : 'B';

    const nextSelection = selectNextUnifiedChallenge({
      pool: COUPLE_CHALLENGES,
      mode: 'COUPLE',
      currentPermittedIntensity: nextAllowed,
      maxAllowedIntensity: session.maxAllowedIntensity,
      currentPhase: nextPhase,
      boundaries: session.boundaries,
      completedIds: session.completedChallengeIds,
      playerCount: 2,
      relationshipStage: session.relationshipStage,
      partnerAName: session.partnerAName,
      partnerBName: session.partnerBName,
      lastCategory: currentChallenge?.categories[0],
    });

    if (nextSelection) {
      sounds.playFlip();
      const updatedSession: CoupleSessionData = {
        ...session,
        currentRound: nextRound,
        currentPhase: nextPhase,
        currentAllowedIntensity: nextAllowed,
        syncScore: updatedSync,
        currentTurn: nextSelection.challenge.type === 'SYNC' ? 'BOTH' : nextTurn,
        completedChallengeIds: nextSelection.updatedCompletedIds,
        currentChallenge: nextSelection.challenge,
      };

      setSession(updatedSession);
      setCurrentChallenge(nextSelection.challenge);
      setIsTimerRunning(false);
      setCountdown(null);
      setIsSyncCountdown(false);

      if (nextSelection.challenge.requiresConsent) {
        setPendingConsentChallenge(nextSelection.challenge);
        setIsConsentModalOpen(true);
      }
    }
  };

  // Lower intensity on the fly
  const handleLowerIntensity = () => {
    if (!session || session.maxAllowedIntensity <= 1) return;
    const nextCeiling = (session.maxAllowedIntensity - 1) as IntensityLevel;
    sounds.playClick();
    const updatedSession: CoupleSessionData = {
      ...session,
      maxAllowedIntensity: nextCeiling,
      currentAllowedIntensity: Math.min(session.currentAllowedIntensity, nextCeiling) as IntensityLevel,
    };
    setSession(updatedSession);
    setMaxIntensity(nextCeiling);
  };

  const currentPhaseInfo = session ? GAME_PHASES[session.currentPhase] : GAME_PHASES.WARM_UP;
  const currentActivePartner = session
    ? session.currentTurn === 'BOTH'
      ? 'ทั้งสองคน'
      : session.currentTurn === 'A'
      ? session.partnerAName
      : session.partnerBName
    : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
              <span>COUPLE MODE</span>
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium">2 คน • สกินชิพ & ความไว้ใจ</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
              if (!muted) sounds.playClick();
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>
          {!isSetup && (
            <button
              type="button"
              onClick={() => {
                if (confirm('ต้องการเริ่มเกมใหม่ใช่หรือไม่?')) {
                  clearActiveSession();
                  setIsSetup(true);
                }
              }}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400"
              title="เริ่มใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-4">
        {/* ===================== SETUP VIEW ===================== */}
        {isSetup ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Hero */}
            <div className="text-center space-y-1.5 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>COUPLE MODE SETUP</span>
              </div>
              <h2 className="text-2xl font-black text-white">ตั้งค่าทายใจคู่รัก</h2>
              <p className="text-xs text-zinc-400">ประสบการณ์เฉพาะสำหรับ 2 คน ตามระยะความสัมพันธ์</p>
            </div>

            {/* Partners Input */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-3">
              <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>ชื่อของทั้งสองคน</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold">คนที่ 1 (Partner A)</span>
                  <input
                    type="text"
                    value={partnerA}
                    onChange={(e) => setPartnerA(e.target.value)}
                    placeholder="ที่รัก"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold">คนที่ 2 (Partner B)</span>
                  <input
                    type="text"
                    value={partnerB}
                    onChange={(e) => setPartnerB(e.target.value)}
                    placeholder="ตัวเอง"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            </div>

            {/* Relationship Stage (CRITICAL) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ระยะความสัมพันธ์ (RELATIONSHIP STAGE)</span>
                </label>
              </div>

              <div className="space-y-2">
                {[
                  {
                    stage: 'BEFORE_DATING' as RelationshipStage,
                    badge: 'STAGE A: คนคุย / กำลังจีบ',
                    desc: 'ยังไม่ได้คบเป็นแฟน เน้นหยอดเสน่ห์ ค้นหาความชอบ ความประทับใจแรก สบตา และสร้างเคมีโรแมนติก',
                    color: 'border-sky-500/50 bg-sky-500/10 text-sky-300',
                  },
                  {
                    stage: 'BEFORE_INTIMACY' as RelationshipStage,
                    badge: 'STAGE B: แฟน / เพิ่งเริ่มคบ',
                    desc: 'คบกันแล้วแต่กำลังสร้างความไว้ใจ เน้นการเปิดใจ ความมั่นคงทางอารมณ์ และสำรวจความใกล้ชิดตามจังหวะ',
                    color: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
                  },
                  {
                    stage: 'ESTABLISHED_INTIMACY' as RelationshipStage,
                    badge: 'STAGE C: คู่รักรู้ใจ / คบมานาน',
                    desc: 'สนิทสนมกันดี ไม่ต้องเริ่มจากคำถามคนคุย เน้นความแปลกใหม่ ทายใจเรื่องบนเตียง แฟนตาซี และปลุกไฟรัก',
                    color: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
                  },
                ].map((item) => (
                  <button
                    key={item.stage}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setRelationshipStage(item.stage);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      relationshipStage === item.stage
                        ? `${item.color} ring-1 ring-white/20 shadow-lg`
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-black text-white">{item.badge}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Intensity Selector */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>เพดานความเดือด (MAX INTENSITY)</span>
                </label>
                <span className="text-[10px] text-rose-400 font-bold">Level {maxIntensity}</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { level: 1, label: 'SWEET' },
                  { level: 2, label: 'FLIRTY' },
                  { level: 3, label: 'SPICY' },
                  { level: 4, label: 'WILD' },
                  { level: 5, label: 'EROTIC' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setMaxIntensity(item.level as IntensityLevel);
                    }}
                    className={`py-2 px-1 rounded-2xl border text-center transition-all ${
                      maxIntensity === item.level
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black ring-1 ring-rose-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 font-bold'
                    }`}
                  >
                    <div className="text-xs">{item.level}</div>
                    <div className="text-[9px] truncate">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-2">
              <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>จำนวนรอบภารกิจ</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { rounds: 10, label: '10 รอบ', sub: 'ด่วน ~15 นาที' },
                  { rounds: 16, label: '16 รอบ', sub: 'มาตรฐาน ~25 นาที' },
                  { rounds: 24, label: '24 รอบ', sub: 'จัดเต็ม ~40 นาที' },
                ].map((item) => (
                  <button
                    key={item.rounds}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setTotalRounds(item.rounds);
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      totalRounds === item.rounds
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black ring-1 ring-rose-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 font-bold'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-black text-base shadow-xl hover:opacity-95 active:scale-98 flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5 fill-current" />
              <span>เริ่มเกมทายใจคู่รัก ({totalRounds} รอบ)</span>
            </button>
          </div>
        ) : (
          /* ===================== GAMEPLAY VIEW ===================== */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Progression & Pacing Indicator */}
            <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-black"
                  style={{
                    backgroundColor: `${currentPhaseInfo.accentColor}25`,
                    color: currentPhaseInfo.accentColor,
                    border: `1px solid ${currentPhaseInfo.accentColor}50`,
                  }}
                >
                  {currentPhaseInfo.badge}
                </span>

                <div className="flex items-center gap-2">
                  {Boolean(session && session.syncScore.total > 0) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Sync: {session?.syncScore.matches}/{session?.syncScore.total}
                    </span>
                  )}
                  <span className="text-zinc-400 font-mono text-xs">
                    รอบ {session?.currentRound}/{session?.totalRounds}
                  </span>
                </div>
              </div>

              <div className="relative w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((session?.currentRound || 1) / (session?.totalRounds || 16)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Turn Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-xs font-black text-white">ถึงตาของ: {currentActivePartner}</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {currentChallenge?.type === 'SYNC' ? 'ทายใจ 3-2-1 พร้อมกัน' : 'สลับกันเล่นอย่างใกล้ชิด'}
              </span>
            </div>

            {/* Challenge Card */}
            {currentChallenge && (
              <div className="rounded-3xl p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl space-y-5 min-h-[300px] flex flex-col justify-between">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${
                    currentChallenge.type === 'SYNC'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : currentChallenge.type === 'TRUTH'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {currentChallenge.type === 'SYNC' ? '🎯 SYNC 3-2-1' : currentChallenge.type === 'TRUTH' ? '💬 TRUTH' : '🔥 DARE'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {currentChallenge.isPhysical && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        สกินชิพ
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                      Level {currentChallenge.intensity}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 text-center py-2">
                  {currentChallenge.title && (
                    <div className="text-xs font-black text-rose-400 uppercase tracking-wider">
                      {currentChallenge.title}
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                    {currentChallenge.content}
                  </h3>

                  {/* SYNC 3-2-1 Options Presentation */}
                  {currentChallenge.type === 'SYNC' && currentChallenge.options && (
                    <div className="space-y-3 pt-2">
                      {isSyncCountdown ? (
                        <div className="py-4 text-center">
                          <span className="text-5xl font-black text-rose-400 animate-ping">
                            {syncCount}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSyncCount(3);
                            setIsSyncCountdown(true);
                          }}
                          className="px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black hover:bg-rose-500/30 active:scale-95"
                        >
                          ▶ กดนับถอยหลัง 3-2-1 แล้วพูดพร้อมกัน!
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200">
                          {currentChallenge.options[0]}
                        </div>
                        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200">
                          {currentChallenge.options[1]}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChallenge.alternativeAction && (
                    <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 text-left">
                      <span className="text-amber-400 font-bold">ถ้าตอบไม่ตรงกัน / ไม่สะดวกใจ: </span>
                      <span>{currentChallenge.alternativeAction}</span>
                    </div>
                  )}
                </div>

                {/* Duration timer */}
                {currentChallenge.estimatedDuration && currentChallenge.type !== 'SYNC' && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {countdown === null ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCountdown(currentChallenge.estimatedDuration || 20);
                          setIsTimerRunning(true);
                          sounds.playClick();
                        }}
                        className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5"
                      >
                        <TimerIcon className="w-3.5 h-3.5 text-rose-400" />
                        <span>เริ่มจับเวลา ({currentChallenge.estimatedDuration} วิ)</span>
                      </button>
                    ) : (
                      <div className="px-4 py-1.5 rounded-full font-mono font-black text-sm flex items-center gap-2 border bg-zinc-800 border-zinc-700 text-rose-400">
                        <TimerIcon className="w-4 h-4" />
                        <span>{countdown} วินาที</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SYNC vs Regular Action Buttons */}
            {currentChallenge?.type === 'SYNC' ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleNextTurn(false)}
                  className="py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                  <span>ตอบไม่ตรงกัน</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playFanfare();
                    handleNextTurn(true);
                  }}
                  className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs shadow-lg hover:opacity-95 flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>ใจตรงกันเป๊ะ! (+1 Sync)</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleNextTurn(false)}
                  className="py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                  <span>ขอ Pass / เปลี่ยนข้อ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    handleNextTurn(false);
                  }}
                  className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black text-xs shadow-lg hover:opacity-95 flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ทำสำเร็จ / ตอบแล้ว</span>
                </button>
              </div>
            )}

            {/* Lower Intensity Pill */}
            {session && session.maxAllowedIntensity > 1 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleLowerIntensity}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 underline underline-offset-4 inline-flex items-center gap-1"
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>ลดความเดือดลง 1 ขั้น (ปัจจุบัน Level {session.maxAllowedIntensity})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== CONSENT MODAL ===================== */}
        {isConsentModalOpen && pendingConsentChallenge && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5 text-rose-400">
                <HeartHandshake className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-black text-white">ต้องการความยินยอมของทั้งสองฝ่าย</h3>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 space-y-1.5">
                <p className="font-bold text-white">ภารกิจนี้เกี่ยวข้องกับความใกล้ชิดหรือสกินชิพ:</p>
                <p className="text-zinc-400">{pendingConsentChallenge.content}</p>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                ทั้งสองคนต้องยินยอมด้วยความเต็มใจ หากฝ่ายใดฝ่ายหนึ่งรู้สึกเขินหรือยังไม่พร้อม สามารถขอเปลี่ยนข้อได้ทันทีโดยไม่มีบทลงโทษ
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsConsentModalOpen(false);
                    handleNextTurn(false);
                  }}
                  className="py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                >
                  ไม่สะดวกใจ / เปลี่ยนข้อ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playFanfare();
                    setIsConsentModalOpen(false);
                  }}
                  className="py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs"
                >
                  ยินยอมทั้งคู่ 💕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== GAME OVER MODAL ===================== */}
        {isGameOver && session && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="inline-flex p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Heart className="w-8 h-8 fill-rose-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">ความทรงจำสุดโรแมนติก!</h3>
                <p className="text-xs text-zinc-400">เล่นครบ {session.totalRounds} รอบเรียบร้อยแล้ว</p>
              </div>

              {session.syncScore.total > 0 && (
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-xs font-bold text-zinc-400">คะแนนความรู้ใจ (Sync Rate)</div>
                  <div className="text-2xl font-black text-rose-400">
                    {Math.round((session.syncScore.matches / session.syncScore.total) * 100)}%
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    ทายใจตรงกัน {session.syncScore.matches} จาก {session.syncScore.total} ข้อ
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsGameOver(false);
                    setIsSetup(true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                >
                  ตั้งค่าใหม่
                </button>
                <Link
                  href="/"
                  className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center justify-center"
                >
                  กลับหน้าหลัก
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
