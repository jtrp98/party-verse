'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  X,
  Play,
  Timer as TimerIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  PartySession,
  Player,
  IntensityLevel,
  UnifiedChallenge,
  SessionBoundaries,
  INTENSITY_TO_VIBE,
} from '@/lib/types/redesign';
import { PARTY_CHALLENGES } from '@/lib/data/partyChallenges';
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
  loadSavedPlayerNames,
  savePlayerNames,
} from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';
import { GameHeader } from '@/components/design-system/GameHeader';
import { PhysicalGameCard } from '@/components/design-system/PhysicalGameCard';
import { PrimaryActionButton } from '@/components/design-system/PrimaryActionButton';
import { SecondaryActionButton } from '@/components/design-system/SecondaryActionButton';
import { PlayerAvatar } from '@/components/design-system/PlayerAvatar';
import { PlayerTurnBanner } from '@/components/design-system/PlayerTurnBanner';
import { BoundarySelector } from '@/components/design-system/BoundarySelector';
import { IntensityCeilingControl } from '@/components/design-system/IntensityCeilingControl';
import { ConsentDialog } from '@/components/design-system/ConsentDialog';

const DEFAULT_AVATARS = [
  'bg-amber-500 text-amber-950 border-amber-300',
  'bg-cyan-500 text-cyan-950 border-cyan-300',
  'bg-rose-500 text-rose-950 border-rose-300',
  'bg-emerald-500 text-emerald-950 border-emerald-300',
  'bg-purple-500 text-purple-950 border-purple-300',
  'bg-orange-500 text-orange-950 border-orange-300',
];

export default function PartyGamePage() {
  // Setup Wizard Step (1: Players, 2: Intensity, 3: Boundaries, 4: Start)
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSetup, setIsSetup] = useState(true);

  // Setup Form State
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'ต้น', avatarColor: DEFAULT_AVATARS[0], stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
    { id: 'p2', name: 'พลอย', avatarColor: DEFAULT_AVATARS[1], stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
    { id: 'p3', name: 'มาร์ค', avatarColor: DEFAULT_AVATARS[2], stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [maxIntensity, setMaxIntensity] = useState<IntensityLevel>(3);
  const [totalRounds, setTotalRounds] = useState<number>(20);
  const [boundaries, setBoundaries] = useState<SessionBoundaries>({
    allowPhysical: true,
    allowAlcohol: true,
    allowExplicitTalk: true,
  });

  // Gameplay State
  const [session, setSession] = useState<PartySession | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<UnifiedChallenge | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Mount logic: Load active session or saved players
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadActiveSession<PartySession>();
      if (saved && saved.mode === 'PARTY' && saved.status !== 'FINISHED') {
        setSession(saved);
        setCurrentChallenge(saved.currentChallenge || null);
        setMaxIntensity(saved.maxAllowedIntensity || 3);
        setBoundaries(saved.boundaries || { allowPhysical: true, allowAlcohol: true, allowExplicitTalk: true });
        setIsSetup(false);
        setIsCardFlipped(true);
      } else {
        const savedNames = loadSavedPlayerNames();
        if (savedNames && savedNames.length >= 3) {
          setPlayers(
            savedNames.map((name, i) => ({
              id: `p_${i}_${Date.now()}`,
              name,
              avatarColor: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
              stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 },
            }))
          );
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

  // Timer Tick
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

  // Player roster actions
  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    sounds.playClick();
    const updated = [
      ...players,
      {
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        avatarColor: DEFAULT_AVATARS[players.length % DEFAULT_AVATARS.length],
        stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 },
      },
    ];
    setPlayers(updated);
    savePlayerNames(updated.map((p) => p.name));
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 3) {
      alert('ปาร์ตี้โหมดต้องการผู้เล่นอย่างน้อย 3 คนครับ');
      return;
    }
    sounds.playClick();
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    savePlayerNames(updated.map((p) => p.name));
  };

  const handlePreset = (cnt: number) => {
    sounds.playClick();
    const defaultNames = ['ต้น', 'พลอย', 'มาร์ค', 'บาส', 'มายด์', 'น้ำ'];
    const newOnes = Array.from({ length: cnt }, (_, i) => ({
      id: `p_${i}_${Date.now()}`,
      name: defaultNames[i] || `ผู้เล่น ${i + 1}`,
      avatarColor: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
      stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 },
    }));
    setPlayers(newOnes);
    savePlayerNames(newOnes.map((p) => p.name));
  };

  // Start Game
  const handleStartGame = () => {
    if (players.length < 3) {
      alert('ปาร์ตี้โหมดต้องการผู้เล่นอย่างน้อย 3 คนครับ');
      return;
    }
    sounds.playFanfare();

    const initialAllowed = calculateAllowedIntensity(1, totalRounds, maxIntensity);
    const initialPhase = calculateGamePhase(1, totalRounds);

    const firstSelection = selectNextUnifiedChallenge({
      pool: PARTY_CHALLENGES,
      mode: 'PARTY',
      currentPermittedIntensity: initialAllowed,
      maxAllowedIntensity: maxIntensity,
      currentPhase: initialPhase,
      boundaries,
      completedIds: [],
      playerCount: players.length,
      currentPlayer: players[0],
      allPlayers: players,
    });

    const newSession: PartySession = {
      mode: 'PARTY',
      sessionId: `party_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'PLAYING',
      currentRound: 1,
      totalRounds,
      currentPhase: initialPhase,
      currentAllowedIntensity: initialAllowed,
      maxAllowedIntensity: maxIntensity,
      boundaries,
      players,
      currentPlayerIndex: 0,
      completedChallengeIds: firstSelection ? [firstSelection.challenge.id] : [],
      currentChallenge: firstSelection?.challenge,
      history: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: Date.now(),
          type: 'START',
          summary: `เริ่มเกม Party Mode (${totalRounds} รอบ) เพดานความเดือด: Level ${maxIntensity}`,
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

  // Advance turn
  const handleNextTurn = (skipped: boolean = false) => {
    if (!session) return;

    if (session.currentRound >= session.totalRounds) {
      sounds.playFanfare();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const finishedSession: PartySession = { ...session, status: 'FINISHED' };
      setSession(finishedSession);
      setIsGameOver(true);
      clearActiveSession();
      return;
    }

    const nextRound = session.currentRound + 1;
    const nextPhase = calculateGamePhase(nextRound, session.totalRounds);
    const nextAllowed = calculateAllowedIntensity(nextRound, session.totalRounds, session.maxAllowedIntensity);
    const nextPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
    const nextPlayer = session.players[nextPlayerIndex];

    const nextSelection = selectNextUnifiedChallenge({
      pool: PARTY_CHALLENGES,
      mode: 'PARTY',
      currentPermittedIntensity: nextAllowed,
      maxAllowedIntensity: session.maxAllowedIntensity,
      currentPhase: nextPhase,
      boundaries: session.boundaries,
      completedIds: session.completedChallengeIds,
      playerCount: session.players.length,
      currentPlayer: nextPlayer,
      allPlayers: session.players,
      lastCategory: currentChallenge?.categories[0],
    });

    if (nextSelection) {
      sounds.playCardFlip();
      setIsCardFlipped(false);

      setTimeout(() => {
        const updatedPlayers = session.players.map((p, idx) => {
          if (idx === session.currentPlayerIndex) {
            return {
              ...p,
              stats: {
                ...p.stats,
                challengesCompleted: skipped ? p.stats.challengesCompleted : p.stats.challengesCompleted + 1,
                challengesSkipped: skipped ? p.stats.challengesSkipped + 1 : p.stats.challengesSkipped,
              },
            };
          }
          return p;
        });

        const updatedSession: PartySession = {
          ...session,
          currentRound: nextRound,
          currentPhase: nextPhase,
          currentAllowedIntensity: nextAllowed,
          currentPlayerIndex: nextPlayerIndex,
          players: updatedPlayers,
          completedChallengeIds: nextSelection.updatedCompletedIds,
          currentChallenge: nextSelection.challenge,
        };

        setSession(updatedSession);
        setCurrentChallenge(nextSelection.challenge);
        setIsTimerRunning(false);
        setCountdown(null);
        setIsCardFlipped(true);

        if (nextSelection.challenge.requiresConsent) {
          setIsConsentModalOpen(true);
        }
      }, 350);
    }
  };

  // Lower intensity handler
  const handleLowerIntensity = (newCeiling: IntensityLevel) => {
    if (!session) return;
    sounds.playFanfare();
    const updated: PartySession = {
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

  const currentPlayer = session ? session.players[session.currentPlayerIndex] : null;
  const currentPhaseInfo = session ? GAME_PHASES[session.currentPhase] : GAME_PHASES.WARM_UP;

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="PARTY MODE" showBack={true} backHref="/" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* ===================== GAME OVER VIEW ===================== */}
        {isGameOver ? (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-zinc-900 border-2 border-amber-500/50 shadow-gold-glow text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-3xl">
              🏆
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">ปาร์ตี้จบลงอย่างสมบูรณ์!</h2>
              <p className="text-sm text-zinc-300">ทุกคนเล่นครบทั้ง {session?.totalRounds} รอบแล้ว</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-left">
              <div className="text-xs font-bold text-amber-400 uppercase">สถิติผู้เล่น</div>
              {session?.players.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-zinc-300 font-bold">{p.name}</span>
                  <span className="text-zinc-400">สำเร็จ {p.stats.challengesCompleted} ข้อ • ข้าม {p.stats.challengesSkipped} ข้อ</span>
                </div>
              ))}
            </div>
            <PrimaryActionButton
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
                { step: 1, label: 'ผู้เล่น' },
                { step: 2, label: 'ความเดือด' },
                { step: 3, label: 'ขอบเขต' },
                { step: 4, label: 'เริ่มเล่น' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setSetupStep(s.step as 1 | 2 | 3 | 4)}
                  className={`flex items-center gap-1.5 text-xs font-black transition-all ${
                    setupStep === s.step ? 'text-amber-400' : 'text-zinc-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      setupStep === s.step ? 'bg-amber-400 text-stone-950 shadow-sm' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {s.step}
                  </span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* STEP 1: PLAYERS */}
            {setupStep === 1 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700 space-y-5 shadow-tactile-rest">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">วันนี้เล่นกี่คน?</h2>
                  <p className="text-sm text-zinc-400">เลือกจำนวนคนหรือเพิ่มชื่อเพื่อนในวง</p>
                </div>

                {/* Quick Count Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handlePreset(cnt)}
                      className={`min-h-[48px] rounded-2xl font-black text-base border-2 transition-all ${
                        players.length === cnt
                          ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-gold-glow'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {cnt} คน
                    </button>
                  ))}
                </div>

                {/* Add Player Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อเพื่อน..."
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    className="flex-1 min-h-[48px] bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-4 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    className="min-h-[48px] px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่ม</span>
                  </button>
                </div>

                {/* Player List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <PlayerAvatar name={p.name} avatarColor={p.avatarColor} size="sm" index={idx} />
                        <span className="font-bold text-white text-base">{p.name}</span>
                      </div>
                      {players.length > 3 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(p.id)}
                          className="p-2 rounded-xl text-zinc-500 hover:text-rose-400"
                          aria-label={`ลบ ${p.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <PrimaryActionButton onClick={() => setSetupStep(2)}>
                  ถัดไป: เลือกระดับความเดือด
                </PrimaryActionButton>
              </div>
            )}

            {/* STEP 2: INTENSITY CEILING */}
            {setupStep === 2 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700 space-y-5 shadow-tactile-rest">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">อยากสนุกระดับไหน?</h2>
                  <p className="text-sm text-zinc-400">
                    เลือกระดับที่เป็น <span className="text-amber-400 font-bold">เพดานสูงสุด</span> (เกมจะไต่ระดับอย่างเป็นธรรมชาติ ไม่เริ่มที่จุดสูงสุดทันที)
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { level: 1, name: 'CHILL (ระดับ 1)', desc: 'สายฮา ละลายพฤติกรรม ขำขัน ปลอดภัยสำหรับทุกคน' },
                    { level: 2, name: 'FLIRTY (ระดับ 2)', desc: 'หยอดเสน่ห์ สบตา สกินชิพเบาๆ ชวนเขิน' },
                    { level: 3, name: 'SPICY (ระดับ 3)', desc: '18+ คุยเรื่องลับ สกินชิพใกล้ชิด อุณหภูมิห้องเริ่มร้อน' },
                    { level: 4, name: 'NAUGHTY (ระดับ 4)', desc: '20+ เรื่องบนเตียง สัมผัสถึงใจ ดื่มด่ำบรรยากาศผู้ใหญ่' },
                    { level: 5, name: 'UNLEASHED (ระดับ 5)', desc: '20+ ปลดปล่อยขีดจำกัด สำรวจบทบาทสมมติขั้นสุด' },
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
                            ? 'bg-amber-500/15 border-amber-400 shadow-gold-glow ring-1 ring-amber-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className={`text-base font-black ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                            {item.name}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <SecondaryActionButton fullWidth={false} onClick={() => setSetupStep(1)}>
                    ย้อนกลับ
                  </SecondaryActionButton>
                  <PrimaryActionButton onClick={() => setSetupStep(3)}>
                    ถัดไป: ตั้งค่าขอบเขต
                  </PrimaryActionButton>
                </div>
              </div>
            )}

            {/* STEP 3: BOUNDARIES */}
            {setupStep === 3 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700 space-y-5 shadow-tactile-rest">
                <BoundarySelector boundaries={boundaries} onChange={setBoundaries} />

                <div className="flex gap-3 pt-2">
                  <SecondaryActionButton fullWidth={false} onClick={() => setSetupStep(2)}>
                    ย้อนกลับ
                  </SecondaryActionButton>
                  <PrimaryActionButton onClick={() => setSetupStep(4)}>
                    ถัดไป: สรุปและเริ่มเกม
                  </PrimaryActionButton>
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & START */}
            {setupStep === 4 && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700 space-y-6 shadow-tactile-rest">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">พร้อมเริ่มปาร์ตี้แล้ว!</h2>
                  <p className="text-sm text-zinc-400">ตรวจสอบการตั้งค่าก่อนเริ่มเล่น</p>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-bold">ผู้เล่น:</span>
                    <span className="text-white font-black">{players.map((p) => p.name).join(', ')} ({players.length} คน)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-bold">เพดานความเดือด:</span>
                    <span className="text-amber-400 font-black">Level {maxIntensity} ({INTENSITY_TO_VIBE[maxIntensity]})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-bold">ขอบเขต:</span>
                    <span className="text-emerald-400 font-black">
                      {boundaries.allowPhysical ? 'สกินชิพได้' : 'ไร้สกินชิพ'} • {boundaries.allowAlcohol ? 'มีดื่ม' : 'สายคลีน'}
                    </span>
                  </div>
                </div>

                {/* Rounds selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                    จำนวนรอบการเล่น (ROUNDS)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[12, 20, 30].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={`min-h-[48px] rounded-2xl font-black text-sm border-2 ${
                          totalRounds === r
                            ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md'
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
                    icon={<Play className="w-5 h-5 fill-current" />}
                    onClick={handleStartGame}
                  >
                    เริ่มปาร์ตี้!
                  </PrimaryActionButton>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===================== ACTIVE GAMEPLAY VIEW ===================== */
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Top Bar Progress & Intensity Ceiling */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-amber-400">
                  {currentPhaseInfo.badge}
                </span>

                <span className="font-mono text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  รอบ {session?.currentRound} / {session?.totalRounds}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((session?.currentRound || 1) / (session?.totalRounds || 20)) * 100))}%`,
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
            {currentPlayer && (
              <PlayerTurnBanner
                playerName={currentPlayer.name}
                avatarColor={currentPlayer.avatarColor}
                turnIndex={session?.currentPlayerIndex}
                roundInfo={`รอบที่ ${session?.currentRound}`}
              />
            )}

            {/* Center: Tactile Physical Challenge Card */}
            {currentChallenge && (
              <PhysicalGameCard
                isFlipped={isCardFlipped}
                variant="party"
                frontContent={
                  <div className="flex flex-col justify-between h-full p-2 space-y-4">
                    {/* Header Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${
                          currentChallenge.type === 'TRUTH'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {currentChallenge.type === 'TRUTH' ? '🗣️ TRUTH (จริง)' : '⚡ DARE (กล้า)'}
                      </span>

                      <div className="flex items-center gap-2">
                        {currentChallenge.isPhysical && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            สกินชิพ
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Level {currentChallenge.intensity}
                        </span>
                      </div>
                    </div>

                    {/* Challenge Content */}
                    <div className="my-auto text-center py-4 space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-relaxed">
                        {currentChallenge.content}
                      </h3>

                      {currentChallenge.alternativeAction && (
                        <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-zinc-400 text-left">
                          <span className="text-amber-400 font-bold">ทางเลือกปลอดภัย: </span>
                          <span>{currentChallenge.alternativeAction}</span>
                        </div>
                      )}
                    </div>

                    {/* Timer control if duration exists */}
                    {currentChallenge.estimatedDuration && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {countdown === null ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCountdown(currentChallenge.estimatedDuration || 30);
                              setIsTimerRunning(true);
                              sounds.playClick();
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs sm:text-sm font-bold text-zinc-200 flex items-center gap-2 border border-zinc-700"
                          >
                            <TimerIcon className="w-4 h-4 text-amber-400" />
                            <span>จับเวลา ({currentChallenge.estimatedDuration} วิ)</span>
                          </button>
                        ) : (
                          <div
                            className={`px-5 py-2 rounded-full font-mono font-black text-base flex items-center gap-2 border ${
                              countdown <= 5
                                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                                : 'bg-zinc-800 border-zinc-700 text-amber-400'
                            }`}
                          >
                            <TimerIcon className="w-5 h-5" />
                            <span>{countdown} วินาที</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                }
                backContent={
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-4">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl shadow-lg">
                      🔥
                    </div>
                    <div className="text-xl font-black text-white">PARTY CHALLENGE</div>
                    <p className="text-xs text-zinc-400">แตะเพื่อเปิดภารกิจ</p>
                  </div>
                }
              />
            )}

            {/* Bottom Actions: Done vs Skip */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <SecondaryActionButton
                icon={<X className="w-5 h-5 text-zinc-400" />}
                onClick={() => handleNextTurn(true)}
              >
                ข้ามข้อนี้
              </SecondaryActionButton>

              <PrimaryActionButton
                icon={<Check className="w-5 h-5" />}
                onClick={() => handleNextTurn(false)}
              >
                เสร็จแล้ว
              </PrimaryActionButton>
            </div>
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
            handleNextTurn(true);
          }}
        />
      </main>
    </div>
  );
}
