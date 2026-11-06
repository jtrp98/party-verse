'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Layers, ChevronRight, Crown } from 'lucide-react';
import {
  Player,
  GameVibeLevel,
  GameDifficulty,
  PlayingCard,
  DoraemonSession,
  ActiveMiniGameInstance,
} from '@/lib/types/game';
import { TopBar } from '@/components/layout/TopBar';
import { PassPhoneBanner } from '@/components/layout/PassPhoneBanner';
import { PartyProgressBar } from '@/components/game/PartyProgressBar';
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
        // Initialize with saved or default players
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
    const freshDeck = shuffleDeck(generate52CardDeck());
    const newSession: DoraemonSession = {
      gameId: 'doraemon',
      sessionId: `doraemon_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: setupPlayers,
      currentPlayerIndex: 0,
      level: setupLevel,
      difficulty: setupDifficulty,
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
          summary: `เริ่มเกมโดราเอมอน Vibe: ${setupLevel}`,
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
      // Deck empty -> Finished
      sounds.playFanfare();
      setSession({ ...session, status: 'FINISHED' });
      return;
    }

    // Flip card with sound
    setTimeout(() => {
      if (card.rank === 'K') {
        sounds.playImpactSlam();
      } else {
        sounds.playCardFlip();
      }
      setIsFlipped(true);
    }, 150);

    setCurrentDrawnCard(card);

    // Calculate progression phase
    const newDrawnList = [...session.drawnCards, card];
    const nextPhase = calculateDoraemonPhase(newDrawnList.length, 52);

    // Update Player & Active Rules Tracking (J / Q / K / Toilet)
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
        // 4th King Finale celebration!
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

    // Check if triggers mini-game
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

  // End Game / Restart
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-8">
      <TopBar
        showBack={true}
        backHref="/"
        title="DORAEMON"
        activePlayerName={currentPlayer ? currentPlayer.name : undefined}
        onOverviewClick={session ? () => setIsOverviewOpen(true) : undefined}
      />

      {/* ===================== GAME SETUP SCREEN ===================== */}
      {isSetupOpen && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-5">
          <div className="text-center space-y-1.5 pt-2">
            <span className="text-3xl">🍻</span>
            <h1 className="text-xl font-black tracking-widest text-white uppercase">
              DORAEMON CARD GAME
            </h1>
            <p className="text-xs text-zinc-400">
              ไพ่โดราเอมอน 52 ใบแท้ กติกาไทยแท้ เล่นรอบวงเครื่องเดียว
            </p>
          </div>

          <PlayerSetupModal players={setupPlayers} onPlayersChange={setSetupPlayers} />

          <VibeSelector selectedLevel={setupLevel} onSelectLevel={setSetupLevel} />

          <DifficultySelector
            selectedDifficulty={setupDifficulty}
            onSelectDifficulty={setSetupDifficulty}
          />

          <button
            type="button"
            onClick={handleStartGame}
            disabled={setupPlayers.length < 2}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl shadow-amber-950/40 disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            <span>เริ่มเล่นเกมโดราเอมอน</span>
          </button>
        </main>
      )}

      {/* ===================== ACTIVE GAMEPLAY SCREEN ===================== */}
      {!isSetupOpen && session && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col justify-between gap-4">
          {/* Top Progress & Turn Banner */}
          <div className="space-y-3">
            <PartyProgressBar
              currentPhase={session.currentPhase}
              progressPercent={stats?.percentCompleted || 0}
              label={`จั่วแล้ว ${stats?.drawnCount}/52 ใบ`}
            />

            {currentPlayer && (
              <PassPhoneBanner player={currentPlayer} turnNumber={session.drawnCards.length + 1} />
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
              <p className="text-center text-xs text-slate-400 mt-3 animate-pulse">
                👆 แตะที่ไพ่ หรือกดปุ่มด้านล่างเพื่อจั่ว
              </p>
            ) : (
              <p className="text-center text-xs text-cyan-400 font-bold mt-3">
                ✨ อ่านกติกา ทำตามคำสั่ง แล้วส่งต่อให้เพื่อนคนถัดไป
              </p>
            )}
          </div>

          {/* Live J / Q / K Status Bar */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">King: {session.activeRules.kingsDrawn}/4</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              {questionMaster && (
                <span className="px-2 py-0.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/40 font-bold">
                  Q: {questionMaster.name}
                </span>
              )}
              {prince && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-500/40 font-bold">
                  J: {prince.name}
                </span>
              )}
              {!questionMaster && !prince && (
                <span className="text-slate-500 italic">ยังไม่มีใครถือ J / Q</span>
              )}
            </div>
          </div>

          {/* Action Buttons: Draw vs Next Turn */}
          <div className="space-y-2">
            {!isFlipped ? (
              <button
                type="button"
                onClick={handleDrawCard}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl shadow-orange-950/50"
              >
                <Layers className="w-5 h-5" />
                <span>จั่วไพ่ (DRAW CARD)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextTurn}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 font-black text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl shadow-cyan-950/50"
              >
                <span>ส่งต่อให้เพื่อนคนถัดไป</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setIsOverviewOpen(true)}
                className="text-purple-400 font-bold hover:underline"
              >
                ดูสถานะภาพรวม (Overview)
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="text-slate-500 hover:text-rose-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>เริ่มเกมใหม่</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ===================== OVERVIEW MODAL ===================== */}
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

      {/* ===================== MINI GAME MODAL ===================== */}
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
