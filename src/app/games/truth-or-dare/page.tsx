'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Shuffle, ChevronRight, HelpCircle, Flame, Timer as TimerIcon, ShieldX, Check } from 'lucide-react';
import {
  Player,
  GameVibeLevel,
  GameDifficulty,
  TruthOrDareItem,
  TruthOrDareSession,
} from '@/lib/types/game';
import { TopBar } from '@/components/layout/TopBar';
import { PassPhoneBanner } from '@/components/layout/PassPhoneBanner';
import { PartyProgressBar } from '@/components/game/PartyProgressBar';
import { VibeSelector } from '@/components/game/VibeSelector';
import { DifficultySelector } from '@/components/game/DifficultySelector';
import { PlayerSetupModal } from '@/components/game/PlayerSetupModal';
import { RandomSuspenseModal } from '@/components/game/RandomSuspenseModal';
import { TRUTH_OR_DARE_DATABASE } from '@/lib/data/truthOrDareData';
import { calculateRoundPhase } from '@/lib/engine/progressionEngine';
import { getNextPlayerIndex, createNewPlayer } from '@/lib/engine/playerEngine';
import { selectNextTruthOrDare } from '@/lib/engine/challengeSelectionEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  loadSavedPlayerNames,
} from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';

export default function TruthOrDarePage() {
  const [session, setSession] = useState<TruthOrDareSession | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState<boolean>(false);
  const [randomTargetType, setRandomTargetType] = useState<'TRUTH' | 'DARE'>('TRUTH');
  const [pendingRandomItem, setPendingRandomItem] = useState<TruthOrDareItem | null>(null);

  // Setup Form
  const [setupPlayers, setSetupPlayers] = useState<Player[]>([]);
  const [setupLevel, setSetupLevel] = useState<GameVibeLevel>('CHILL');
  const [setupDifficulty, setSetupDifficulty] = useState<GameDifficulty>('EASY');
  const [setupRounds, setSetupRounds] = useState<number>(12);

  // In-turn State
  const [activeItem, setActiveItem] = useState<TruthOrDareItem | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Mount logic
  useEffect(() => {
    const timer = setTimeout(() => {
      const existing = loadActiveSession<TruthOrDareSession>();
      if (existing && existing.gameId === 'truth-or-dare' && existing.status !== 'FINISHED') {
        setSession(existing);
        setIsSetupOpen(false);
        if (existing.currentItem) {
          setActiveItem(existing.currentItem);
        }
      } else {
        const savedNames = loadSavedPlayerNames();
        setSetupPlayers(savedNames.map((name, i) => createNewPlayer(name, i)));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save session sync
  useEffect(() => {
    if (session) {
      saveActiveSession(session);
    }
  }, [session]);

  // Timer Tick with Heartbeat
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerActive && countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerActive(false);
            sounds.playBuzzer();
            return 0;
          }
          if (prev <= 4) {
            sounds.playHeartbeat();
          } else {
            sounds.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, countdown]);

  // Start Game
  const handleStartGame = () => {
    sounds.playFanfare();
    const newSession: TruthOrDareSession = {
      gameId: 'truth-or-dare',
      sessionId: `tod_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: setupPlayers,
      currentPlayerIndex: 0,
      level: setupLevel,
      difficulty: setupDifficulty,
      currentPhase: 'WARM_UP',
      status: 'PLAYING',
      currentRound: 1,
      totalRounds: setupRounds,
      completedItems: [],
      history: [
        {
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          playerId: setupPlayers[0].id,
          playerName: setupPlayers[0].name,
          type: 'TRUTH_DARE',
          summary: `เริ่มเกม Truth or Dare จำนวน ${setupRounds} รอบ Vibe: ${setupLevel}`,
        },
      ],
    };

    setSession(newSession);
    setIsSetupOpen(false);
    setActiveItem(null);
  };

  // Handle Random Button with Wheel/Shuffler Gimmick
  const handleStartRandom = () => {
    if (!session) return;
    const actualType: 'TRUTH' | 'DARE' = Math.random() > 0.5 ? 'TRUTH' : 'DARE';
    const currentPlayer = session.players[session.currentPlayerIndex];

    const selection = selectNextTruthOrDare({
      database: TRUTH_OR_DARE_DATABASE,
      completedItemIds: session.completedItems,
      type: actualType,
      level: session.level,
      difficulty: session.difficulty,
      phase: session.currentPhase,
      lastCategory: activeItem?.category,
      currentPlayer,
      allPlayers: session.players,
    });

    if (!selection) return;

    setRandomTargetType(actualType);
    setPendingRandomItem(selection.item);
    setIsRandomModalOpen(true);
  };

  const handleRandomComplete = () => {
    setIsRandomModalOpen(false);
    if (!session || !pendingRandomItem) return;

    sounds.playCardFlip();
    setActiveItem(pendingRandomItem);

    if (pendingRandomItem.timerSeconds) {
      setCountdown(pendingRandomItem.timerSeconds);
      setIsTimerActive(true);
    } else {
      setCountdown(null);
      setIsTimerActive(false);
    }

    setSession({
      ...session,
      currentItem: pendingRandomItem,
      completedItems: [...session.completedItems, pendingRandomItem.id],
    });
    setPendingRandomItem(null);
  };

  // Select Truth or Dare manually
  const handleChooseType = (type: 'TRUTH' | 'DARE') => {
    if (!session) return;
    sounds.playSuspenseRiser();

    const currentPlayer = session.players[session.currentPlayerIndex];
    const selection = selectNextTruthOrDare({
      database: TRUTH_OR_DARE_DATABASE,
      completedItemIds: session.completedItems,
      type,
      level: session.level,
      difficulty: session.difficulty,
      phase: session.currentPhase,
      lastCategory: activeItem?.category,
      currentPlayer,
      allPlayers: session.players,
    });

    if (!selection) return;

    setTimeout(() => {
      sounds.playCardFlip();
      setActiveItem(selection.item);

      if (selection.item.timerSeconds) {
        setCountdown(selection.item.timerSeconds);
        setIsTimerActive(true);
      } else {
        setCountdown(null);
        setIsTimerActive(false);
      }

      setSession({
        ...session,
        currentItem: selection.item,
        completedItems: selection.updatedCompletedIds,
      });
    }, 300);
  };

  // Next Turn
  const handleNextTurn = () => {
    if (!session) return;
    sounds.playTurnChime();

    const nextRound = session.currentRound + 1;
    if (nextRound > session.totalRounds) {
      // Game Finished!
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      sounds.playFanfare();
      setSession({
        ...session,
        status: 'FINISHED',
      });
      return;
    }

    const nextPhase = calculateRoundPhase(nextRound, session.totalRounds);
    const nextPlayerIdx = getNextPlayerIndex(session.currentPlayerIndex, session.players.length);

    setSession({
      ...session,
      currentRound: nextRound,
      currentPhase: nextPhase,
      currentPlayerIndex: nextPlayerIdx,
      currentItem: undefined,
    });

    setActiveItem(null);
    setCountdown(null);
    setIsTimerActive(false);
  };

  // Restart
  const handleRestart = () => {
    if (confirm('คุณต้องการเริ่มเกมใหม่ใช่หรือไม่?')) {
      sounds.playClick();
      clearActiveSession();
      setSession(null);
      setIsSetupOpen(true);
      setActiveItem(null);
    }
  };

  const currentPlayer = session ? session.players[session.currentPlayerIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-8">
      <TopBar
        showBack={true}
        backHref="/"
        title="TRUTH OR DARE"
        activePlayerName={currentPlayer ? currentPlayer.name : undefined}
      />

      {/* ===================== SETUP SCREEN ===================== */}
      {isSetupOpen && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-5">
          <div className="text-center space-y-1.5 pt-2">
            <span className="text-3xl">🎭</span>
            <h1 className="text-xl font-black tracking-widest text-white uppercase">
              TRUTH OR DARE
            </h1>
            <p className="text-xs text-zinc-400">
              จริงหรือกล้า ปรับตามความสนิท 5 ระดับ พร้อมสุ่มเป้าหมายสร้างสรรค์ในวง
            </p>
          </div>

          <PlayerSetupModal players={setupPlayers} onPlayersChange={setSetupPlayers} />

          <VibeSelector selectedLevel={setupLevel} onSelectLevel={setSetupLevel} />

          <DifficultySelector
            selectedDifficulty={setupDifficulty}
            onSelectDifficulty={setSetupDifficulty}
          />

          {/* Round Selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-zinc-300">จำนวนรอบการเล่น</label>
              <span className="font-mono font-bold text-amber-400 text-xs">
                {setupRounds} รอบ
              </span>
            </div>
            <div className="flex gap-2">
              {[8, 12, 16, 20].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSetupRounds(r);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    setupRounds === r
                      ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-950/40'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {r} รอบ
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            disabled={setupPlayers.length < 2}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl shadow-amber-950/40 disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            <span>เริ่มเกม Truth or Dare</span>
          </button>
        </main>
      )}

      {/* ===================== GAMEPLAY SCREEN ===================== */}
      {!isSetupOpen && session && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col justify-between gap-4">
          {/* Top Progress & Banner */}
          <div className="space-y-3">
            <PartyProgressBar
              currentPhase={session.currentPhase}
              progressPercent={Math.round((session.currentRound / session.totalRounds) * 100)}
              label={`รอบที่ ${session.currentRound} / ${session.totalRounds}`}
              cleanMode={true}
            />

            {currentPlayer && (
              <PassPhoneBanner player={currentPlayer} turnNumber={session.currentRound} />
            )}
          </div>

          {/* Center Card Action */}
          <div className="my-auto py-2">
            {!activeItem ? (
              /* Choose Truth, Dare, or Random */
              <div className="space-y-3">
                <p className="text-center text-xs font-bold text-zinc-400 mb-2">
                  เลือกความท้าทายในตานี้:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChooseType('TRUTH')}
                    className="p-5 rounded-3xl bg-zinc-900 border-2 border-zinc-700 hover:border-amber-400 text-center flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-amber-400 flex items-center justify-center text-2xl border border-zinc-800">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-zinc-100">TRUTH</h3>
                      <p className="text-[11px] text-zinc-400">ตอบความจริงจากใจ</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleChooseType('DARE')}
                    className="p-5 rounded-3xl bg-zinc-900 border-2 border-zinc-700 hover:border-rose-400 text-center flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-rose-400 flex items-center justify-center text-2xl border border-zinc-800">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-zinc-100">DARE</h3>
                      <p className="text-[11px] text-zinc-400">ทำภารกิจสุดท้าทาย</p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleStartRandom}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-rose-500/10 border-2 border-zinc-800 hover:border-amber-400/60 text-zinc-200 font-black text-xs flex items-center justify-center gap-2.5 active:scale-98 transition-all shadow-xl group"
                >
                  <Shuffle className="w-4 h-4 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="tracking-wide">สุ่ม (RANDOM TRUTH OR DARE)</span>
                </button>
              </div>
            ) : (
              /* Display Active Question / Dare */
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wider ${
                        activeItem.type === 'TRUTH'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {activeItem.type === 'TRUTH' ? '❓ TRUTH (ความจริง)' : '🔥 DARE (ท้าทาย)'}
                    </span>

                    {activeItem.category && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {activeItem.category === 'CONFESSION' && '🤫 สารภาพความลับ'}
                        {activeItem.category === 'WHO_LIKELY' && '👉 ใครมีแววสุด'}
                        {activeItem.category === 'SOCIAL_DARE' && '⚡ ภารกิจในวง'}
                        {activeItem.category === 'SPEED_CHALLENGE' && '⏱️ ประลองความไว'}
                        {activeItem.category === 'ACTING' && '🎭 การแสดง'}
                        {activeItem.category === 'MEMORY' && '🧠 ความทรงจำ'}
                        {activeItem.category === 'TEAM_CHALLENGE' && '🤝 ร่วมมือกัน'}
                        {activeItem.category === 'COMPETITION' && '⚔️ ดวลตัวต่อตัว'}
                        {activeItem.category === 'RELATIONSHIP' && '💖 ความรัก'}
                        {activeItem.category === 'WILDCARD' && '🎲 กฎพิเศษ'}
                      </span>
                    )}

                    {activeItem.requiresConsent && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        🤝 ยินยอมทั้งสองฝ่าย
                      </span>
                    )}
                  </div>

                  {countdown !== null && (
                    <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                      <TimerIcon className="w-3.5 h-3.5 animate-pulse" />
                      <span>{countdown}s</span>
                    </div>
                  )}
                </div>

                <div className="py-2 text-center">
                  <p className="text-base sm:text-lg font-black text-white leading-relaxed">
                    &ldquo;{activeItem.text}&rdquo;
                  </p>
                </div>

                {/* Alternative Drink / Penalty */}
                {activeItem.drinkAlternative && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-300 text-xs font-semibold text-center">
                    🍺 ทางเลือก: {activeItem.drinkAlternative}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="space-y-2">
            {activeItem && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    handleChooseType(activeItem.type);
                  }}
                  className="py-3.5 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                >
                  <ShieldX className="w-3.5 h-3.5 text-zinc-400" />
                  <span>เปลี่ยนข้อ</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="flex-1 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-lg shadow-amber-950/40"
                >
                  <Check className="w-4 h-4" />
                  <span>ทำเสร็จแล้ว (ส่งต่อ)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-center px-2 pt-2 text-[11px] text-zinc-500 font-bold">
              <button
                type="button"
                onClick={handleRestart}
                className="hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>เริ่มเกมใหม่</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ===================== RANDOM SUSPENSE MODAL ===================== */}
      <RandomSuspenseModal
        isOpen={isRandomModalOpen}
        targetType={randomTargetType}
        onComplete={handleRandomComplete}
        onClose={() => setIsRandomModalOpen(false)}
      />
    </div>
  );
}
