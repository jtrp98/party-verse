'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  Flame,
  Shield,
  Clock,
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  X,
  Play,
  HeartHandshake,
  TrendingDown,
  Timer as TimerIcon,
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
import {
  selectNextUnifiedChallenge,
} from '@/lib/engine/coreSelectionEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  loadSavedPlayerNames,
  savePlayerNames,
} from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';

const DEFAULT_AVATARS = [
  'bg-cyan-500 text-cyan-950 border-cyan-300',
  'bg-rose-500 text-rose-950 border-rose-300',
  'bg-amber-500 text-amber-950 border-amber-300',
  'bg-emerald-500 text-emerald-950 border-emerald-300',
  'bg-violet-500 text-violet-950 border-violet-300',
  'bg-orange-500 text-orange-950 border-orange-300',
  'bg-pink-500 text-pink-950 border-pink-300',
  'bg-indigo-500 text-indigo-950 border-indigo-300',
];

export default function PartyGamePage() {
  // Setup State
  const [isSetup, setIsSetup] = useState(true);
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

  // In-Game State
  const [session, setSession] = useState<PartySession | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<UnifiedChallenge | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingConsentChallenge, setPendingConsentChallenge] = useState<UnifiedChallenge | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mount logic: Load active session or saved players
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(sounds.getIsMuted());
      const saved = loadActiveSession<PartySession>();
      if (saved && saved.mode === 'PARTY' && saved.status !== 'FINISHED') {
        setSession(saved);
        setCurrentChallenge(saved.currentChallenge || null);
        setMaxIntensity(saved.maxAllowedIntensity || 3);
        setBoundaries(saved.boundaries || { allowPhysical: true, allowAlcohol: true, allowExplicitTalk: true });
        setIsSetup(false);
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
    const defaultNames = ['คุณ A', 'คุณ B', 'คุณ C', 'คุณ D', 'คุณ E', 'คุณ F'];
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

    if (firstSelection?.challenge.requiresConsent) {
      setPendingConsentChallenge(firstSelection.challenge);
      setIsConsentModalOpen(true);
    }
  };

  // Advance to next round
  const handleNextTurn = (skipped: boolean = false) => {
    if (!session) return;

    if (session.currentRound >= session.totalRounds) {
      // Game finished
      sounds.playFanfare();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const finishedSession: PartySession = {
        ...session,
        status: 'FINISHED',
      };
      setSession(finishedSession);
      setIsGameOver(true);
      clearActiveSession();
      return;
    }

    const nextRound = session.currentRound + 1;
    const nextPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
    const nextPlayer = session.players[nextPlayerIndex];

    const nextPhase = calculateGamePhase(nextRound, session.totalRounds);
    const nextAllowed = calculateAllowedIntensity(nextRound, session.totalRounds, session.maxAllowedIntensity);

    // Update player stats
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

    const nextSelection = selectNextUnifiedChallenge({
      pool: PARTY_CHALLENGES,
      mode: 'PARTY',
      currentPermittedIntensity: nextAllowed,
      maxAllowedIntensity: session.maxAllowedIntensity,
      currentPhase: nextPhase,
      boundaries: session.boundaries,
      completedIds: session.completedChallengeIds,
      playerCount: updatedPlayers.length,
      currentPlayer: nextPlayer,
      allPlayers: updatedPlayers,
      lastCategory: currentChallenge?.categories[0],
    });

    if (nextSelection) {
      sounds.playFlip();
      const updatedSession: PartySession = {
        ...session,
        currentRound: nextRound,
        currentPlayerIndex: nextPlayerIndex,
        currentPhase: nextPhase,
        currentAllowedIntensity: nextAllowed,
        players: updatedPlayers,
        completedChallengeIds: nextSelection.updatedCompletedIds,
        currentChallenge: nextSelection.challenge,
      };

      setSession(updatedSession);
      setCurrentChallenge(nextSelection.challenge);
      setIsTimerRunning(false);
      setCountdown(null);

      // Check affirmative consent
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
    const updatedSession: PartySession = {
      ...session,
      maxAllowedIntensity: nextCeiling,
      currentAllowedIntensity: Math.min(session.currentAllowedIntensity, nextCeiling) as IntensityLevel,
    };
    setSession(updatedSession);
    setMaxIntensity(nextCeiling);
  };

  const currentPhaseInfo = session ? GAME_PHASES[session.currentPhase] : GAME_PHASES.WARM_UP;
  const currentPlayer = session ? session.players[session.currentPlayerIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              <span>PARTY MODE</span>
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium">3+ คน • ไต่ระดับความเร้าใจ</span>
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
            aria-label="เสียง"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
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
            {/* Hero banner */}
            <div className="text-center space-y-1.5 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>PARTY MODE SETUP</span>
              </div>
              <h2 className="text-2xl font-black text-white">ตั้งค่าปาร์ตี้</h2>
              <p className="text-xs text-zinc-400">สำหรับเพื่อน 3 คนขึ้นไป เพดานความเดือดและสกินชิพตามต้องการ</p>
            </div>

            {/* Players Setup */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>รายชื่อผู้เล่น ({players.length} คน)</span>
                </label>
                <div className="flex gap-1">
                  {[3, 4, 5, 6].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handlePreset(cnt)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        players.length === cnt
                          ? 'bg-cyan-500 text-cyan-950'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {cnt} คน
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อเพื่อน..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="px-3.5 py-2 rounded-2xl bg-cyan-500 text-cyan-950 font-black text-xs hover:bg-cyan-400 active:scale-95"
                >
                  เพิ่ม
                </button>
              </div>

              {/* List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2 bg-zinc-950/70 border border-zinc-800/80 p-2 rounded-2xl">
                    <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${p.avatarColor}`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-xs font-bold text-zinc-200 truncate">{p.name}</span>
                    {players.length > 3 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Max Intensity Selector */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>เพดานความเดือดสูงสุด (MAX INTENSITY)</span>
                </label>
                <span className="text-[10px] text-amber-400 font-bold">Level {maxIntensity} ({INTENSITY_TO_VIBE[maxIntensity]})</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { level: 1, label: 'CHILL', desc: 'สายฮา' },
                  { level: 2, label: 'FLIRTY', desc: 'หยอดเสน่ห์' },
                  { level: 3, label: 'SPICY', desc: '18+ คุยฟิน' },
                  { level: 4, label: 'NAUGHTY', desc: '18+ ใกล้ชิด' },
                  { level: 5, label: 'UNLEASHED', desc: 'ปลดขีดจำกัด' },
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
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black ring-1 ring-rose-500 shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 font-bold'
                    }`}
                  >
                    <div className="text-xs">{item.level}</div>
                    <div className="text-[9px] truncate">{item.label}</div>
                  </button>
                ))}
              </div>

              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <p className="font-bold text-zinc-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>ระบบไต่ระดับอัจฉริยะ (Pacing Engine):</span>
                </p>
                <p>ระดับที่เลือกคือ <strong>เพดานสูงสุด</strong> ของทั้งเกม เกมจะเริ่มจากอุ่นเครื่องสบายๆ และค่อยๆ เพิ่มความท้าทายตามจังหวะคลื่นความสนุก</p>
              </div>
            </div>

            {/* Session Length */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-2">
              <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>ความยาวของเกม (SESSION LENGTH)</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { rounds: 10, label: '10 รอบ', sub: 'ด่วน ~15 นาที' },
                  { rounds: 20, label: '20 รอบ', sub: 'มาตรฐาน ~30 นาที' },
                  { rounds: 30, label: '30 รอบ', sub: 'มาราธอน 45+ นาที' },
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
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-black ring-1 ring-sky-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 font-bold'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Boundaries Configuration */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-2.5">
              <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>ขอบเขตความปลอดภัยและสิทธิผู้เล่น (BOUNDARIES)</span>
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-zinc-200">อนุญาตสกินชิพ & สัมผัสร่างกาย</div>
                    <div className="text-[10px] text-zinc-500">หากปิด จะมีเฉพาะภารกิจสายพูดคุยและการแสดง</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={boundaries.allowPhysical}
                    onChange={(e) => setBoundaries({ ...boundaries, allowPhysical: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-zinc-200">สายปาร์ตี้แอลกอฮอล์</div>
                    <div className="text-[10px] text-zinc-500">หากปิด จะแสดงทางเลือกปฏิเสธแบบไร้บทลงโทษ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={boundaries.allowAlcohol}
                    onChange={(e) => setBoundaries({ ...boundaries, allowAlcohol: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-base shadow-xl hover:opacity-95 active:scale-98 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>เริ่มเปิดวงปาร์ตี้ ({totalRounds} รอบ)</span>
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-950 text-amber-400 border border-zinc-800">
                    คลื่นความเดือด: Level {session?.currentAllowedIntensity || 1} / {session?.maxAllowedIntensity || 5}
                  </span>
                  <span className="text-zinc-400 font-mono text-xs">
                    รอบ {session?.currentRound}/{session?.totalRounds}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((session?.currentRound || 1) / (session?.totalRounds || 20)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Turn Banner */}
            {currentPlayer && session && (
              <div className="flex items-center justify-between p-3.5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${currentPlayer.avatarColor}`}>
                    {session.currentPlayerIndex + 1}
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">ถึงตาของผู้เล่น</div>
                    <div className="text-sm font-black text-white">{currentPlayer.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
                    ส่งโทรศัพท์ให้ {currentPlayer.name} 📱
                  </span>
                </div>
              </div>
            )}

            {/* Challenge Presentation Card */}
            {currentChallenge && (
              <div className="relative rounded-3xl p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl space-y-5 min-h-[280px] flex flex-col justify-between">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${
                    currentChallenge.type === 'TRUTH'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {currentChallenge.type === 'TRUTH' ? '🗣️ TRUTH (จริง)' : '⚡ DARE (กล้า)'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {currentChallenge.isPhysical && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        สกินชิพ
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Level {currentChallenge.intensity}
                    </span>
                  </div>
                </div>

                {/* Question Body */}
                <div className="space-y-2 text-center py-4">
                  <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                    {currentChallenge.content}
                  </h3>
                  {currentChallenge.alternativeAction && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 text-left">
                      <span className="text-amber-400 font-bold">ทางเลือกปลอดภัย: </span>
                      <span>{currentChallenge.alternativeAction}</span>
                    </div>
                  )}
                </div>

                {/* Timer Control if duration exists */}
                {currentChallenge.estimatedDuration && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {countdown === null ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCountdown(currentChallenge.estimatedDuration || 30);
                          setIsTimerRunning(true);
                          sounds.playClick();
                        }}
                        className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5"
                      >
                        <TimerIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>เริ่มจับเวลา ({currentChallenge.estimatedDuration} วิ)</span>
                      </button>
                    ) : (
                      <div className={`px-4 py-1.5 rounded-full font-mono font-black text-sm flex items-center gap-2 border ${
                        countdown <= 5
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                          : 'bg-zinc-800 border-zinc-700 text-amber-400'
                      }`}>
                        <TimerIcon className="w-4 h-4" />
                        <span>{countdown} วินาที</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleNextTurn(true)}
                className="py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <X className="w-4 h-4 text-zinc-500" />
                <span>ขอ Pass / เปลี่ยนข้อ</span>
              </button>

              <button
                type="button"
                onClick={() => handleNextTurn(false)}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs shadow-lg hover:opacity-95 flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ทำสำเร็จ / ตอบแล้ว</span>
              </button>
            </div>

            {/* Lower Intensity Pill */}
            {session && session.maxAllowedIntensity > 1 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleLowerIntensity}
                  className="text-[11px] text-zinc-500 hover:text-amber-400 underline underline-offset-4 inline-flex items-center gap-1"
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>ลดความเดือดลง 1 ขั้น (ปัจจุบัน Level {session.maxAllowedIntensity})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== AFFIRMATIVE CONSENT MODAL ===================== */}
        {isConsentModalOpen && pendingConsentChallenge && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5 text-amber-400">
                <HeartHandshake className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-black text-white">ต้องการความยินยอมพร้อมใจ</h3>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 space-y-1.5">
                <p className="font-bold text-white">ภารกิจนี้เกี่ยวข้องกับการสัมผัสหรือความใกล้ชิด:</p>
                <p className="text-zinc-400">{pendingConsentChallenge.content}</p>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                ผู้เล่นทุกคนที่เกี่ยวข้องต้องยินยอมด้วยความเต็มใจ หากฝ่ายใดฝ่ายหนึ่งรู้สึกไม่สะดวกใจ สามารถขอเปลี่ยนข้อได้ทันทีโดยไม่มีการลงโทษใดๆ
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsConsentModalOpen(false);
                    handleNextTurn(true); // non-punitive skip
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
                  className="py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs"
                >
                  ยินยอมทั้งสองฝ่าย
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== GAME OVER MODAL ===================== */}
        {isGameOver && session && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">ปาร์ตี้ส่งท้ายสำเร็จ!</h3>
                <p className="text-xs text-zinc-400">จบการเล่นครบ {session.totalRounds} รอบเรียบร้อยแล้ว</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 text-left space-y-2">
                <div className="text-xs font-bold text-zinc-300">สถิติผู้เล่นในวง:</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {session.players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-0">
                      <span className="font-bold text-zinc-200">{p.name}</span>
                      <span className="text-zinc-400">
                        สำเร็จ {p.stats.challengesCompleted} ข้อ • ข้าม {p.stats.challengesSkipped} ข้อ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

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
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center"
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
