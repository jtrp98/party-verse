'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Timer as TimerIcon,
  Check,
  X,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { CoupleLevel, CoupleItem, CoupleSession } from '@/lib/types/game';
import { COUPLE_DATABASE } from '@/lib/data/coupleData';
import { selectNextCoupleChallenge } from '@/lib/engine/challengeSelectionEngine';
import { calculateRoundPhase } from '@/lib/engine/progressionEngine';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
} from '@/lib/engine/sessionManager';
import { sounds } from '@/lib/sound/webAudio';

export default function CoupleGamePage() {
  // Game Setup State
  const [partnerA, setPartnerA] = useState('ที่รัก');
  const [partnerB, setPartnerB] = useState('ตัวเอง');
  const [selectedLevel, setSelectedLevel] = useState<CoupleLevel>('SPICY');
  const [totalRounds, setTotalRounds] = useState(12);
  const [isSetup, setIsSetup] = useState(true);

  // Gameplay State
  const [currentRound, setCurrentRound] = useState(1);
  const [syncMatches, setSyncMatches] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<CoupleItem | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSyncCountingDown, setIsSyncCountingDown] = useState(false);
  const [syncCount, setSyncCount] = useState(3);
  const [isDoubleDare, setIsDoubleDare] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mount logic: Load existing session if present
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(sounds.getIsMuted());

      const existing = loadActiveSession<CoupleSession>();
      if (existing && existing.gameId === 'couples' && existing.status !== 'FINISHED') {
        setPartnerA(existing.partnerAName || 'ที่รัก');
        setPartnerB(existing.partnerBName || 'ตัวเอง');
        setSelectedLevel(existing.coupleLevel || 'SPICY');
        setTotalRounds(existing.totalRounds || 12);
        setCurrentRound(existing.currentRound || 1);
        setSyncMatches(existing.syncMatches || 0);
        setSyncTotal(existing.syncTotal || 0);
        setCompletedItems(existing.completedItems || []);
        if (existing.currentItem) {
          setCurrentItem(existing.currentItem);
        }
        setIsSetup(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save session sync to localStorage
  useEffect(() => {
    if (!isSetup) {
      const session: CoupleSession = {
        gameId: 'couples',
        sessionId: 'couple_session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        players: [
          {
            id: 'partner_a',
            name: partnerA,
            avatarColor: 'bg-rose-500 text-rose-950 border-rose-300',
            stats: { drinksDrunk: 0, miniGamesWon: 0, jCards: 0, qCards: 0, kCards: 0, bathroomPasses: 0, activeBuffs: [] },
          },
          {
            id: 'partner_b',
            name: partnerB,
            avatarColor: 'bg-amber-500 text-amber-950 border-amber-300',
            stats: { drinksDrunk: 0, miniGamesWon: 0, jCards: 0, qCards: 0, kCards: 0, bathroomPasses: 0, activeBuffs: [] },
          },
        ],
        currentPlayerIndex: currentRound % 2 === 1 ? 0 : 1,
        level: selectedLevel === 'SWEET' ? 'CHILL' : selectedLevel === 'SPICY' ? 'SPICY' : 'UNLEASHED',
        difficulty: 'EASY',
        currentPhase: calculateRoundPhase(currentRound, totalRounds),
        status: isGameOver ? 'FINISHED' : 'PLAYING',
        history: [],
        coupleLevel: selectedLevel,
        partnerAName: partnerA,
        partnerBName: partnerB,
        currentRound,
        totalRounds,
        syncMatches,
        syncTotal,
        completedItems,
        currentItem: currentItem || undefined,
      };
      saveActiveSession(session);
    }
  }, [
    isSetup,
    partnerA,
    partnerB,
    selectedLevel,
    currentRound,
    totalRounds,
    syncMatches,
    syncTotal,
    completedItems,
    currentItem,
    isGameOver,
  ]);

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

  // Sync Countdown 3.. 2.. 1.. GO!
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    if (isSyncCountingDown) {
      sounds.playHeartbeat();
      syncInterval = setInterval(() => {
        setSyncCount((prev) => {
          if (prev <= 1) {
            setIsSyncCountingDown(false);
            sounds.playImpactSlam();
            return 0;
          }
          sounds.playHeartbeat();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(syncInterval);
  }, [isSyncCountingDown]);

  // Start Couple Game
  const handleStartGame = () => {
    sounds.playFanfare();
    setIsSetup(false);
    setCurrentRound(1);
    setSyncMatches(0);
    setSyncTotal(0);
    setCompletedItems([]);
    setIsGameOver(false);
    drawNextCard(1, []);
  };

  // Draw Next Item with Smart Selection Engine
  const drawNextCard = (round: number, currentCompleted: string[] = completedItems) => {
    sounds.playSuspenseRiser();
    setIsDoubleDare(false);
    setIsSyncCountingDown(false);
    setSyncCount(3);

    const selection = selectNextCoupleChallenge({
      database: COUPLE_DATABASE,
      completedItemIds: currentCompleted,
      level: selectedLevel,
      partnerAName: partnerA,
      partnerBName: partnerB,
      phase: calculateRoundPhase(round, totalRounds),
      lastCategory: currentItem?.category,
    });

    if (!selection) return;

    setTimeout(() => {
      sounds.playCardFlip();
      setCurrentItem(selection.item);
      setCompletedItems(selection.updatedCompletedIds);

      if (selection.item.type === 'SYNC') {
        setSyncTotal((prev) => prev + 1);
        setIsSyncCountingDown(true);
        setSyncCount(3);
        setCountdown(null);
        setIsTimerRunning(false);
      } else if (selection.item.timerSeconds) {
        setCountdown(selection.item.timerSeconds);
        setIsTimerRunning(true);
      } else {
        setCountdown(null);
        setIsTimerRunning(false);
      }
    }, 400);
  };

  // Next Round
  const handleNextTurn = () => {
    sounds.playTurnChime();
    const nextRound = currentRound + 1;
    if (nextRound > totalRounds) {
      // Game Finish
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
      sounds.playFanfare();
      setIsGameOver(true);
      return;
    }
    setCurrentRound(nextRound);
    drawNextCard(nextRound, completedItems);
  };

  // Sync Result Decision
  const handleSyncDecision = (matched: boolean) => {
    sounds.playClick();
    if (matched) {
      sounds.playFanfare();
      confetti({ particleCount: 60, spread: 60 });
      setSyncMatches((prev) => prev + 1);
    } else {
      sounds.playBuzzer();
    }
    setTimeout(() => {
      handleNextTurn();
    }, 500);
  };

  const handleRestart = () => {
    if (confirm('คุณต้องการเริ่มเกมใหม่ใช่หรือไม่?')) {
      sounds.playClick();
      clearActiveSession();
      setIsSetup(true);
      setIsGameOver(false);
      setCurrentItem(null);
      setCompletedItems([]);
    }
  };

  const currentTurnPartner = currentRound % 2 === 1 ? partnerA : partnerB;
  const matchPercentage = syncTotal > 0 ? Math.round((syncMatches / syncTotal) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-10">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-xl">💑</span>
            <span className="font-black text-sm tracking-widest text-zinc-100 uppercase">
              COUPLE CHALLENGE
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            const next = sounds.toggleMute();
            setIsMuted(next);
            if (!next) sounds.playClick();
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white active:scale-95"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </header>

      {/* ================= SETUP SCREEN ================= */}
      {isSetup && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-5">
          <div className="text-center space-y-1.5 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>โหมดคู่รัก & วัดใจ 2 คน</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              COUPLE CHALLENGE
            </h1>
            <p className="text-xs text-zinc-400">
              เกมวัดใจ ทายใจเรื่องบนเตียง และภารกิจสกินชิพสำหรับสองคน
            </p>
          </div>

          {/* Names Inputs */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 space-y-3 shadow-xl">
            <label className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>ชื่อเล่นของทั้งคู่</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">คนที่ 1</span>
                <input
                  type="text"
                  value={partnerA}
                  onChange={(e) => setPartnerA(e.target.value)}
                  placeholder="ที่รัก"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">คนที่ 2</span>
                <input
                  type="text"
                  value={partnerB}
                  onChange={(e) => setPartnerB(e.target.value)}
                  placeholder="ตัวเอง"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 pt-1">
              {[
                ['ที่รัก', 'ตัวเอง'],
                ['เค้า', 'เธอ'],
                ['คนสวย', 'สุดหล่อ'],
              ].map(([a, b]) => (
                <button
                  key={`${a}-${b}`}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setPartnerA(a);
                    setPartnerB(b);
                  }}
                  className="flex-1 py-1 rounded-xl bg-zinc-800 text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 active:scale-95"
                >
                  {a} & {b}
                </button>
              ))}
            </div>
          </div>

          {/* Level Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-300 px-1">
              เลือกระดับความเร้าใจ
            </label>

            <div className="space-y-2">
              {[
                {
                  id: 'SWEET' as CoupleLevel,
                  icon: '💖',
                  title: 'SWEET (หวานกรุบ & ทายใจเคมี)',
                  desc: 'วัดใจความเข้ากัน สบตา กระซิบคำหวาน นวดผ่อนคลาย เหมาะกับคนคุยและแฟน',
                  color: 'border-rose-400 text-rose-300',
                },
                {
                  id: 'SPICY' as CoupleLevel,
                  icon: '🔥',
                  title: 'SPICY (ร้อนแรง & สกินชิพใกล้ชิด 18+)',
                  desc: 'ซุกไซ้ซอกคอ ปลดกระดุม จูบดูดดื่ม และคำถามจุดเสียวที่ทำให้ใจสั่น',
                  color: 'border-amber-400 text-amber-300',
                },
                {
                  id: 'WILD' as CoupleLevel,
                  icon: '😈',
                  title: 'WILD (เปิดอกเรื่องบนเตียง & ฟินสองต่อสอง 20+)',
                  desc: 'ทายใจพฤติกรรมบนเตียง ท่าโปรด Dirty Talk สัมผัสใต้ร่มผ้า และถอดเสื้อผ้า 1 ชิ้น',
                  color: 'border-purple-400 text-purple-300',
                },
              ].map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedLevel(lvl.id);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                      isSelected
                        ? `bg-zinc-900 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40`
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{lvl.icon}</span>
                      <div>
                        <h4 className="text-xs font-black text-white">{lvl.title}</h4>
                        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{lvl.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rounds */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex items-center justify-between">
            <span className="text-xs font-black text-zinc-300">จำนวนรอบการเล่น:</span>
            <div className="flex gap-1.5">
              {[8, 12, 16].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setTotalRounds(r);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    totalRounds === r
                      ? 'bg-rose-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {r} รอบ
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/50 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>เริ่มเกม Couple Challenge</span>
          </button>
        </main>
      )}

      {/* ================= GAMEPLAY SCREEN ================= */}
      {!isSetup && !isGameOver && currentItem && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col justify-between gap-4">
          {/* Top Progress & Turn Banner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-black text-zinc-400">
              <span>รอบที่ {currentRound} / {totalRounds}</span>
              <span className="text-rose-400 flex items-center gap-1 font-mono">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                เคมีตรงกัน {matchPercentage}% ({syncMatches}/{syncTotal})
              </span>
            </div>

            {/* Turn Banner */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-xs font-black text-white">
                  {currentItem.type === 'SYNC' ? '💑' : currentTurnPartner.slice(0, 2)}
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    {currentItem.type === 'SYNC' ? 'โหมดวัดใจพร้อมกัน' : 'ตาของคนนี้:'}
                  </span>
                  <h3 className="text-sm font-black text-white">
                    {currentItem.type === 'SYNC' ? `${partnerA} & ${partnerB}` : currentTurnPartner}
                  </h3>
                </div>
              </div>

              {countdown !== null && (
                <div className="flex items-center gap-1.5 font-mono font-black text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                  <TimerIcon className="w-3.5 h-3.5 animate-pulse" />
                  <span>{countdown}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Card */}
          <div className="my-auto py-2">
            <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-slate-950 border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
              {/* Type Badge & Category */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wider flex items-center gap-1 ${
                      currentItem.type === 'SYNC'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : currentItem.type === 'TRUTH'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {currentItem.type === 'SYNC' && '⚡ SYNC 3-2-1 วัดใจ'}
                    {currentItem.type === 'TRUTH' && '❓ DEEP TRUTH เปิดใจ'}
                    {currentItem.type === 'DARE' && '🔥 SPICY DARE ภารกิจรัก'}
                  </span>

                  {currentItem.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {currentItem.category === 'MEMORIES' && '📖 ความทรงจำ'}
                      {currentItem.category === 'HABITS' && '🧸 นิสัยน่ารัก'}
                      {currentItem.category === 'COMPATIBILITY' && '🎯 ความเข้ากัน'}
                      {currentItem.category === 'ROMANCE' && '💖 โรแมนติก'}
                      {currentItem.category === 'INTIMACY' && '💋 สกินชิพ'}
                      {currentItem.category === 'SPICY_SECRETS' && '🔥 ความลับแซ่บ'}
                      {currentItem.category === 'PLAYFUL_CHALLENGE' && '🎲 ท้าทาย'}
                    </span>
                  )}

                  {currentItem.requiresConsent && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      🤝 ยินยอมทั้งสองฝ่าย
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-zinc-500 font-bold uppercase">
                  {selectedLevel}
                </span>
              </div>

              {/* Title & Prompt */}
              <div className="text-center py-2 space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 tracking-wider">
                  {currentItem.title}
                </h4>
                <p className="text-lg font-black text-white leading-relaxed">
                  &ldquo;{currentItem.text}&rdquo;
                </p>
              </div>

              {/* Sync Countdown Overlay (3.. 2.. 1.. GO!) */}
              {currentItem.type === 'SYNC' && isSyncCountingDown && (
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/40 text-center space-y-1 animate-pulse">
                  <p className="text-xs text-amber-400 font-bold">เตรียมนับแล้วตอบพร้อมกัน!</p>
                  <span className="text-4xl font-black text-white font-mono">{syncCount}</span>
                </div>
              )}

              {/* Options for SYNC */}
              {currentItem.type === 'SYNC' && currentItem.options && !isSyncCountingDown && (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-amber-300">
                    A: {currentItem.options[0]}
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-rose-300">
                    B: {currentItem.options[1]}
                  </div>
                </div>
              )}

              {/* Penalty Text */}
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs font-medium text-zinc-300 text-center leading-relaxed">
                ⚡ <span className="text-rose-400 font-bold">บทลงโทษ:</span> {currentItem.penaltyText}
              </div>

              {/* Double Dare Button */}
              {!isDoubleDare && currentItem.type === 'DARE' && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playImpactSlam();
                    setIsDoubleDare(true);
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  <span>เดิมพันคูณ 2 (DOUBLE OR DARE)</span>
                </button>
              )}

              {isDoubleDare && (
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black text-center animate-bounce">
                  🔥 เดิมพันคูณ 2 ทำภารกิจเร่าร้อน 2 เท่า หรือดื่ม 2 ช็อต!
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-2">
            {currentItem.type === 'SYNC' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSyncDecision(true)}
                  className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-950"
                >
                  <Check className="w-4 h-4" />
                  <span>ใจตรงกัน! (+1 แต้ม)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSyncDecision(false)}
                  className="py-3.5 rounded-2xl bg-zinc-900 border border-rose-500/50 text-rose-300 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>ไม่ตรง (โดนทำโทษ)</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNextTurn}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-sm flex items-center justify-center gap-1.5 active:scale-98 shadow-xl shadow-rose-950"
              >
                <Check className="w-4 h-4" />
                <span>ทำเสร็จแล้ว (ข้อถัดไป)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex justify-between px-2 pt-1 text-[11px] text-zinc-500 font-bold">
              <button
                type="button"
                onClick={() => drawNextCard(currentRound, completedItems)}
                className="hover:text-zinc-300"
              >
                ข้าม / เปลี่ยนคำถาม
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="hover:text-rose-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>เริ่มเกมใหม่</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= GAME OVER SCREEN ================= */}
      {isGameOver && (
        <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-4xl shadow-2xl shadow-rose-950">
            💖
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white">จบรอบ Couple Challenge!</h2>
            <p className="text-xs text-zinc-400">
              ผลการวัดใจและเคมีความเข้ากันของ {partnerA} & {partnerB}
            </p>
          </div>

          {/* Score Card */}
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <div className="text-center">
              <span className="text-4xl font-black text-rose-400 font-mono">
                {matchPercentage}%
              </span>
              <p className="text-xs font-bold text-zinc-400 mt-1">
                เคมีตรงกัน {syncMatches} จาก {syncTotal} คำถามวัดใจ
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 font-medium leading-relaxed">
              {matchPercentage >= 75
                ? '🔥 เคมีสุดเร่าร้อน! คุณทั้งสองรู้ใจกันดีเยี่ยม และมีสายสัมพันธ์ที่ลึกซึ้งน่าอิจฉาที่สุดในค่ำคืนนี้'
                : matchPercentage >= 40
                ? '💋 คู่รักขี้แกล้ง! ถึงจะมีเรื่องที่คิดไม่เหมือนกันบ้าง แต่ความเร่าร้อนและสกินชิพไม่มีแผ่วแน่นอน'
                : '😈 คู่กัดเสน่ห์แรง! ยิ่งเถียงยิ่งรัก คืนนี้ต้องมีบทลงโทษสกินชิพให้สาแก่ใจแล้วล่ะ!'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เล่นใหม่อีกรอบ</span>
          </button>
        </main>
      )}
    </div>
  );
}
