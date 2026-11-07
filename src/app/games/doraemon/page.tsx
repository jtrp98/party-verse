'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Layers,
  Crown,
  Info,
  ShieldCheck,
  Flame,
  Smile,
  Globe,
  Lock,
  Trophy,
} from 'lucide-react';
import {
  Player,
  GameVibeLevel,
  GameDifficulty,
  PlayingCard,
  DoraemonSession,
  ActiveMiniGameInstance,
  IntensityLevel,
  SessionBoundaries,
  ContentRating,
  NormalPack,
  AreaType,
  INTENSITY_TO_VIBE,
  VIBE_TO_INTENSITY,
} from '@/lib/types/game';
import { GameHeader } from '@/components/design-system/GameHeader';
import { PlayerTurnBanner } from '@/components/design-system/PlayerTurnBanner';
import { PrimaryActionButton } from '@/components/design-system/PrimaryActionButton';
import { Card3D } from '@/components/game/Card3D';
import { PlayerSetupModal } from '@/components/game/PlayerSetupModal';
import { GameOverviewModal } from '@/components/game/GameOverviewModal';
import { MiniGameModal } from '@/components/game/MiniGameModal';
import { generate52CardDeck, shuffleDeck, drawNextCard, getDeckStats } from '@/lib/engine/cardEngine';
import { calculateDoraemonPhase } from '@/lib/engine/progressionEngine';
import { getNextPlayerIndex, updatePlayerStat, createNewPlayer } from '@/lib/engine/playerEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  loadSavedPlayerNames,
} from '@/lib/engine/sessionManager';
import { pickNextMiniGame } from '@/lib/engine/miniGameEngine';
import { sounds } from '@/lib/sound/webAudio';
import { SafetyHUD } from '@/components/design-system/SafetyHUD';

function DoraemonGameInner() {
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get('mode');

  // Session State
  const [session, setSession] = useState<DoraemonSession | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentDrawnCard, setCurrentDrawnCard] = useState<PlayingCard | null>(null);

  // Modals
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(false);
  const [activeMiniGame, setActiveMiniGame] = useState<ActiveMiniGameInstance | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);

  // Setup Form State
  const [setupPlayers, setSetupPlayers] = useState<Player[]>([]);
  const [rating, setRating] = useState<ContentRating>(initialModeParam === 'nsfw' ? 'NSFW' : 'NORMAL');
  const [normalPack, setNormalPack] = useState<NormalPack>('FUN');
  const [setupLevel, setSetupLevel] = useState<GameVibeLevel>('SPICY');
  const [setupCeiling, setSetupCeiling] = useState<IntensityLevel>(3);
  const [areaType, setAreaType] = useState<AreaType>('PUBLIC');
  const [optInPlayerIds, setOptInPlayerIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  // Consent checkboxes
  const [consentDrinkingAge, setConsentDrinkingAge] = useState(false);
  const [consentAdult18, setConsentAdult18] = useState(false);

  const [setupBoundaries] = useState<SessionBoundaries>({
    allowPhysical: true,
    allowAlcohol: true,
    allowExplicitTalk: true,
  });

  // Load existing session or default setup on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const existing = loadActiveSession<DoraemonSession>();
      if (existing && existing.gameId === 'doraemon' && existing.status !== 'FINISHED' && existing.rating) {
        setSession(existing);
        setRating(existing.rating);
        if (existing.normalPack) setNormalPack(existing.normalPack);
        if (existing.areaType) setAreaType(existing.areaType);
        if (existing.scores) setScores(existing.scores);
        setSetupCeiling(existing.maxAllowedIntensity || 3);
        setOptInPlayerIds(existing.players.map((p) => p.id));
        setIsSetupOpen(false);

        if (existing.requiresResumeConfirmation && existing.rating === 'NSFW') {
          setShowResumeModal(true);
        } else if (existing.drawnCards.length > 0) {
          const last = existing.drawnCards[existing.drawnCards.length - 1];
          setCurrentDrawnCard(last);
          setIsFlipped(true);
        }
      } else {
        const savedNames = loadSavedPlayerNames();
        const loaded = savedNames.map((name, i) => createNewPlayer(name, i));
        setSetupPlayers(loaded);
        setOptInPlayerIds(loaded.map((p) => p.id));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync session changes to LocalStorage
  useEffect(() => {
    if (session) {
      saveActiveSession(session);
    }
  }, [session]);

  const handleToggleOptIn = (id: string) => {
    sounds.playClick();
    if (optInPlayerIds.includes(id)) {
      if (optInPlayerIds.length <= 1) {
        alert('ต้องมีผู้เล่นอย่างน้อย 1 คนในกลุ่มสุ่มครับ');
        return;
      }
      setOptInPlayerIds(optInPlayerIds.filter((pid) => pid !== id));
    } else {
      setOptInPlayerIds([...optInPlayerIds, id]);
    }
  };

  // Start Game Handler
  const handleStartGame = () => {
    if (setupPlayers.length < 2 || setupPlayers.length > 12) {
      alert('โดราเอมอนรองรับผู้เล่น 2–12 คนครับ');
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
    const freshDeck = shuffleDeck(generate52CardDeck(undefined, setupBoundaries, rating, normalPack));
    const ceiling = rating === 'NSFW' ? setupCeiling : 2;

    const initialScores: Record<string, number> = {};
    setupPlayers.forEach((p) => {
      initialScores[p.id] = 0;
    });
    setScores(initialScores);

    const newSession: DoraemonSession = {
      gameId: 'doraemon',
      sessionId: `doraemon_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: setupPlayers,
      currentPlayerIndex: 0,
      level: INTENSITY_TO_VIBE[ceiling],
      difficulty: 'EASY',
      maxAllowedIntensity: ceiling,
      currentAllowedIntensity: ceiling,
      boundaries: setupBoundaries,
      rating,
      normalPack: rating === 'NORMAL' ? normalPack : undefined,
      areaType: rating === 'NSFW' ? areaType : undefined,
      scores: initialScores,
      currentPhase: 'WARM_UP',
      status: 'PLAYING',
      deck: freshDeck,
      drawnCards: [],
      activeRules: {
        kingsDrawn: 0,
        activeHouseRules: [],
      },
      history: [
        {
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          playerId: setupPlayers[0].id,
          playerName: setupPlayers[0].name,
          type: 'RULE_TRIGGER',
          summary: `เริ่ม PARTYVERSE: Doraemon [${rating}] เพดาน Level ${ceiling}`,
        },
      ],
    };

    setSession(newSession);
    setIsSetupOpen(false);
    setIsFlipped(false);
    setCurrentDrawnCard(null);
  };

  // Draw Card Handler
  const handleDrawCard = () => {
    if (!session || isFlipped) return;

    sounds.playCardShuffle();

    const currentPlayer = session.players[session.currentPlayerIndex];
    const { card, updatedDeck } = drawNextCard(session.deck, currentPlayer.id);

    if (!card) {
      sounds.playFanfare();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      setSession({ ...session, status: 'FINISHED' });
      return;
    }

    setTimeout(() => {
      if (card.rank === 'K') {
        sounds.playImpactSlam();
      } else {
        sounds.playCardFlip();
      }
      setIsFlipped(true);
    }, 150);

    setCurrentDrawnCard(card);

    const newDrawnList = [...session.drawnCards, card];
    const nextPhase = calculateDoraemonPhase(newDrawnList.length, 52);

    let updatedPlayers = [...session.players];
    const updatedActiveRules = { ...session.activeRules };

    if (card.rank === 'J') {
      updatedActiveRules.princeId = currentPlayer.id;
      updatedPlayers = updatePlayerStat(updatedPlayers, currentPlayer.id, 'jCards', 1);
    } else if (card.rank === 'Q') {
      updatedActiveRules.questionMasterId = currentPlayer.id;
      updatedPlayers = updatePlayerStat(updatedPlayers, currentPlayer.id, 'qCards', 1);
    } else if (card.rank === 'K') {
      const nextKings = updatedActiveRules.kingsDrawn + 1;
      updatedActiveRules.kingsDrawn = nextKings;
      updatedPlayers = updatePlayerStat(updatedPlayers, currentPlayer.id, 'kCards', 1);

      if (nextKings === 4) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        sounds.playFanfare();

        // 4th K: Triggers Finale Adult Mini-Game in NSFW!
        if (session.rating === 'NSFW') {
          setTimeout(() => {
            const finaleMiniGame = pickNextMiniGame({
              level: session.level,
              difficulty: 'EXTREME',
              phase: 'FINALE',
              players: session.players,
              currentPlayerIndex: session.currentPlayerIndex,
              maxAllowedIntensity: session.maxAllowedIntensity,
              rating: 'NSFW',
              areaType: session.areaType,
              optInPlayerIds,
              isFinale: true,
            });
            if (finaleMiniGame) {
              setActiveMiniGame(finaleMiniGame);
            }
          }, 600);
        }
      }
    } else if (card.rank === '8') {
      updatedPlayers = updatePlayerStat(updatedPlayers, currentPlayer.id, 'bathroomPasses', 1);
    }

    const nextSession: DoraemonSession = {
      ...session,
      deck: updatedDeck,
      drawnCards: newDrawnList,
      players: updatedPlayers,
      currentPhase: nextPhase,
      activeRules: updatedActiveRules,
      history: [
        ...session.history,
        {
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          type: 'DRAW_CARD',
          summary: `จั่วได้ไพ่ ${card.rank} (${card.ruleTitle})`,
        },
      ],
    };

    setSession(nextSession);

    // Trigger mini-game on cards 4, 5, 7, 10
    if (card.triggersMiniGame) {
      setTimeout(() => {
        const miniGame = pickNextMiniGame({
          level: session.level,
          difficulty: 'HARD',
          phase: nextPhase,
          players: session.players,
          currentPlayerIndex: session.currentPlayerIndex,
          maxAllowedIntensity: session.maxAllowedIntensity,
          rating: session.rating,
          normalPack: session.normalPack,
          areaType: session.areaType,
          optInPlayerIds,
        });
        if (miniGame) {
          setActiveMiniGame(miniGame);
        }
      }, 700);
    }
  };

  // Mini-Game Completed Handler (Reward points if competition)
  const handleMiniGameComplete = (winnerId?: string) => {
    setActiveMiniGame(null);
    if (!session) return;

    if (session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && winnerId) {
      const updatedScores = { ...(session.scores || scores) };
      updatedScores[winnerId] = (updatedScores[winnerId] || 0) + 1;
      setScores(updatedScores);
      setSession({ ...session, scores: updatedScores });
    }
  };

  // Next Turn Handler (Pass Phone)
  const handleNextTurn = () => {
    if (!session) return;
    sounds.playTurnChime();

    // Check if 52 cards completed
    if (session.drawnCards.length >= 52) {
      sounds.playFanfare();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      setSession({ ...session, status: 'FINISHED' });
      clearActiveSession();
      return;
    }

    const nextIdx = getNextPlayerIndex(session.currentPlayerIndex, session.players.length);
    setSession({
      ...session,
      currentPlayerIndex: nextIdx,
    });
    setIsFlipped(false);
    setCurrentDrawnCard(null);
  };

  // Lower intensity ceiling during play
  const handleLowerIntensity = (newCeiling: IntensityLevel) => {
    if (!session) return;
    sounds.playFanfare();
    const newVibe = INTENSITY_TO_VIBE[newCeiling];
    const updated: DoraemonSession = {
      ...session,
      level: newVibe,
      maxAllowedIntensity: newCeiling,
      currentAllowedIntensity: newCeiling,
    };
    setSession(updated);
    setSetupCeiling(newCeiling);
    saveActiveSession(updated);

    // If active mini game exceeds new ceiling, re-select
    if (activeMiniGame) {
      const activeIntensity = VIBE_TO_INTENSITY[activeMiniGame.game.level] || 1;
      if (activeIntensity > newCeiling) {
        alert(`ลดเพดานเป็น Level ${newCeiling}: มินิเกมปัจจุบันแรงเกินเพดานใหม่ สุ่มมินิเกมใหม่ที่ปลอดภัย`);
        const replacement = pickNextMiniGame({
          level: newVibe,
          difficulty: 'EASY',
          phase: session.currentPhase,
          players: session.players,
          currentPlayerIndex: session.currentPlayerIndex,
          maxAllowedIntensity: newCeiling,
          rating: session.rating,
          normalPack: session.normalPack,
          areaType: session.areaType,
          optInPlayerIds,
        });
        setActiveMiniGame(replacement);
      }
    }
  };

  const handleConfirmResume = () => {
    sounds.playClick();
    setShowResumeModal(false);
    if (session) {
      setSession({ ...session, requiresResumeConfirmation: false });
    }
  };

  const currentPlayer = session ? session.players[session.currentPlayerIndex] : null;
  const stats = session ? getDeckStats(session.deck) : null;
  const questionMaster = session?.players.find((p) => p.id === session.activeRules.questionMasterId);
  const prince = session?.players.find((p) => p.id === session.activeRules.princeId);

  const headerSubtitle = session
    ? `${session.rating} ${session.rating === 'NORMAL' ? `[${session.normalPack === 'FUN' ? 'ขำ ๆ' : session.normalPack === 'DEEP_TALK' ? 'คุยเปิดใจ' : 'แข่งขันเบา ๆ'}]` : `[LEVEL ${session.maxAllowedIntensity}]`}`
    : undefined;

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="PARTYVERSE" subtitle={headerSubtitle} showBack backHref="/" />

      {/* ===================== RESUME NSFW CONFIRMATION MODAL ===================== */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border-2 border-sky-500/50 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-sky-400 font-black text-lg">
              <ShieldCheck className="w-6 h-6" />
              <span>ยืนยันก่อนเล่นต่อ (DORAEMON NSFW)</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              กรุณายืนยันความพร้อมของทุกคนก่อนเปิดไพ่เล่นต่อ:
            </p>

            <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-sky-500" />
                <span className="text-zinc-200">ทุกคนอายุ 18+ และพร้อมเล่นต่อ</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-sky-500" />
                <span className="text-zinc-200">ยินยอมพร้อมใจและมีสิทธิ์ Pass ได้เสมอ</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleConfirmResume}
              className="w-full min-h-[48px] rounded-2xl bg-sky-400 hover:bg-sky-300 text-stone-950 font-black text-base shadow-md transition-all"
            >
              ยืนยันและเล่นต่อ
            </button>
          </div>
        </div>
      )}

      {/* ===================== GAME SETUP SCREEN ===================== */}
      {isSetupOpen && (
        <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="text-center space-y-1.5 pt-2">
            <span className="text-4xl">🃏</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
              DORAEMON ARCADE
            </h1>
            <p className="text-sm text-zinc-400">
              จั่วไพ่ 52 ใบไม่ซ้ำ กติกาไทยแท้ พร้อมมินิเกมวงเหล้า และ K ใบที่ 4 ปิดวง
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700 space-y-6 shadow-tactile-rest">
            <PlayerSetupModal players={setupPlayers} onPlayersChange={setSetupPlayers} />

            {/* Mode Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">เลือกแบบเกม:</label>
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
                  <span className="text-[11px] text-zinc-400">คลาสสิกวงเหล้า ไร้เรื่อง 18+</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setRating('NSFW');
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${rating === 'NSFW' ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                >
                  <Flame className="w-5 h-5" />
                  <span className="font-black text-sm">NSFW (18+)</span>
                  <span className="text-[11px] text-zinc-400">มินิเกมผู้ใหญ่ 1–5 + K ส่งท้าย</span>
                </button>
              </div>
            </div>

            {/* Normal: 3 Packs */}
            {rating === 'NORMAL' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-400">เลือกชุดโจทย์ Normal:</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'FUN', label: 'ขำ ๆ', desc: 'คลาสสิกฮาแตก' },
                    { id: 'DEEP_TALK', label: 'คุยเปิดใจ', desc: 'ซึ้งใจและเรื่องเล่า' },
                    { id: 'COMPETITION', label: 'แข่งขันเบา ๆ', desc: 'ชิงไหวพริบสะสมแต้ม' },
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
                    <span>เพดานความเดือดมินิเกม (Ceiling 1–5):</span>
                    <span className="text-sky-400 font-mono">Level {setupCeiling} ({INTENSITY_TO_VIBE[setupCeiling]})</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as IntensityLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSetupCeiling(lvl);
                        }}
                        className={`py-2 rounded-xl font-black text-xs border transition-all ${setupCeiling === lvl ? 'bg-sky-400 text-stone-950 border-sky-300' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                      >
                        L{lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area */}
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
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${areaType === 'PRIVATE' ? 'bg-zinc-800 text-sky-300 border-sky-400' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>พื้นที่ส่วนตัว</span>
                  </button>
                </div>

                {/* Opt-in Pool */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-300">กลุ่มสุ่มที่สมัครใจเข้าเล่นมินิเกมผู้ใหญ่:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {setupPlayers.map((p) => {
                      const isOpt = optInPlayerIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleToggleOptIn(p.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${isOpt ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}
                        >
                          {p.name} {isOpt ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Consent Box */}
            <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-sm">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentDrinkingAge}
                  onChange={(e) => setConsentDrinkingAge(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-sky-500"
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
                    className="w-4 h-4 mt-0.5 accent-sky-500"
                  />
                  <span className="text-sky-300 text-xs sm:text-sm">
                    ทุกคนอายุ 18+ และพร้อมเล่นมินิเกมผู้ใหญ่
                  </span>
                </label>
              )}
            </div>

            <PrimaryActionButton
              onClick={handleStartGame}
              disabled={setupPlayers.length < 2 || !consentDrinkingAge || (rating === 'NSFW' && !consentAdult18)}
            >
              <span>เริ่มจั่วไพ่ (52 ใบ)</span>
            </PrimaryActionButton>
          </div>
        </main>
      )}

      {/* ===================== ACTIVE GAMEPLAY SCREEN ===================== */}
      {!isSetupOpen && session && (
        <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4 flex flex-col justify-between space-y-4">
          {/* Top Bar with player turn */}
          {currentPlayer && (
            <PlayerTurnBanner
              playerName={currentPlayer.name}
              avatarColor={currentPlayer.avatarColor}
              turnIndex={session.currentPlayerIndex}
              roundInfo={`ไพ่ใบที่ ${session.drawnCards.length + 1} / 52`}
            />
          )}

          {/* Active house rules chip (Prince / Question Master / Kings) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>King {session.activeRules.kingsDrawn}/4</span>
              </span>
              {prince && (
                <span className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/50">
                  🤴 J: {prince.name}
                </span>
              )}
              {questionMaster && (
                <span className="text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50">
                  ❓ Q: {questionMaster.name}
                </span>
              )}
            </div>

            {/* Score HUD for Light Competition */}
            {session.rating === 'NORMAL' && session.normalPack === 'COMPETITION' && (
              <span className="font-bold text-amber-300 flex items-center gap-1 font-mono">
                <Trophy className="w-3.5 h-3.5" />
                <span>แต้ม {scores[currentPlayer?.id || ''] || 0}</span>
              </span>
            )}
          </div>

          {/* Card Play Arena */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <Card3D
              card={currentDrawnCard}
              isFlipped={isFlipped}
              onCardClick={handleDrawCard}
            />
          </div>

          {/* Actions & Next Turn Controls */}
          {isFlipped ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="w-full min-h-[48px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-sm"
                >
                  ข้ามตานี้ (Pass)
                </button>
                <PrimaryActionButton onClick={handleNextTurn}>
                  <span>ส่งต่อคนถัดไป</span>
                </PrimaryActionButton>
              </div>

              {/* Safety HUD */}
              <SafetyHUD
                currentCeiling={session.maxAllowedIntensity || 3}
                onLowerCeiling={session.rating === 'NSFW' ? handleLowerIntensity : undefined}
                onSafePass={handleNextTurn}
              />
            </div>
          ) : (
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleDrawCard}
                className="w-full min-h-[54px] rounded-2xl bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-stone-950 font-black text-base shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>แตะสำรับเพื่อจั่วไพ่ (เหลือ {stats?.remainingCount || 52} ใบ)</span>
              </button>
            </div>
          )}
        </main>
      )}

      {/* Mini-Game Modal */}
      {activeMiniGame && (
        <MiniGameModal
          isOpen={Boolean(activeMiniGame)}
          instance={activeMiniGame}
          players={session?.players || []}
          onComplete={handleMiniGameComplete}
          onSkip={() => handleMiniGameComplete()}
        />
      )}

      {/* Rules Overview Modal */}
      {session && (
        <GameOverviewModal
          isOpen={isOverviewOpen}
          onClose={() => setIsOverviewOpen(false)}
          gameTitle="DORAEMON ARCADE"
          level={session.level}
          difficulty={session.difficulty}
          currentPhase={session.currentPhase}
          players={session.players}
          currentPlayerIndex={session.currentPlayerIndex}
          cardsDrawnCount={session.drawnCards.length}
          cardsRemainingCount={52 - session.drawnCards.length}
        />
      )}
    </div>
  );
}

export default function DoraemonGamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tabletop text-sky-400 p-8 text-center font-bold">กำลังโหลด PARTYVERSE...</div>}>
      <DoraemonGameInner />
    </Suspense>
  );
}