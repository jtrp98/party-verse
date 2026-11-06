'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Layers,
  ChevronRight,
  Crown,
  Info,
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
  INTENSITY_TO_VIBE,
  VIBE_TO_INTENSITY,
} from '@/lib/types/game';
import { GameHeader } from '@/components/design-system/GameHeader';
import { PlayerTurnBanner } from '@/components/design-system/PlayerTurnBanner';
import { PrimaryActionButton } from '@/components/design-system/PrimaryActionButton';
import { IntensityCeilingControl } from '@/components/design-system/IntensityCeilingControl';
import { BoundarySelector } from '@/components/design-system/BoundarySelector';
import { Card3D } from '@/components/game/Card3D';
import { VibeSelector } from '@/components/game/VibeSelector';
import { DifficultySelector } from '@/components/game/DifficultySelector';
import { PlayerSetupModal } from '@/components/game/PlayerSetupModal';
import { GameOverviewModal } from '@/components/game/GameOverviewModal';
import { MiniGameModal } from '@/components/game/MiniGameModal';
import { generate52CardDeck, shuffleDeck, drawNextCard, getDeckStats } from '@/lib/engine/cardEngine';
import { calculateDoraemonPhase } from '@/lib/engine/progressionEngine';
import { getNextPlayerIndex, updatePlayerStat } from '@/lib/engine/playerEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  loadSavedPlayerNames,
} from '@/lib/engine/sessionManager';
import { createNewPlayer } from '@/lib/engine/playerEngine';
import { pickNextMiniGame } from '@/lib/engine/miniGameEngine';
import { sounds } from '@/lib/sound/webAudio';

export default function DoraemonGamePage() {
  // Session State
  const [session, setSession] = useState<DoraemonSession | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentDrawnCard, setCurrentDrawnCard] = useState<PlayingCard | null>(null);

  // Modals
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(false);
  const [activeMiniGame, setActiveMiniGame] = useState<ActiveMiniGameInstance | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);

  // Setup Form State
  const [setupPlayers, setSetupPlayers] = useState<Player[]>([]);
  const [setupLevel, setSetupLevel] = useState<GameVibeLevel>('CHILL');
  const [setupDifficulty, setSetupDifficulty] = useState<GameDifficulty>('EASY');
  const [setupBoundaries, setSetupBoundaries] = useState<SessionBoundaries>({
    allowPhysical: true,
    allowAlcohol: true,
    allowExplicitTalk: true,
  });

  // Load existing session or default setup on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const existing = loadActiveSession<DoraemonSession>();
      if (existing && existing.gameId === 'doraemon' && existing.status !== 'FINISHED') {
        setSession(existing);
        setIsSetupOpen(false);
        // Restore last drawn card
        if (existing.drawnCards.length > 0) {
          const last = existing.drawnCards[existing.drawnCards.length - 1];
          setCurrentDrawnCard(last);
          setIsFlipped(true);
        }
      } else {
        const savedNames = loadSavedPlayerNames();
        setSetupPlayers(savedNames.map((name, i) => createNewPlayer(name, i)));
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

  // Start Game Handler
  const handleStartGame = () => {
    sounds.playFanfare();
    const freshDeck = shuffleDeck(generate52CardDeck(undefined, setupBoundaries));
    const ceiling = VIBE_TO_INTENSITY[setupLevel] || 1;

    const newSession: DoraemonSession = {
      gameId: 'doraemon',
      sessionId: `doraemon_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: setupPlayers,
      currentPlayerIndex: 0,
      level: setupLevel,
      difficulty: setupDifficulty,
      maxAllowedIntensity: ceiling,
      currentAllowedIntensity: ceiling,
      boundaries: setupBoundaries,
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
          summary: `เริ่มเกมโดราเอมอน เพดานความเดือด: Level ${ceiling} (${setupLevel})`,
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

    // Trigger mini-game if card triggers it
    if (card.triggersMiniGame) {
      setTimeout(() => {
        const recentMiniGameIds = session.history
          .filter((h) => h.type === 'MINI_GAME' && h.details)
          .map((h) => h.details as string);

        const miniGame = pickNextMiniGame({
          level: session.level,
          difficulty: session.difficulty,
          phase: nextPhase,
          players: updatedPlayers,
          currentPlayerIndex: session.currentPlayerIndex,
          recentMiniGameIds,
          maxAllowedIntensity: session.maxAllowedIntensity || (VIBE_TO_INTENSITY[session.level] || 1),
          boundaries: session.boundaries,
        });
        if (miniGame) {
          setActiveMiniGame(miniGame);
        }
      }, 700);
    }
  };

  // Next Turn Handler (Pass Phone)
  const handleNextTurn = () => {
    if (!session) return;
    sounds.playTurnChime();
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
      history: [
        ...session.history,
        {
          id: `log_lower_${Date.now()}`,
          timestamp: Date.now(),
          playerId: session.players[session.currentPlayerIndex]?.id || 'system',
          playerName: session.players[session.currentPlayerIndex]?.name || 'ผู้เล่น',
          type: 'RULE_TRIGGER',
          summary: `ลดระดับความเดือดลงเหลือ Level ${newCeiling} (${newVibe})`,
        },
      ],
    };
    setSession(updated);
    saveActiveSession(updated);
  };

  // Restart Handler
  const handleRestart = () => {
    if (confirm('คุณต้องการเริ่มเกมใหม่ใช่หรือไม่?')) {
      sounds.playClick();
      clearActiveSession();
      setSession(null);
      setIsSetupOpen(true);
      setIsFlipped(false);
      setCurrentDrawnCard(null);
    }
  };

  // Bathroom pass use
  const handleUseBathroomPass = (playerId: string) => {
    if (!session) return;
    sounds.playClick();
    const updated = updatePlayerStat(session.players, playerId, 'bathroomPasses', -1);
    setSession({
      ...session,
      players: updated,
      history: [
        ...session.history,
        {
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          playerId,
          playerName: session.players.find((p) => p.id === playerId)?.name || 'ผู้เล่น',
          type: 'PASS_USED',
          summary: 'ใช้บัตรเข้าห้องน้ำแล้ว 🚽',
        },
      ],
    });
  };

  const currentPlayer = session ? session.players[session.currentPlayerIndex] : null;
  const stats = session ? getDeckStats(session.deck) : null;
  const questionMaster = session?.players.find((p) => p.id === session.activeRules.questionMasterId);
  const prince = session?.players.find((p) => p.id === session.activeRules.princeId);

  return (
    <div className="min-h-screen bg-tabletop text-slate-100 flex flex-col font-sans select-none pb-12">
      <GameHeader title="DORAEMON CARD" showBack={true} backHref="/" />

      {/* ===================== GAME SETUP SCREEN ===================== */}
      {isSetupOpen && (
        <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="text-center space-y-1.5 pt-2">
            <span className="text-4xl">🃏</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
              DORAEMON CARD GAME
            </h1>
            <p className="text-sm text-zinc-400">
              ไพ่ 52 ใบแท้ กติกาไทยแท้ เล่นรอบวงเครื่องเดียว พร้อมเพดานความเดือด
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border-2 border-zinc-700 space-y-6 shadow-tactile-rest">
            <PlayerSetupModal players={setupPlayers} onPlayersChange={setSetupPlayers} />

            <div className="space-y-2">
              <VibeSelector selectedLevel={setupLevel} onSelectLevel={setSetupLevel} />
              <p className="text-xs text-amber-400/90 font-bold px-1">
                * ระดับที่เลือกคือเพดานสูงสุด เกมจะไม่สุ่มมินิเกมเกินระดับนี้
              </p>
            </div>

            <DifficultySelector
              selectedDifficulty={setupDifficulty}
              onSelectDifficulty={setSetupDifficulty}
            />

            <BoundarySelector
              boundaries={setupBoundaries}
              onChange={setSetupBoundaries}
            />

            <PrimaryActionButton
              variant="blue"
              icon={<Play className="w-5 h-5 fill-current" />}
              disabled={setupPlayers.length < 2}
              onClick={handleStartGame}
            >
              เริ่มเล่นเกมโดราเอมอน
            </PrimaryActionButton>
          </div>
        </main>
      )}

      {/* ===================== ACTIVE GAMEPLAY SCREEN ===================== */}
      {!isSetupOpen && session && (
        <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-4 flex flex-col justify-between gap-5">
          {/* Top Progress & Turn Banner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-sky-400">
                {session.currentPhase}
              </span>

              <span className="font-mono text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                จั่วแล้ว {stats?.drawnCount} / 52 ใบ
              </span>
            </div>

            {/* Deck Progress Bar */}
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${stats?.percentCompleted || 0}%` }}
              />
            </div>

            {/* Ceiling Lowering Control */}
            <IntensityCeilingControl
              currentCeiling={session.maxAllowedIntensity || (VIBE_TO_INTENSITY[session.level] || 1)}
              onLowerCeiling={handleLowerIntensity}
            />

            {/* Current Player Banner */}
            {currentPlayer && (
              <PlayerTurnBanner
                playerName={currentPlayer.name}
                avatarColor={currentPlayer.avatarColor}
                turnIndex={session.currentPlayerIndex}
                roundInfo={`ใบที่ ${session.drawnCards.length + 1} / 52`}
              />
            )}
          </div>

          {/* Center: 3D Playing Card */}
          <div className="my-auto py-2">
            <Card3D
              card={currentDrawnCard}
              isFlipped={isFlipped}
              onCardClick={!isFlipped ? handleDrawCard : undefined}
            />

            {!isFlipped ? (
              <p className="text-center text-xs sm:text-sm text-zinc-400 mt-3 animate-pulse font-bold">
                👆 แตะที่ไพ่ หรือกดปุ่มด้านล่างเพื่อจั่ว
              </p>
            ) : (
              <p className="text-center text-xs sm:text-sm text-sky-300 font-bold mt-3">
                ✨ ทำตามกติกา แล้วส่งมือถือให้คนถัดไป
              </p>
            )}
          </div>

          {/* Live J / Q / K Status Bar */}
          <div className="bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-xs sm:text-sm shadow-sm">
            <div className="flex items-center gap-2 font-black text-amber-400">
              <Crown className="w-5 h-5" />
              <span>King: {session.activeRules.kingsDrawn}/4</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              {questionMaster && (
                <span className="px-2.5 py-1 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold">
                  Q: {questionMaster.name}
                </span>
              )}
              {prince && (
                <span className="px-2.5 py-1 rounded-xl bg-blue-950/80 text-blue-300 border border-blue-500/40 font-bold">
                  J: {prince.name}
                </span>
              )}
              {!questionMaster && !prince && (
                <span className="text-zinc-500 italic">ยังไม่มีใครถือ J / Q</span>
              )}
            </div>
          </div>

          {/* Primary Action Buttons: Draw vs Next Turn */}
          <div className="space-y-3 pt-1">
            {!isFlipped ? (
              <PrimaryActionButton
                variant="blue"
                icon={<Layers className="w-5 h-5" />}
                onClick={handleDrawCard}
              >
                แตะเพื่อจั่วไพ่
              </PrimaryActionButton>
            ) : (
              <PrimaryActionButton
                variant="blue"
                icon={<ChevronRight className="w-5 h-5" />}
                onClick={handleNextTurn}
              >
                ส่งมือถือให้เพื่อน
              </PrimaryActionButton>
            )}

            <div className="flex items-center justify-between px-2 pt-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setIsOverviewOpen(true)}
                className="text-amber-400 font-bold hover:underline flex items-center gap-1 min-h-[44px]"
              >
                <Info className="w-4 h-4" />
                <span>ดูกติกาภาพรวม</span>
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="text-zinc-400 hover:text-rose-400 flex items-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>เริ่มเกมใหม่</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Overview Modal */}
      {session && (
        <GameOverviewModal
          isOpen={isOverviewOpen}
          onClose={() => setIsOverviewOpen(false)}
          gameTitle="DORAEMON"
          level={session.level}
          difficulty={session.difficulty}
          currentPhase={session.currentPhase}
          players={session.players}
          currentPlayerIndex={session.currentPlayerIndex}
          cardsDrawnCount={stats?.drawnCount}
          cardsRemainingCount={stats?.remainingCount}
          activeRules={{
            questionMasterName: questionMaster?.name,
            princeName: prince?.name,
            kingsDrawn: session.activeRules.kingsDrawn,
            activeHouseRules: session.activeRules.activeHouseRules,
          }}
          history={session.history}
          onUseBathroomPass={handleUseBathroomPass}
        />
      )}

      {/* Mini Game Modal */}
      {session && (
        <MiniGameModal
          isOpen={activeMiniGame !== null}
          instance={activeMiniGame}
          players={session.players}
          onComplete={() => {
            if (activeMiniGame) {
              setSession((prev) => {
                if (!prev) return null;
                const activePlayer = prev.players[prev.currentPlayerIndex] || prev.players[0];
                return {
                  ...prev,
                  history: [
                    ...prev.history,
                    {
                      id: `log_${Date.now()}`,
                      timestamp: Date.now(),
                      playerId: activePlayer ? activePlayer.id : 'system',
                      playerName: activePlayer ? activePlayer.name : 'มินิเกม',
                      type: 'MINI_GAME',
                      summary: `เล่นมินิเกม: ${activeMiniGame.game.title}`,
                      details: activeMiniGame.game.id,
                    },
                  ],
                };
              });
            }
            setActiveMiniGame(null);
          }}
          onSkip={() => {
            if (activeMiniGame) {
              setSession((prev) => {
                if (!prev) return null;
                const activePlayer = prev.players[prev.currentPlayerIndex] || prev.players[0];
                return {
                  ...prev,
                  history: [
                    ...prev.history,
                    {
                      id: `log_${Date.now()}`,
                      timestamp: Date.now(),
                      playerId: activePlayer ? activePlayer.id : 'system',
                      playerName: activePlayer ? activePlayer.name : 'มินิเกม',
                      type: 'MINI_GAME',
                      summary: `ข้ามมินิเกม: ${activeMiniGame.game.title}`,
                      details: activeMiniGame.game.id,
                    },
                  ],
                };
              });
            }
            setActiveMiniGame(null);
          }}
        />
      )}
    </div>
  );
}
