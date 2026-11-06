'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Check,
  X,
  Zap,
  Smartphone,
} from 'lucide-react';
import {
  CoupleSessionData,
  RelationshipStage,
  IntensityLevel,
  UnifiedChallenge,
  SessionBoundaries,
  INTENSITY_TO_VIBE,
} from '@/lib/types/redesign';
import { COUPLE_CHALLENGES } from '@/lib/data/coupleChallenges';
import {
  calculateGamePhase,
  calculateAllowedIntensity,
  GAME_PHASES,
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
import { BoundarySelector } from '@/components/design-system/BoundarySelector';
import { IntensityCeilingControl } from '@/components/design-system/IntensityCeilingControl';
import { SyncCountdown } from '@/components/design-system/SyncCountdown';
import { ConsentDialog } from '@/components/design-system/ConsentDialog';

export default function CoupleGamePage() {
  // Setup Wizard Step (1: Names & Stage, 2: Intensity, 3: Boundaries, 4: Start)
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSetup, setIsSetup] = useState(true);

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

  // Gameplay State
  const [session, setSession] = useState<CoupleSessionData | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<UnifiedChallenge | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSyncCountingDown, setIsSyncCountingDown] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Mount logic: Load active session
  useEffect(() => {
    const timer = setTimeout(() => {
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
        setIsCardFlipped(true);
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

  // Start Game
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
    setIsCardFlipped(true);

    if (firstSelection?.challenge.requiresConsent) {
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

    // Update sync score
    const updatedSync = { ...session.syncScore };
    if (currentChallenge?.type === 'SYNC') {
      updatedSync.total += 1;
      if (syncMatched) updatedSync.matches += 1;
    }

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
      sounds.playCardFlip();
      setIsCardFlipped(false);

      setTimeout(() => {
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
        setIsSyncCountingDown(false);
        setIsCardFlipped(true);

        if (nextSelection.challenge.requiresConsent) {
          setIsConsentModalOpen(true);
        }
      }, 350);
    }
  };

  const handleLowerIntensity = (newCeiling: IntensityLevel) => {
    if (!session) return;
    sounds.playFanfare();
    const updated: CoupleSessionData = {
      ...session,
      maxAllowedIntensity: newCeiling,
      currentAllowedIntensity: Math.min(session.currentAllowedIntensity, newCeiling) as IntensityLevel,
      history: [
        ...session.history,
        {
          id: `log_lower_${Date.now()}`,
          timestamp: Date.now(),
          type: 'INTENSITY_CHANGE',
          summary: `ลดเพดานความเดือดลงเหลือ Level ${newCeiling}`,
        },
      ],
    };
    setSession(updated);
    setMaxIntensity(newCeiling);
    saveActiveSession(updated);
  };

  const activeTurnName =
    session?.currentTurn === 'BOTH'
      ? 'ทั้งสองคน'
      : session?.currentTurn === 'A'
      ? session.partnerAName
      : session?.partnerBName || '';

  const currentPhaseInfo = session ? GAME_PHASES[session.currentPhase] : GAME_PHASES.WARM_UP;

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="COUPLE MODE" showBack={true} backHref="/" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* ===================== GAME OVER VIEW ===================== */}
        {isGameOver ? (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-zinc-900 border-2 border-rose-500/50 shadow-rose-glow text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-3xl">
              💞
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">กระชับรักสำเร็จ!</h2>
              <p className="text-sm text-zinc-300">
                {session?.partnerAName} & {session?.partnerBName} เล่นครบทั้ง {session?.totalRounds} รอบแล้ว
              </p>
            </div>
            {session && session.syncScore.total > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1 text-center">
                <div className="text-xs font-bold text-rose-400 uppercase">คะแนนใจตรงกัน (SYNC SCORE)</div>
                <div className="text-3xl font-black text-white">
                  {session.syncScore.matches} / {session.syncScore.total}
                </div>
                <div className="text-xs text-zinc-400">
                  {session.syncScore.matches === session.syncScore.total
                    ? 'สุดยอดคู่แท้! ใจตรงกัน 100%'
                    : 'รู้จักใจกันมากขึ้นอีกระดับ'}
                </div>
              </div>
            )}
            <PrimaryActionButton
              variant="rose"
              onClick={() => {
                sounds.playClick();
                setIsSetup(true);
                setIsGameOver(false);
                setSession(null);
              }}
            >
              เล่นอีกรอบ
            </PrimaryActionButton>
          </div>
        ) : isSetup ? (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between px-2">
              {[
                { step: 1, label: 'คู่รัก' },
                { step: 2, label: 'ความเดือด' },
                { step: 3, label: 'ขอบเขต' },
                { step: 4, label: 'เริ่มเล่น' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setSetupStep(s.step as 1 | 2 | 3 | 4)}
                  className={`flex items-center gap-1.5 text-xs font-black transition-all ${
                    setupStep === s.step ? 'text-rose-400' : 'text-zinc-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      setupStep === s.step ? 'bg-rose-500 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {s.step}
                  </span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* STEP 1: NAMES & RELATIONSHIP STAGE */}
            {setupStep === 1 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-rose-500/30 space-y-5 shadow-tactile-rest">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">ชื่อของคุณทั้งสองคน</h2>
                  <p className="text-sm text-zinc-400">สำหรับส่งโทรศัพท์และภารกิจทายใจ</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-rose-400 uppercase">คนแรก</label>
                    <input
                      type="text"
                      value={partnerA}
                      onChange={(e) => setPartnerA(e.target.value)}
                      className="w-full mt-1 min-h-[48px] bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-4 text-sm font-bold text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase">คนที่สอง</label>
                    <input
                      type="text"
                      value={partnerB}
                      onChange={(e) => setPartnerB(e.target.value)}
                      className="w-full mt-1 min-h-[48px] bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-4 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Relationship Stage Cards */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                    ระยะความสัมพันธ์
                  </label>
                  <div className="space-y-2.5">
                    {[
                      {
                        stage: 'BEFORE_DATING' as RelationshipStage,
                        title: 'คนคุย / เริ่มเดท (Talking Stage)',
                        desc: 'เน้นคุยสนุก หยอดมุกน่ารัก ละลายความเขิน ไม่ล้ำเส้นความเป็นส่วนตัว',
                      },
                      {
                        stage: 'BEFORE_INTIMACY' as RelationshipStage,
                        title: 'แฟนที่กำลังสร้างความไว้ใจ (Building Trust)',
                        desc: 'สกินชิพใกล้ชิด ถามใจลึกซึ้ง เพิ่มความผูกพันและเปิดอก',
                      },
                      {
                        stage: 'ESTABLISHED_INTIMACY' as RelationshipStage,
                        title: 'คู่รักรู้ใจ / สามีภรรยา (Established)',
                        desc: 'ทายใจเรื่องบนเตียง รสนิยมลับ และเติมไฟรักสุดเร่าร้อน',
                      },
                    ].map((item) => {
                      const isSelected = relationshipStage === item.stage;
                      return (
                        <button
                          key={item.stage}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setRelationshipStage(item.stage);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-rose-500/15 border-rose-400 shadow-rose-glow ring-1 ring-rose-400'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className={`text-base font-black ${isSelected ? 'text-rose-400' : 'text-white'}`}>
                              {item.title}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <PrimaryActionButton variant="rose" onClick={() => setSetupStep(2)}>
                  ถัดไป: เลือกระดับความเดือด
                </PrimaryActionButton>
              </div>
            )}

            {/* STEP 2: INTENSITY */}
            {setupStep === 2 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-rose-500/30 space-y-5 shadow-tactile-rest">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">เพดานความเดือดสูงสุด</h2>
                  <p className="text-sm text-zinc-400">เกมจะค่อยๆ ไต่ระดับจากความหวานสู่ความแซ่บ</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { level: 1, name: 'SWEET & CHILL (ระดับ 1)', desc: 'หวานละมุน น่ารัก อบอุ่นหัวใจ' },
                    { level: 2, name: 'FLIRTY & TENDER (ระดับ 2)', desc: 'หยอดเสน่ห์ สบตา สกินชิพชวนเขิน' },
                    { level: 3, name: 'SPICY & ROMANTIC (ระดับ 3)', desc: '18+ สัมผัสแนบชิด จุดประกายความวาบหวาม' },
                    { level: 4, name: 'PASSIONATE (ระดับ 4)', desc: '20+ เรื่องบนเตียง สัมผัสถึงอารมณ์รัก' },
                    { level: 5, name: 'WILD & UNLEASHED (ระดับ 5)', desc: '20+ แฟนตาซี บทบาทสมมติ ปลดปล่อยเต็มที่' },
                  ].map((item) => {
                    const isSelected = maxIntensity === item.level;
                    return (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setMaxIntensity(item.level as IntensityLevel);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-400 shadow-rose-glow ring-1 ring-rose-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className={`text-base font-black ${isSelected ? 'text-rose-400' : 'text-white'}`}>
                            {item.name}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <SecondaryActionButton fullWidth={false} onClick={() => setSetupStep(1)}>
                    ย้อนกลับ
                  </SecondaryActionButton>
                  <PrimaryActionButton variant="rose" onClick={() => setSetupStep(3)}>
                    ถัดไป: ตั้งค่าขอบเขต
                  </PrimaryActionButton>
                </div>
              </div>
            )}

            {/* STEP 3: BOUNDARIES */}
            {setupStep === 3 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-rose-500/30 space-y-5 shadow-tactile-rest">
                <BoundarySelector boundaries={boundaries} onChange={setBoundaries} />

                <div className="flex gap-3 pt-2">
                  <SecondaryActionButton fullWidth={false} onClick={() => setSetupStep(2)}>
                    ย้อนกลับ
                  </SecondaryActionButton>
                  <PrimaryActionButton variant="rose" onClick={() => setSetupStep(4)}>
                    ถัดไป: สรุปและเริ่มเกม
                  </PrimaryActionButton>
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & START */}
            {setupStep === 4 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-rose-500/30 space-y-6 shadow-tactile-rest">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">พร้อมกระชับรักแล้ว!</h2>
                  <p className="text-sm text-zinc-400">ตรวจสอบความพร้อมแล้วเริ่มเล่นกันเลย</p>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-bold">คู่รัก:</span>
                    <span className="text-white font-black">{partnerA} & {partnerB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-bold">ความสัมพันธ์:</span>
                    <span className="text-rose-400 font-black">{relationshipStage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-bold">เพดานความเดือด:</span>
                    <span className="text-amber-400 font-black">Level {maxIntensity} ({INTENSITY_TO_VIBE[maxIntensity]})</span>
                  </div>
                </div>

                {/* Rounds */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                    จำนวนรอบ (ROUNDS)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[12, 16, 24].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={`min-h-[48px] rounded-2xl font-black text-sm border-2 ${
                          totalRounds === r
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                            : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        {r} รอบ
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <SecondaryActionButton fullWidth={false} onClick={() => setSetupStep(3)}>
                    ย้อนกลับ
                  </SecondaryActionButton>
                  <PrimaryActionButton
                    variant="rose"
                    icon={<Heart className="w-5 h-5 fill-current" />}
                    onClick={handleStartGame}
                  >
                    เริ่มเล่นเกมคู่รัก!
                  </PrimaryActionButton>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===================== ACTIVE GAMEPLAY VIEW ===================== */
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Top Bar Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-rose-400">
                  {currentPhaseInfo.badge}
                </span>

                <div className="flex items-center gap-2 font-mono">
                  {session && session.syncScore.total > 0 && (
                    <span className="text-xs bg-rose-950/60 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full">
                      SYNC: {session.syncScore.matches}/{session.syncScore.total}
                    </span>
                  )}
                  <span className="text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    รอบ {session?.currentRound} / {session?.totalRounds}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 via-coral-400 to-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((session?.currentRound || 1) / (session?.totalRounds || 16)) * 100))}%`,
                  }}
                />
              </div>

              {/* Ceiling Lowering Control */}
              {session && (
                <IntensityCeilingControl
                  currentCeiling={session.maxAllowedIntensity}
                  onLowerCeiling={handleLowerIntensity}
                />
              )}
            </div>

            {/* Turn Banner */}
            <div
              role="region"
              aria-label="ตาของผู้เล่นปัจจุบัน"
              className="w-full p-4 rounded-3xl bg-zinc-900/90 border-2 border-rose-500/30 shadow-tactile-rest flex items-center justify-between gap-3 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black text-xl shadow-sm">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    ถึงตาของ
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {activeTurnName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-bold">
                <Smartphone className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>ส่งมือถือให้ {activeTurnName}</span>
              </div>
            </div>

            {/* Center: Tactile Card */}
            {currentChallenge && (
              <PhysicalGameCard
                isFlipped={isCardFlipped}
                variant="couple"
                frontContent={
                  <div className="flex flex-col justify-between h-full p-2 space-y-4">
                    {/* Header Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${
                          currentChallenge.type === 'SYNC'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : currentChallenge.type === 'TRUTH'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {currentChallenge.type === 'SYNC'
                          ? '💞 SYNC 3-2-1 ทายใจ'
                          : currentChallenge.type === 'TRUTH'
                          ? '💬 ถามใจ (TRUTH)'
                          : '⚡ ภารกิจคู่ (CHALLENGE)'}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Level {currentChallenge.intensity}
                      </span>
                    </div>

                    {/* Challenge Body */}
                    <div className="my-auto text-center py-4 space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-relaxed">
                        {currentChallenge.content}
                      </h3>

                      {/* Options for SYNC */}
                      {currentChallenge.options && !isSyncCountingDown && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm font-black text-rose-300">
                            A: {currentChallenge.options[0]}
                          </div>
                          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm font-black text-amber-300">
                            B: {currentChallenge.options[1]}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SYNC Countdown Trigger or Widget */}
                    {currentChallenge.type === 'SYNC' && (
                      <div className="pt-2">
                        {!isSyncCountingDown ? (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setIsSyncCountingDown(true);
                            }}
                            className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md"
                          >
                            <Zap className="w-4 h-4 fill-current" />
                            <span>เริ่มนับ SYNC 3-2-1</span>
                          </button>
                        ) : (
                          <SyncCountdown
                            options={currentChallenge.options}
                            onComplete={() => setIsSyncCountingDown(false)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                }
                backContent={
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-4">
                    <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-3xl shadow-lg">
                      ❤️
                    </div>
                    <div className="text-xl font-black text-white">COUPLE CARD</div>
                    <p className="text-xs text-zinc-400">แตะเพื่อเปิดภารกิจคู่รัก</p>
                  </div>
                }
              />
            )}

            {/* Bottom Actions */}
            {currentChallenge?.type === 'SYNC' ? (
              <div className="space-y-2 pt-2">
                <div className="text-center text-xs font-bold text-zinc-400">
                  ใจตรงกันไหม?
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SecondaryActionButton onClick={() => handleNextTurn(false)}>
                    ไม่ตรงกัน
                  </SecondaryActionButton>
                  <PrimaryActionButton
                    variant="rose"
                    icon={<Heart className="w-5 h-5 fill-current" />}
                    onClick={() => handleNextTurn(true)}
                  >
                    ใจตรงกัน! (+1)
                  </PrimaryActionButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <SecondaryActionButton
                  icon={<X className="w-5 h-5 text-zinc-400" />}
                  onClick={() => handleNextTurn()}
                >
                  ข้ามข้อนี้
                </SecondaryActionButton>

                <PrimaryActionButton
                  variant="rose"
                  icon={<Check className="w-5 h-5" />}
                  onClick={() => handleNextTurn()}
                >
                  เสร็จแล้ว
                </PrimaryActionButton>
              </div>
            )}
          </div>
        )}

        {/* Consent Modal */}
        <ConsentDialog
          isOpen={isConsentModalOpen}
          onAccept={() => {
            sounds.playClick();
            setIsConsentModalOpen(false);
          }}
          onDecline={() => {
            sounds.playClick();
            setIsConsentModalOpen(false);
            handleNextTurn();
          }}
        />
      </main>
    </div>
  );
}
