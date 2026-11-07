'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Flame,
  Smile,
  Lock,
  Globe,
  Trophy,
} from 'lucide-react';
import {
  CoupleSessionData,
  RelationshipStage,
  IntensityLevel,
  IntimacyLevel,
  UnifiedChallenge,
  SessionBoundaries,
  ContentRating,
  NormalPack,
  AreaType,
  FullRoundsChoice,
  INTENSITY_TO_VIBE,
} from '@/lib/types/redesign';
import { COUPLE_CHALLENGES } from '@/lib/data/coupleChallenges';
import {
  calculateGamePhase,
  calculateAllowedIntensity,
} from '@/lib/engine/pacingEngine';
import { selectNextUnifiedChallenge } from '@/lib/engine/coreSelectionEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
} from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';
import { GameHeader } from '@/components/design-system/GameHeader';
import { PhysicalGameCard } from '@/components/design-system/PhysicalGameCard';
import { PrimaryActionButton } from '@/components/design-system/PrimaryActionButton';
import { SecondaryActionButton } from '@/components/design-system/SecondaryActionButton';
import { SyncCountdown } from '@/components/design-system/SyncCountdown';
import { SafetyHUD } from '@/components/design-system/SafetyHUD';

const INTIMACY_LABELS: Record<IntimacyLevel, { title: string; desc: string }> = {
  1: { title: 'เริ่มคุย / เดทแรก', desc: 'เพิ่งรู้จัก สร้างรอยยิ้ม ความเข้ากันได้' },
  2: { title: 'คุยกันสักพัก / เริ่มมีใจ', desc: 'เริ่มเผยนิสัย และความรู้สึกดี ๆ' },
  3: { title: 'แฟนป้ายแดง', desc: 'สร้างความไว้ใจ และเปิดใจคุยเรื่องลึกซึ้ง' },
  4: { title: 'แฟนตัวจริงรู้ใจ', desc: 'สนิทสนม สกินชิพ และความใกล้ชิด' },
  5: { title: 'คู่แท้ / กล้าลองสิ่งใหม่', desc: 'เปิดใจแฟนตาซีลึกซึ้ง ไร้กำแพงต่อกัน' },
};

function CoupleGameInner() {
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get('mode');

  // Setup Wizard State
  const [isSetup, setIsSetup] = useState(true);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);

  // Partner names
  const [partnerA, setPartnerA] = useState('ที่รัก');
  const [partnerB, setPartnerB] = useState('ตัวเอง');

  // Mode Configuration
  const [rating, setRating] = useState<ContentRating>(initialModeParam === 'nsfw' ? 'NSFW' : 'NORMAL');
  const [normalPack, setNormalPack] = useState<NormalPack>('FUN');
  const [fullRounds, setFullRounds] = useState<FullRoundsChoice>(3);
  const [intimacyLevel, setIntimacyLevel] = useState<IntimacyLevel>(3);
  const [maxIntensity, setMaxIntensity] = useState<IntensityLevel>(3);
  const [areaType, setAreaType] = useState<AreaType>('PUBLIC');

  // Consent
  const [consentDrinkingAge, setConsentDrinkingAge] = useState(false);
  const [consentAdult18, setConsentAdult18] = useState(false);

  // Boundaries
  const [boundaries] = useState<SessionBoundaries>({
    allowPhysical: true,
    allowAlcohol: true,
    allowExplicitTalk: true,
  });

  // Gameplay State
  const [session, setSession] = useState<CoupleSessionData | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<UnifiedChallenge | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [isSyncCountingDown, setIsSyncCountingDown] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({ A: 0, B: 0 });
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Mount logic: Load active session
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadActiveSession<CoupleSessionData>();
      if (saved && saved.mode === 'COUPLE' && saved.status !== 'FINISHED' && saved.rating) {
        setSession(saved);
        setRating(saved.rating);
        if (saved.normalPack) setNormalPack(saved.normalPack);
        if (saved.fullRounds) setFullRounds(saved.fullRounds);
        if (saved.intimacyLevel) setIntimacyLevel(saved.intimacyLevel);
        if (saved.areaType) setAreaType(saved.areaType);
        if (saved.scores) setScores(saved.scores);
        setPartnerA(saved.partnerAName || 'ที่รัก');
        setPartnerB(saved.partnerBName || 'ตัวเอง');
        setMaxIntensity(saved.maxAllowedIntensity || 3);
        setIsSetup(false);

        if (saved.requiresResumeConfirmation && saved.rating === 'NSFW') {
          setShowResumeModal(true);
        } else if (saved.currentChallenge) {
          setCurrentChallenge(saved.currentChallenge);
          setIsCardFlipped(true);
        }
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

  // Start Game
  const handleStartGame = () => {
    if (!consentDrinkingAge) {
      alert('โฮสต์ต้องยืนยันว่าทุกคนในวงอายุถึงเกณฑ์ดื่มและพร้อมเล่นครับ');
      return;
    }
    if (rating === 'NSFW' && !consentAdult18) {
      alert('NSFW ต้องยืนยันว่าทุกคนอายุ 18+ และพร้อมเห็นเนื้อหาผู้ใหญ่ครับ');
      return;
    }

    sounds.playFanfare();

    const totalTurns = 2 * fullRounds;
    const initialAllowed = rating === 'NSFW' ? calculateAllowedIntensity(1, fullRounds, maxIntensity) : 2;
    const initialPhase = calculateGamePhase(1, fullRounds);

    const relStage: RelationshipStage =
      intimacyLevel <= 2 ? 'BEFORE_DATING' : intimacyLevel <= 4 ? 'BEFORE_INTIMACY' : 'ESTABLISHED_INTIMACY';

    const initialSelection = selectNextUnifiedChallenge({
      pool: COUPLE_CHALLENGES,
      mode: 'COUPLE',
      rating,
      normalPack: rating === 'NORMAL' ? normalPack : undefined,
      areaType: rating === 'NSFW' ? areaType : undefined,
      intimacyLevel,
      currentPermittedIntensity: initialAllowed,
      maxAllowedIntensity: rating === 'NSFW' ? maxIntensity : 2,
      currentPhase: initialPhase,
      boundaries,
      completedIds: [],
      playerCount: 2,
      relationshipStage: relStage,
      partnerAName: partnerA,
      partnerBName: partnerB,
    });

    const newSession: CoupleSessionData = {
      mode: 'COUPLE',
      sessionId: `couple_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'PLAYING',
      rating,
      normalPack: rating === 'NORMAL' ? normalPack : undefined,
      areaType: rating === 'NSFW' ? areaType : undefined,
      fullRounds,
      currentRound: 1,
      totalRounds: fullRounds,
      currentTurnIndex: 1,
      totalTurns,
      currentPhase: initialPhase,
      currentAllowedIntensity: initialAllowed,
      maxAllowedIntensity: rating === 'NSFW' ? maxIntensity : 2,
      boundaries,
      partnerAName: partnerA,
      partnerBName: partnerB,
      relationshipStage: relStage,
      intimacyLevel,
      syncScore: { matches: 0, total: 0 },
      scores: { A: 0, B: 0 },
      currentTurn: initialSelection?.challenge.type === 'SYNC' ? 'BOTH' : 'A',
      completedChallengeIds: initialSelection ? [initialSelection.challenge.id] : [],
      currentChallenge: initialSelection?.challenge,
      history: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: Date.now(),
          type: 'START',
          summary: `เริ่ม PARTYVERSE: Couple [${rating}] (${fullRounds} รอบเต็ม = ${totalTurns} ตา)`,
        },
      ],
    };

    setSession(newSession);
    setCurrentChallenge(initialSelection?.challenge || null);
    setIsSetup(false);
    setIsCardFlipped(true);
    setIsGameOver(false);
  };

  // Redraw card in same turn
  const handleChangeCard = () => {
    if (!session) return;
    sounds.playCardFlip();
    setIsCardFlipped(false);

    setTimeout(() => {
      const redraw = selectNextUnifiedChallenge({
        pool: COUPLE_CHALLENGES,
        mode: 'COUPLE',
        rating: session.rating,
        normalPack: session.normalPack,
        areaType: session.areaType,
        intimacyLevel: session.intimacyLevel,
        currentPermittedIntensity: session.currentAllowedIntensity,
        maxAllowedIntensity: session.maxAllowedIntensity,
        currentPhase: session.currentPhase,
        boundaries: session.boundaries,
        completedIds: session.completedChallengeIds,
        playerCount: 2,
        relationshipStage: session.relationshipStage,
        partnerAName: session.partnerAName,
        partnerBName: session.partnerBName,
        lastCategory: currentChallenge?.categories[0],
      });

      if (redraw) {
        setCurrentChallenge(redraw.challenge);
        setSession({
          ...session,
          completedChallengeIds: redraw.updatedCompletedIds,
          currentChallenge: redraw.challenge,
        });
        sounds.playCardFlip();
        setIsCardFlipped(true);
      }
    }, 300);
  };

  // Next Turn
  const handleNextTurn = (syncMatched?: boolean, isPass: boolean = false) => {
    if (!session) return;

    const currentTurnNum = session.currentTurnIndex || 1;
    const totalTurnsNum = session.totalTurns || 2 * (session.fullRounds || 3);

    // Sync score tracking
    const updatedSync = { ...session.syncScore };
    const updatedScores = { ...(session.scores || scores) };

    if (currentChallenge?.type === 'SYNC') {
      updatedSync.total += 1;
      if (syncMatched) {
        updatedSync.matches += 1;
        // In competition pack, matching gives +1 point to both
        if (session.rating === 'NORMAL' && session.normalPack === 'COMPETITION') {
          updatedScores.A = (updatedScores.A || 0) + 1;
          updatedScores.B = (updatedScores.B || 0) + 1;
          setScores(updatedScores);
        }
      }
    } else if (session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && !isPass) {
      // Award point to the current turn player
      const turnKey = currentTurnNum % 2 === 1 ? 'A' : 'B';
      updatedScores[turnKey] = (updatedScores[turnKey] || 0) + 1;
      setScores(updatedScores);
    }

    if (currentTurnNum >= totalTurnsNum) {
      sounds.playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setSession({ ...session, status: 'FINISHED', syncScore: updatedSync, scores: updatedScores });
      setIsGameOver(true);
      clearActiveSession();
      return;
    }

    const nextTurn = currentTurnNum + 1;
    const nextRound = Math.floor((nextTurn - 1) / 2) + 1;
    const nextPhase = calculateGamePhase(nextRound, session.fullRounds || 3);
    const nextAllowed = session.rating === 'NSFW'
      ? calculateAllowedIntensity(nextRound, session.fullRounds || 3, session.maxAllowedIntensity)
      : 2;

    const nextSelection = selectNextUnifiedChallenge({
      pool: COUPLE_CHALLENGES,
      mode: 'COUPLE',
      rating: session.rating,
      normalPack: session.normalPack,
      areaType: session.areaType,
      intimacyLevel: session.intimacyLevel,
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
      sounds.playCardFlip();
      setIsCardFlipped(false);

      setTimeout(() => {
        const nextTurnOwner = nextSelection.challenge.type === 'SYNC' ? 'BOTH' : (nextTurn % 2 === 1 ? 'A' : 'B');
        const updatedSession: CoupleSessionData = {
          ...session,
          currentTurn: nextTurnOwner,
          currentTurnIndex: nextTurn,
          currentRound: nextRound,
          currentPhase: nextPhase,
          currentAllowedIntensity: nextAllowed,
          syncScore: updatedSync,
          scores: updatedScores,
          completedChallengeIds: nextSelection.updatedCompletedIds,
          currentChallenge: nextSelection.challenge,
        };

        setSession(updatedSession);
        setCurrentChallenge(nextSelection.challenge);
        setIsSyncCountingDown(false);
        setIsCardFlipped(true);
      }, 300);
    }
  };

  // Lower Ceiling mid-game
  const handleLowerCeiling = (newCeiling: IntensityLevel) => {
    if (!session) return;
    sounds.playFanfare();

    const updated: CoupleSessionData = {
      ...session,
      maxAllowedIntensity: newCeiling,
      currentAllowedIntensity: Math.min(session.currentAllowedIntensity, newCeiling) as IntensityLevel,
    };
    setMaxIntensity(newCeiling);
    setSession(updated);
    saveActiveSession(updated);

    if (currentChallenge && currentChallenge.intensity > newCeiling) {
      alert(`ลดเพดานเป็น Level ${newCeiling}: การ์ดปัจจุบันแรงเกินเพดานใหม่ ระบบทำการปิดและจั่วการ์ดใหม่ในตานี้`);
      handleChangeCard();
    }
  };

  const handleConfirmResume = () => {
    sounds.playClick();
    setShowResumeModal(false);
    if (session) {
      setSession({ ...session, requiresResumeConfirmation: false });
      if (session.currentChallenge) {
        setCurrentChallenge(session.currentChallenge);
        setIsCardFlipped(true);
      }
    }
  };

  const activeTurnName =
    currentChallenge?.type === 'SYNC'
      ? 'ทั้งสองคน (SYNC 3-2-1)'
      : (session?.currentTurnIndex || 1) % 2 === 1
      ? partnerA
      : partnerB;

  const headerSubtitle = session
    ? `${session.rating} ${session.rating === 'NORMAL' ? `[${session.normalPack === 'FUN' ? 'ขำ ๆ' : session.normalPack === 'DEEP_TALK' ? 'คุยเปิดใจ' : 'แข่งขันเบา ๆ'}]` : `[ความสนิท ${session.intimacyLevel} • L${session.maxAllowedIntensity}]`}`
    : undefined;

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="PARTYVERSE" subtitle={headerSubtitle} showBack backHref="/" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ===================== RESUME NSFW CONFIRMATION MODAL ===================== */}
        {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-zinc-900 border-2 border-rose-500/50 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-400 font-black text-lg">
                <ShieldCheck className="w-6 h-6" />
                <span>ยืนยันก่อนเล่นต่อ (COUPLE NSFW)</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                เนื่องจากเป็นการเล่นต่อในโหมดคู่รัก NSFW กรุณายืนยันความพร้อมของทั้งสองคนก่อนเปิดการ์ด:
              </p>

              <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose-500" />
                  <span className="text-zinc-200">ทั้งสองคนอายุ 18+ และพร้อมเล่นต่อ</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose-500" />
                  <span className="text-zinc-200">ยินยอมพร้อมใจและสามารถขอ Pass ได้เสมอ</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleConfirmResume}
                className="w-full min-h-[48px] rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-base shadow-md transition-all"
              >
                ยืนยันและเปิดการ์ดเล่นต่อ
              </button>
            </div>
          </div>
        )}

        {/* ===================== GAME OVER SUMMARY ===================== */}
        {isGameOver && session && (
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/95 border-2 border-rose-500/50 shadow-rose-glow text-center space-y-6 max-w-lg mx-auto animate-in zoom-in-95">
            <Heart className="w-12 h-12 text-rose-400 fill-current mx-auto animate-pulse" />
            <h2 className="text-3xl font-black text-white">❤️ จบช่วงเวลาของสองเรา!</h2>
            <p className="text-sm text-zinc-300">
              เล่นครบ {session.fullRounds || 3} รอบเต็ม ({session.totalTurns || 6} ตา)
            </p>

            {/* SYNC Result Summary */}
            <div className="space-y-3 bg-zinc-950 p-5 rounded-2xl border border-zinc-800 text-left">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-rose-300">⚡ สรุปผล SYNC 3-2-1 ใจตรงกัน:</span>
                <span className="font-mono text-amber-400 text-base">
                  {session.syncScore.matches} / {session.syncScore.total} ข้อ
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{
                    width: `${session.syncScore.total > 0 ? (session.syncScore.matches / session.syncScore.total) * 100 : 100}%`,
                  }}
                />
              </div>

              {/* Competition Scores */}
              {session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && (
                <div className="pt-2 border-t border-zinc-800 flex justify-around text-xs font-bold">
                  <span className="text-zinc-300">{partnerA}: {scores.A || 0} แต้ม</span>
                  <span className="text-zinc-300">{partnerB}: {scores.B || 0} แต้ม</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsSetup(true);
                setIsGameOver(false);
                setSession(null);
              }}
              className="w-full min-h-[48px] rounded-2xl bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เริ่มเล่นรอบใหม่</span>
            </button>
          </div>
        )}

        {/* ===================== SETUP WIZARD ===================== */}
        {isSetup && !isGameOver && (
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border-2 border-zinc-800 space-y-6 max-w-xl mx-auto shadow-tactile-rest">
            <div className="text-center space-y-1">
              <span className="text-xs font-black text-rose-400 tracking-wider uppercase">
                ตั้งค่าคู่รัก (ขั้นตอนที่ {setupStep} / 3)
              </span>
              <h2 className="text-2xl font-black text-white">COUPLE MODE SETUP</h2>
            </div>

            {/* STEP 1: NAMES */}
            {setupStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">ชื่อคนที่ 1:</label>
                    <input
                      type="text"
                      value={partnerA}
                      onChange={(e) => setPartnerA(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-rose-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">ชื่อคนที่ 2:</label>
                    <input
                      type="text"
                      value={partnerB}
                      onChange={(e) => setPartnerB(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-rose-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSetupStep(2);
                  }}
                  className="w-full min-h-[50px] rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-base shadow-md transition-all mt-2"
                >
                  ถัดไป: เลือกแบบเกมและรอบ
                </button>
              </div>
            )}

            {/* STEP 2: MODE & INTIMACY */}
            {setupStep === 2 && (
              <div className="space-y-5">
                {/* Rating Switcher */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setRating('NORMAL');
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${rating === 'NORMAL' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                  >
                    <Smile className="w-5 h-5" />
                    <span className="font-black text-sm">NORMAL</span>
                    <span className="text-[11px] text-zinc-400">น่ารัก อบอุ่น ไม่มีเรื่อง 18+</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setRating('NSFW');
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${rating === 'NSFW' ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                  >
                    <Flame className="w-5 h-5" />
                    <span className="font-black text-sm">NSFW (18+)</span>
                    <span className="text-[11px] text-zinc-400">บทสนทนาผู้ใหญ่ & แฟนตาซี</span>
                  </button>
                </div>

                {/* Full Rounds Choice: 2, 3, 5 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-zinc-300">
                    <span>จำนวนรอบเต็ม:</span>
                    <span className="text-xs text-rose-400">{2 * fullRounds} ตาเล่น</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 3, 5] as FullRoundsChoice[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setFullRounds(r);
                        }}
                        className={`py-2.5 rounded-xl font-black text-sm border transition-all ${fullRounds === r ? 'bg-rose-500 text-white border-rose-400' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                      >
                        {r} รอบ {r === 3 ? '(แนะนำ)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Normal: 3 Packs */}
                {rating === 'NORMAL' && (
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-zinc-300">เลือกชุดโจทย์ Normal:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'FUN', label: 'ขำ ๆ', desc: 'หวานปนฮา' },
                        { id: 'DEEP_TALK', label: 'คุยเปิดใจ', desc: 'เข้าใจกันลึกซึ้ง' },
                        { id: 'COMPETITION', label: 'แข่งขันเบา ๆ', desc: 'ทายใจสะสมแต้ม' },
                      ].map((pk) => (
                        <button
                          key={pk.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setNormalPack(pk.id as NormalPack);
                          }}
                          className={`p-2 rounded-xl text-center border transition-all ${normalPack === pk.id ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                        >
                          <div className="font-bold text-xs">{pk.label}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{pk.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* NSFW: Intimacy Level 1-5 + Ceiling 1-5 + Area */}
                {rating === 'NSFW' && (
                  <div className="space-y-4 pt-1">
                    {/* Intimacy 1-5 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span>ระดับความสนิท (คัดโจทย์ให้เหมาะกับคู่):</span>
                        <span className="text-rose-400 font-bold">ระดับ {intimacyLevel}: {INTIMACY_LABELS[intimacyLevel].title}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {([1, 2, 3, 4, 5] as IntimacyLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setIntimacyLevel(lvl);
                            }}
                            className={`py-2 rounded-xl font-black text-xs border transition-all ${intimacyLevel === lvl ? 'bg-rose-500 text-white border-rose-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                          >
                            ระดับ {lvl}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-400">{INTIMACY_LABELS[intimacyLevel].desc}</p>
                    </div>

                    {/* Ceiling 1-5 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span>เพดานความเดือดร่วม (Ceiling 1–5):</span>
                        <span className="text-amber-400 font-mono">Level {maxIntensity} ({INTENSITY_TO_VIBE[maxIntensity]})</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {([1, 2, 3, 4, 5] as IntensityLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setMaxIntensity(lvl);
                            }}
                            className={`py-2 rounded-xl font-black text-xs border transition-all ${maxIntensity === lvl ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                          >
                            L{lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Area: Public vs Private */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setAreaType('PUBLIC');
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${areaType === 'PUBLIC' ? 'bg-zinc-800 text-amber-300 border-amber-400' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                      >
                        <Globe className="w-4 h-4" />
                        <span>พื้นที่ทั่วไป</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setAreaType('PRIVATE');
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${areaType === 'PRIVATE' ? 'bg-zinc-800 text-rose-300 border-rose-400' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                      >
                        <Lock className="w-4 h-4" />
                        <span>พื้นที่ส่วนตัว</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSetupStep(1);
                    }}
                    className="px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold text-sm"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSetupStep(3);
                    }}
                    className="flex-1 min-h-[50px] rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-base shadow-md transition-all"
                  >
                    ถัดไป: ข้อตกลงความยินยอม
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONSENT & START */}
            {setupStep === 3 && (
              <div className="space-y-5">
                <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-sm">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentDrinkingAge}
                      onChange={(e) => setConsentDrinkingAge(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-rose-500"
                    />
                    <span className="text-zinc-200 text-xs sm:text-sm">
                      ทั้งคู่ยืนยันว่าอายุถึงเกณฑ์ดื่ม และพร้อมเปิดใจเล่นด้วยกัน
                    </span>
                  </label>

                  {rating === 'NSFW' && (
                    <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-zinc-800">
                      <input
                        type="checkbox"
                        checked={consentAdult18}
                        onChange={(e) => setConsentAdult18(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-rose-500"
                      />
                      <span className="text-rose-300 text-xs sm:text-sm">
                        ทั้งคู่ยืนยันว่าอายุ 18+ พร้อมสำหรับบทสนทนาและกิจกรรมผู้ใหญ่
                      </span>
                    </label>
                  )}
                </div>

                <div className="text-xs text-zinc-400 text-center">
                  * ทั้งคู่ตกลงกันนอกจอก่อนทำเสมอ และสามารถขอ <strong>Pass</strong> ได้โดยไม่มีใครบังคับ
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSetupStep(2);
                    }}
                    className="px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold text-sm"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={!consentDrinkingAge || (rating === 'NSFW' && !consentAdult18)}
                    onClick={handleStartGame}
                    className="flex-1 min-h-[50px] rounded-2xl bg-rose-500 hover:bg-rose-400 disabled:opacity-30 text-white font-black text-base shadow-md transition-all"
                  >
                    เริ่มช่วงเวลาของเรา!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ACTIVE GAMEPLAY ===================== */}
        {!isSetup && session && !isGameOver && (
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Turn Banner */}
            <div className="flex items-center justify-between p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  ตาเล่นที่ {session.currentTurn || 1} / {session.totalTurns || 6} (รอบที่ {session.currentRound} / {session.fullRounds || 3})
                </span>
                <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400 fill-current" />
                  <span>{activeTurnName}</span>
                </div>
              </div>

              {/* Light Competition Points */}
              {session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{partnerA}: {scores.A || 0} | {partnerB}: {scores.B || 0}</span>
                </div>
              )}
            </div>

            {/* SYNC 3-2-1 Challenge Countdown UI */}
            {currentChallenge?.type === 'SYNC' && !isSyncCountingDown && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                <div className="text-xs font-bold text-amber-300">⚡ กติกา SYNC 3-2-1: ตอบพร้อมกัน!</div>
                <button
                  type="button"
                  onClick={() => setIsSyncCountingDown(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-md transition-all"
                >
                  เริ่มนับ 3-2-1 ตอบพร้อมกัน
                </button>
              </div>
            )}

            {isSyncCountingDown && (
              <SyncCountdown
                options={currentChallenge?.options}
                onComplete={() => {
                  sounds.playFanfare();
                  setIsSyncCountingDown(false);
                }}
              />
            )}

            {/* Revealed Card */}
            {currentChallenge && (
              <div className="space-y-4">
                <PhysicalGameCard
                  isFlipped={isCardFlipped}
                  onFlip={() => setIsCardFlipped(!isCardFlipped)}
                  variant="couple"
                  backContent={
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                      <div className="text-xs font-black tracking-widest text-rose-400 uppercase">
                        {currentChallenge.type}
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-white">
                        COUPLE CARD
                      </div>
                      <div className="text-xs text-zinc-400">
                        แตะเพื่อเปิดการ์ด
                      </div>
                    </div>
                  }
                  frontContent={
                    <div className="flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                          {currentChallenge.type}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          Level {currentChallenge.intensity}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                        <p className="text-lg sm:text-xl font-black text-white leading-relaxed">
                          {currentChallenge.content}
                        </p>
                      </div>

                      <div className="text-[11px] text-zinc-500 text-center">
                        แตะการ์ดเพื่อพลิกกลับ
                      </div>
                    </div>
                  }
                />

                {/* Alternative Sober Action */}
                {currentChallenge.alternativeAction && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 text-center space-y-0.5">
                    <span className="text-rose-400 font-bold">ตัวเลือกแทนดื่ม / ทางเลือกเสริม: </span>
                    <span>{currentChallenge.alternativeAction}</span>
                  </div>
                )}

                {/* Actions */}
                {currentChallenge.type === 'SYNC' ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <SecondaryActionButton
                      destructive
                      onClick={() => handleNextTurn(false)}
                    >
                      <span>ตอบไม่ตรงกัน</span>
                    </SecondaryActionButton>

                    <PrimaryActionButton
                      onClick={() => {
                        sounds.playFanfare();
                        handleNextTurn(true);
                      }}
                    >
                      <span>ใจตรงกัน! (+1 แต้ม)</span>
                    </PrimaryActionButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <SecondaryActionButton
                      destructive
                      onClick={() => handleNextTurn(false, true)}
                    >
                      <span>ขอ Pass (ข้ามฟรี)</span>
                    </SecondaryActionButton>

                    <PrimaryActionButton
                      onClick={() => handleNextTurn(false, false)}
                    >
                      <span>ทำสำเร็จแล้ว!</span>
                    </PrimaryActionButton>
                  </div>
                )}

                {/* Safety HUD */}
                <SafetyHUD
                  currentCeiling={session.maxAllowedIntensity}
                  onChangeCard={handleChangeCard}
                  onSafePass={() => handleNextTurn(false, true)}
                  onLowerCeiling={session.rating === 'NSFW' ? handleLowerCeiling : undefined}
                  isTouchChallenge={currentChallenge.isPhysical}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CoupleGamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tabletop text-rose-400 p-8 text-center font-bold">กำลังโหลด PARTYVERSE...</div>}>
      <CoupleGameInner />
    </Suspense>
  );
}