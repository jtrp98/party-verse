'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Check,
  X,
  Play,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Flame,
  Smile,
  Lock,
  Globe,
  Trophy,
} from 'lucide-react';
import {
  PartySession,
  Player,
  IntensityLevel,
  UnifiedChallenge,
  SessionBoundaries,
  ContentRating,
  NormalPack,
  AreaType,
  FullRoundsChoice,
  INTENSITY_TO_VIBE,
} from '@/lib/types/redesign';
import { PARTY_CHALLENGES } from '@/lib/data/partyChallenges';
import {
  calculateGamePhase,
  calculateAllowedIntensity,
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
import { TruthOrDareChoiceSelector } from '@/components/design-system/TruthOrDareChoiceSelector';
import { SocialVoteWidget } from '@/components/design-system/SocialVoteWidget';
import { SecretRevealWidget } from '@/components/design-system/SecretRevealWidget';
import { SafetyHUD } from '@/components/design-system/SafetyHUD';

const DEFAULT_AVATARS = [
  'bg-amber-500 text-amber-950 border-amber-300',
  'bg-cyan-500 text-cyan-950 border-cyan-300',
  'bg-rose-500 text-rose-950 border-rose-300',
  'bg-emerald-500 text-emerald-950 border-emerald-300',
  'bg-purple-500 text-purple-950 border-purple-300',
  'bg-orange-500 text-orange-950 border-orange-300',
];

function PartyGameInner() {
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get('mode');

  // Setup State
  const [isSetup, setIsSetup] = useState(true);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);

  // Configuration
  const [rating, setRating] = useState<ContentRating>(initialModeParam === 'nsfw' ? 'NSFW' : 'NORMAL');
  const [normalPack, setNormalPack] = useState<NormalPack>('FUN');
  const [fullRounds, setFullRounds] = useState<FullRoundsChoice>(3);
  const [maxIntensity, setMaxIntensity] = useState<IntensityLevel>(3);
  const [areaType, setAreaType] = useState<AreaType>('PUBLIC');

  // Consent checkboxes
  const [consentDrinkingAge, setConsentDrinkingAge] = useState(false);
  const [consentAdult18, setConsentAdult18] = useState(false);

  // Players & Opt-In Pool
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'ต้น', avatarColor: DEFAULT_AVATARS[0], stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
    { id: 'p2', name: 'พลอย', avatarColor: DEFAULT_AVATARS[1], stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
    { id: 'p3', name: 'มาร์ค', avatarColor: DEFAULT_AVATARS[2], stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [optInPlayerIds, setOptInPlayerIds] = useState<string[]>(['p1', 'p2', 'p3']);

  // Boundaries
  const [boundaries] = useState<SessionBoundaries>({
    allowPhysical: true,
    allowAlcohol: true,
    allowExplicitTalk: true,
  });

  // Gameplay State
  const [session, setSession] = useState<PartySession | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<UnifiedChallenge | null>(null);
  const [turnStep, setTurnStep] = useState<'CHOOSE' | 'REVEALED'>('CHOOSE');
  const [selectedChoice, setSelectedChoice] = useState<'TRUTH' | 'DARE' | 'WILDCARD' | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Mount logic: Load active session or saved players
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadActiveSession<PartySession>();
      if (saved && saved.mode === 'PARTY' && saved.status !== 'FINISHED' && saved.rating) {
        setSession(saved);
        setRating(saved.rating);
        if (saved.normalPack) setNormalPack(saved.normalPack);
        if (saved.fullRounds) setFullRounds(saved.fullRounds);
        if (saved.areaType) setAreaType(saved.areaType);
        if (saved.scores) setScores(saved.scores);
        setMaxIntensity(saved.maxAllowedIntensity || 3);
        setPlayers(saved.players || []);
        setOptInPlayerIds((saved.players || []).map((p) => p.id));
        setIsSetup(false);

        if (saved.requiresResumeConfirmation && saved.rating === 'NSFW') {
          setShowResumeModal(true);
        } else if (saved.currentChallenge) {
          setCurrentChallenge(saved.currentChallenge);
          setTurnStep('REVEALED');
          setIsCardFlipped(true);
        } else {
          setTurnStep('CHOOSE');
          setIsCardFlipped(false);
        }
      } else {
        const savedNames = loadSavedPlayerNames();
        if (savedNames && savedNames.length >= 3) {
          const loaded = savedNames.map((name, i) => ({
            id: `p_${i}_${Date.now()}`,
            name,
            avatarColor: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
            stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 },
          }));
          setPlayers(loaded);
          setOptInPlayerIds(loaded.map((p) => p.id));
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

  // Player roster actions
  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.length >= 12) {
      alert('จำนวนผู้เล่นสูงสุดคือ 12 คนครับ');
      return;
    }
    sounds.playClick();
    const newId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const updated = [
      ...players,
      {
        id: newId,
        name,
        avatarColor: DEFAULT_AVATARS[players.length % DEFAULT_AVATARS.length],
        stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 },
      },
    ];
    setPlayers(updated);
    setOptInPlayerIds([...optInPlayerIds, newId]);
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
    setOptInPlayerIds(optInPlayerIds.filter((pid) => pid !== id));
    savePlayerNames(updated.map((p) => p.name));
  };

  const handleToggleOptIn = (id: string) => {
    sounds.playClick();
    if (optInPlayerIds.includes(id)) {
      if (optInPlayerIds.length <= 1) {
        alert('ต้องมีผู้เล่นอย่างน้อย 1 คนในกลุ่มสุ่มครับ');
        return;
      }
      const nextOpt = optInPlayerIds.filter((pid) => pid !== id);
      setOptInPlayerIds(nextOpt);

      // If current challenge was targeting this person, cancel and redraw
      if (currentChallenge) {
        const withdrawnPlayer = players.find((p) => p.id === id);
        if (withdrawnPlayer && currentChallenge.content.includes(withdrawnPlayer.name)) {
          alert(`${withdrawnPlayer.name} ถอนตัวจากกลุ่มสุ่ม — ระบบจะสุ่มการ์ดใหม่ในตานี้`);
          handleChangeCard();
        }
      }
    } else {
      setOptInPlayerIds([...optInPlayerIds, id]);
    }
  };

  // Start Game
  const handleStartGame = () => {
    if (players.length < 3 || players.length > 12) {
      alert('ปาร์ตี้โหมดต้องการผู้เล่น 3–12 คนครับ');
      return;
    }
    if (!consentDrinkingAge) {
      alert('โฮสต์ต้องยืนยันว่าทุกคนในวงอายุถึงเกณฑ์ดื่มและพร้อมเล่นครับ');
      return;
    }
    if (rating === 'NSFW' && !consentAdult18) {
      alert('NSFW ต้องยืนยันว่าทุกคนอายุ 18+ และพร้อมเห็นเนื้อหาผู้ใหญ่ครับ');
      return;
    }

    sounds.playFanfare();

    const totalTurns = players.length * fullRounds;
    const initialAllowed = rating === 'NSFW' ? calculateAllowedIntensity(1, fullRounds, maxIntensity) : 2;
    const initialPhase = calculateGamePhase(1, fullRounds);

    const initialScores: Record<string, number> = {};
    players.forEach((p) => {
      initialScores[p.id] = 0;
    });
    setScores(initialScores);

    const newSession: PartySession = {
      mode: 'PARTY',
      sessionId: `party_${Date.now()}`,
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
      players,
      currentPlayerIndex: 0,
      completedChallengeIds: [],
      scores: initialScores,
      history: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: Date.now(),
          type: 'START',
          summary: `เริ่ม PARTYVERSE: Party [${rating}] (${fullRounds} รอบเต็ม = ${totalTurns} ตา)`,
        },
      ],
    };

    setSession(newSession);
    setCurrentChallenge(null);
    setTurnStep('CHOOSE');
    setSelectedChoice(null);
    setIsCardFlipped(false);
    setIsSetup(false);
    setIsGameOver(false);
  };

  // Player selects Truth or Dare or Wildcard
  const handlePlayerChoice = (choice: 'TRUTH' | 'DARE' | 'WILDCARD') => {
    if (!session) return;
    sounds.playFanfare();
    setSelectedChoice(choice);

    const activePlayer = session.players[session.currentPlayerIndex];
    const preferredType = choice === 'WILDCARD' ? (Math.random() > 0.5 ? 'TRUTH' : 'DARE') : choice;

    const selection = selectNextUnifiedChallenge({
      pool: PARTY_CHALLENGES,
      mode: 'PARTY',
      rating: session.rating,
      normalPack: session.normalPack,
      areaType: session.areaType,
      optInPlayerIds,
      preferredType,
      currentPermittedIntensity: session.currentAllowedIntensity,
      maxAllowedIntensity: session.maxAllowedIntensity,
      currentPhase: session.currentPhase,
      boundaries: session.boundaries,
      completedIds: session.completedChallengeIds,
      playerCount: session.players.length,
      currentPlayer: activePlayer,
      allPlayers: session.players,
      lastCategory: currentChallenge?.categories[0],
    });

    if (selection) {
      setCurrentChallenge(selection.challenge);
      setSession({
        ...session,
        completedChallengeIds: selection.updatedCompletedIds,
        currentChallenge: selection.challenge,
      });

      setTimeout(() => {
        sounds.playCardFlip();
        setIsCardFlipped(true);
        setTurnStep('REVEALED');
      }, 200);
    }
  };

  // Change Card in same turn
  const handleChangeCard = () => {
    if (!session) return;
    sounds.playCardFlip();
    setIsCardFlipped(false);

    setTimeout(() => {
      const activePlayer = session.players[session.currentPlayerIndex];
      const preferredType = selectedChoice === 'WILDCARD' ? undefined : (selectedChoice || undefined);

      const redraw = selectNextUnifiedChallenge({
        pool: PARTY_CHALLENGES,
        mode: 'PARTY',
        rating: session.rating,
        normalPack: session.normalPack,
        areaType: session.areaType,
        optInPlayerIds,
        preferredType,
        currentPermittedIntensity: session.currentAllowedIntensity,
        maxAllowedIntensity: session.maxAllowedIntensity,
        currentPhase: session.currentPhase,
        boundaries: session.boundaries,
        completedIds: session.completedChallengeIds,
        playerCount: session.players.length,
        currentPlayer: activePlayer,
        allPlayers: session.players,
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

  // Advance turn (Done or Safe Pass)
  const handleNextTurn = (isPass: boolean = false, wonMiniGame: boolean = false) => {
    if (!session) return;

    const currentTurnNum = session.currentTurnIndex || 1;
    const totalTurnsNum = session.totalTurns || session.players.length * (session.fullRounds || 3);
    const activePlayer = session.players[session.currentPlayerIndex];

    // Score in Competition pack: +1 point if won mini-game / successfully completed
    const updatedScores = { ...(session.scores || scores) };
    if (session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && !isPass && (wonMiniGame || true)) {
      updatedScores[activePlayer.id] = (updatedScores[activePlayer.id] || 0) + 1;
      setScores(updatedScores);
    }

    if (currentTurnNum >= totalTurnsNum) {
      sounds.playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      const finishedSession: PartySession = { ...session, status: 'FINISHED', scores: updatedScores };
      setSession(finishedSession);
      setIsGameOver(true);
      clearActiveSession();
      return;
    }

    const nextTurn = currentTurnNum + 1;
    const nextRound = Math.floor((nextTurn - 1) / session.players.length) + 1;
    const nextPhase = calculateGamePhase(nextRound, session.fullRounds || 3);
    const nextAllowed = session.rating === 'NSFW'
      ? calculateAllowedIntensity(nextRound, session.fullRounds || 3, session.maxAllowedIntensity)
      : 2;
    const nextPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;

    const updatedSession: PartySession = {
      ...session,
      currentTurnIndex: nextTurn,
      currentRound: nextRound,
      currentPhase: nextPhase,
      currentAllowedIntensity: nextAllowed,
      currentPlayerIndex: nextPlayerIndex,
      currentChallenge: undefined,
      scores: updatedScores,
    };

    setSession(updatedSession);
    setCurrentChallenge(null);
    setTurnStep('CHOOSE');
    setSelectedChoice(null);
    setIsCardFlipped(false);
  };

  // Lower Ceiling mid-game: if current card exceeds new ceiling, hide and redraw immediately
  const handleLowerCeiling = (newCeiling: IntensityLevel) => {
    if (!session) return;
    sounds.playFanfare();

    const updated: PartySession = {
      ...session,
      maxAllowedIntensity: newCeiling,
      currentAllowedIntensity: Math.min(session.currentAllowedIntensity, newCeiling) as IntensityLevel,
    };
    setMaxIntensity(newCeiling);
    setSession(updated);
    saveActiveSession(updated);

    // If active challenge exceeds new ceiling, redraw immediately
    if (currentChallenge && currentChallenge.intensity > newCeiling) {
      alert(`ลดเพดานเป็น Level ${newCeiling}: การ์ดปัจจุบันแรงเกินเพดานใหม่ ระบบทำการปิดและจั่วการ์ดใหม่ในตานี้`);
      handleChangeCard();
    }
  };

  // Resume Confirmation Handler
  const handleConfirmResume = () => {
    sounds.playClick();
    setShowResumeModal(false);
    if (session) {
      setSession({ ...session, requiresResumeConfirmation: false });
      if (session.currentChallenge) {
        setCurrentChallenge(session.currentChallenge);
        setTurnStep('REVEALED');
        setIsCardFlipped(true);
      }
    }
  };

  const activePlayer = session?.players[session.currentPlayerIndex] || players[0];
  const headerSubtitle = session
    ? `${session.rating} ${session.rating === 'NORMAL' ? `[${session.normalPack === 'FUN' ? 'ขำ ๆ' : session.normalPack === 'DEEP_TALK' ? 'คุยเปิดใจ' : 'แข่งขันเบา ๆ'}]` : `[LEVEL ${session.maxAllowedIntensity}]`}`
    : undefined;

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="PARTYVERSE" subtitle={headerSubtitle} showBack backHref="/" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ===================== RESUME NSFW CONFIRMATION MODAL ===================== */}
        {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-zinc-900 border-2 border-amber-500/50 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
                <ShieldCheck className="w-6 h-6" />
                <span>ยืนยันก่อนเล่นต่อ (NSFW SAFEGUARD)</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                เนื่องจากเป็นการเล่นต่อในโหมด NSFW โฮสต์ต้องตรวจสอบความพร้อมของทุกคนอีกครั้งก่อนเปิดเนื้อหาบนจอ:
              </p>

              <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-zinc-200">ทุกคนยังอายุ 18+ และพร้อมเห็นเนื้อหาผู้ใหญ่</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-zinc-200">ทุกคนยินยอมพร้อมใจและมีสิทธิ์ Pass ได้เสมอ</span>
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-400">กลุ่มสุ่มที่สมัครใจ (Opt-In):</div>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => {
                    const isOpted = optInPlayerIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleToggleOptIn(p.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isOpted ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                      >
                        {p.name} {isOpted ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmResume}
                className="w-full min-h-[48px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-base shadow-md transition-all"
              >
                ยืนยันและเปิดการ์ดเล่นต่อ
              </button>
            </div>
          </div>
        )}

        {/* ===================== GAME OVER SUMMARY ===================== */}
        {isGameOver && session && (
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/95 border-2 border-amber-500/50 shadow-gold-glow text-center space-y-6 max-w-lg mx-auto animate-in zoom-in-95">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
            <h2 className="text-3xl font-black text-white">🎉 จบเกม PARTYVERSE!</h2>
            <p className="text-sm text-zinc-300">
              เล่นครบ {session.fullRounds || 3} รอบเต็ม ({session.totalTurns || session.currentTurnIndex} ตา) ยอดเยี่ยมมากทุกคน!
            </p>

            {/* If competition pack, show leaderboard */}
            {session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && (
              <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Trophy className="w-4 h-4" />
                  <span>ตารางคะแนนแข่งขันเบา ๆ:</span>
                </div>
                <div className="space-y-1.5">
                  {session.players
                    .slice()
                    .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
                    .map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-900">
                        <span className="font-bold text-zinc-200">
                          {i === 0 ? '👑 ' : ''}{p.name}
                        </span>
                        <span className="font-mono text-amber-400 font-black">
                          {scores[p.id] || 0} แต้ม
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsSetup(true);
                  setIsGameOver(false);
                  setSession(null);
                }}
                className="flex-1 min-h-[48px] rounded-2xl bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>เริ่มวงใหม่</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== SETUP WIZARD ===================== */}
        {isSetup && !isGameOver && (
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border-2 border-zinc-800 space-y-6 max-w-xl mx-auto shadow-tactile-rest">
            <div className="text-center space-y-1">
              <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
                ตั้งวงก่อนเริ่มเกม (ขั้นตอนที่ {setupStep} / 3)
              </span>
              <h2 className="text-2xl font-black text-white">PARTY MODE SETUP</h2>
            </div>

            {/* STEP 1: PLAYERS (3 to 12) */}
            {setupStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-zinc-300">สมาชิกในวง ({players.length}/12 คน):</span>
                  <span className="text-xs text-zinc-400">ขั้นต่ำ 3 คน</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    placeholder="พิมพ์ชื่อเพื่อน..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่ม</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                    >
                      <PlayerAvatar name={p.name} avatarColor={p.avatarColor} size="sm" />
                      <span className="font-bold">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={players.length < 3}
                    onClick={() => {
                      sounds.playClick();
                      setSetupStep(2);
                    }}
                    className="w-full min-h-[50px] rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-black text-base shadow-md transition-all"
                  >
                    ถัดไป: เลือกแบบเกมและรอบ
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MODE & ROUNDS */}
            {setupStep === 2 && (
              <div className="space-y-5">
                {/* Mode Switcher */}
                <div className="space-y-2">
                  <div className="text-sm font-bold text-zinc-300">เลือกแบบเกม:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setRating('NORMAL');
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${rating === 'NORMAL' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                    >
                      <Smile className="w-5 h-5" />
                      <span className="font-black text-sm">NORMAL</span>
                      <span className="text-[11px] text-zinc-400">เนื้อหาทั่วไป ไม่มีเรื่อง 18+</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setRating('NSFW');
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${rating === 'NSFW' ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-md' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                    >
                      <Flame className="w-5 h-5" />
                      <span className="font-black text-sm">NSFW (18+)</span>
                      <span className="text-[11px] text-zinc-400">เพดาน 1–5 ปาร์ตี้ผู้ใหญ่</span>
                    </button>
                  </div>
                </div>

                {/* Full Rounds Choice: 2, 3, 5 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-zinc-300">
                    <span>จำนวนรอบเต็ม (ทุกคนได้ตาครบ):</span>
                    <span className="text-xs text-amber-400">{players.length * fullRounds} ตาเล่น</span>
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
                        className={`py-2.5 rounded-xl font-black text-sm border transition-all ${fullRounds === r ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
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
                        { id: 'FUN', label: 'ขำ ๆ', desc: 'ฮาแตก ผ่อนคลาย' },
                        { id: 'DEEP_TALK', label: 'คุยเปิดใจ', desc: 'แชร์ความรู้สึก' },
                        { id: 'COMPETITION', label: 'แข่งขันเบา ๆ', desc: 'มีสะสมแต้ม' },
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

                {/* NSFW: Ceiling, Area, Opt-in */}
                {rating === 'NSFW' && (
                  <div className="space-y-4 pt-1">
                    {/* Ceiling 1-5 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span>เพดานความเดือดร่วม (Ceiling 1–5):</span>
                        <span className="text-rose-400 font-mono">Level {maxIntensity} ({INTENSITY_TO_VIBE[maxIntensity]})</span>
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
                            className={`py-2 rounded-xl font-black text-xs border transition-all ${maxIntensity === lvl ? 'bg-rose-500 text-white border-rose-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                          >
                            L{lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Area: Public vs Private */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-zinc-300">สถานที่เล่น:</div>
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
                          <span>พื้นที่ทั่วไป (ไม่เปิดการ์ดสกินชิพหนัก)</span>
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
                          <span>พื้นที่ส่วนตัว (เปิดการ์ดสกินชิพได้)</span>
                        </button>
                      </div>
                    </div>

                    {/* Opt-in Pool */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-zinc-300">คนที่สมัครใจเข้ากลุ่มสุ่มความกล้า:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {players.map((p) => {
                          const isOpt = optInPlayerIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleToggleOptIn(p.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${isOpt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}
                            >
                              {p.name} {isOpt ? '✓' : ''}
                            </button>
                          );
                        })}
                      </div>
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
                    className="flex-1 min-h-[50px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-base shadow-md transition-all"
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
                      className="w-4 h-4 mt-0.5 accent-amber-500"
                    />
                    <span className="text-zinc-200 text-xs sm:text-sm">
                      โฮสต์ยืนยันว่าทุกคนในวงอายุถึงเกณฑ์ดื่ม และพร้อมเล่นอย่างปลอดภัย
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
                        ทุกคนอายุ 18+ และพร้อมเห็นเนื้อหาผู้ใหญ่ และตกลงกันนอกจอก่อนทำเสมอ
                      </span>
                    </label>
                  )}
                </div>

                <div className="text-xs text-zinc-400 text-center">
                  * ทุกคนมีสิทธิ์ขอ <strong>Pass</strong> ข้ามได้ทันทีโดยไม่เสียแต้ม และไม่มีใครถูกบังคับดื่ม
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
                    className="flex-1 min-h-[50px] rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-stone-950 font-black text-base shadow-md transition-all"
                  >
                    เริ่มปาร์ตี้!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ACTIVE GAMEPLAY ===================== */}
        {!isSetup && session && !isGameOver && (
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Player Turn Banner */}
            <PlayerTurnBanner
              playerName={activePlayer.name}
              avatarColor={activePlayer.avatarColor}
              turnIndex={session.currentPlayerIndex}
              roundInfo={`ตาเล่นที่ ${session.currentTurnIndex || 1} / ${session.totalTurns || session.players.length * (session.fullRounds || 3)} (รอบที่ ${session.currentRound} / ${session.fullRounds || 3})`}
            />

            {/* Score HUD for Light Competition */}
            {session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && (
              <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-zinc-900 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>แต้มของ {activePlayer.name}:</span>
                </span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {scores[activePlayer.id] || 0} แต้ม
                </span>
              </div>
            )}

            {/* STAGE 1: CHOOSE TRUTH OR DARE */}
            {turnStep === 'CHOOSE' && (
              <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-center space-y-4 shadow-tactile-rest">
                <TruthOrDareChoiceSelector
                  playerName={activePlayer.name}
                  avatarColor={activePlayer.avatarColor}
                  onSelect={handlePlayerChoice}
                />
              </div>
            )}

            {/* STAGE 2: REVEALED CARD */}
            {turnStep === 'REVEALED' && currentChallenge && (
              <div className="space-y-4">
                <PhysicalGameCard
                  isFlipped={isCardFlipped}
                  onFlip={() => setIsCardFlipped(!isCardFlipped)}
                  variant="party"
                  backContent={
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                      <div className="text-xs font-black tracking-widest text-amber-400 uppercase">
                        {selectedChoice || currentChallenge.type}
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-white">
                        PARTY CARD
                      </div>
                      <div className="text-xs text-zinc-400">
                        แตะเพื่อเปิดการ์ด
                      </div>
                    </div>
                  }
                  frontContent={
                    <div className="flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
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

                        {/* Social Vote Widget */}
                        {currentChallenge.type === 'VOTE' && (
                          <SocialVoteWidget
                            players={session.players}
                            prompt={currentChallenge.content}
                            onComplete={() => {}}
                          />
                        )}

                        {/* Secret Reveal Widget */}
                        {currentChallenge.type === 'SECRET_REVEAL' && (
                          <SecretRevealWidget
                            playerName={activePlayer.name}
                            secretPrompt={currentChallenge.content}
                          />
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-500 text-center">
                        แตะการ์ดเพื่อพลิกกลับ
                      </div>
                    </div>
                  }
                />

                {/* Drinking Alternative Action */}
                {currentChallenge.alternativeAction && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 text-center space-y-0.5">
                    <span className="text-amber-400 font-bold">ตัวเลือกแทนดื่ม / Sober Action: </span>
                    <span>{currentChallenge.alternativeAction}</span>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <SecondaryActionButton
                    destructive
                    onClick={() => handleNextTurn(true)}
                  >
                    <span>ขอ Pass (ข้ามฟรี)</span>
                  </SecondaryActionButton>

                  <PrimaryActionButton
                    onClick={() => handleNextTurn(false, true)}
                  >
                    <span>ทำสำเร็จแล้ว!</span>
                  </PrimaryActionButton>
                </div>

                {/* Safety HUD */}
                <SafetyHUD
                  currentCeiling={session.maxAllowedIntensity}
                  onChangeCard={handleChangeCard}
                  onSafePass={() => handleNextTurn(true)}
                  onLowerCeiling={session.rating === 'NSFW' ? handleLowerCeiling : undefined}
                  onPausePlayer={() => handleNextTurn(true)}
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

export default function PartyGamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tabletop text-amber-400 p-8 text-center font-bold">กำลังโหลด PARTYVERSE...</div>}>
      <PartyGameInner />
    </Suspense>
  );
}