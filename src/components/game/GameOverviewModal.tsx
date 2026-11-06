'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, ScrollText, Users, Layers, ShieldCheck } from 'lucide-react';
import {
  Player,
  GameVibeLevel,
  GameDifficulty,
  ProgressionPhase,
  GameEventLog,
} from '@/lib/types/game';
import { PHASE_CONFIG } from '@/lib/engine/progressionEngine';
import { sounds } from '@/lib/sound/webAudio';

interface GameOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  currentPhase: ProgressionPhase;
  players: Player[];
  currentPlayerIndex: number;
  cardsDrawnCount?: number;
  cardsRemainingCount?: number;
  activeRules?: {
    questionMasterName?: string;
    princeName?: string;
    kingsDrawn?: number;
    activeHouseRules?: string[];
  };
  history?: GameEventLog[];
  onUseBathroomPass?: (playerId: string) => void;
}

export const GameOverviewModal: React.FC<GameOverviewModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  level,
  difficulty,
  currentPhase,
  players,
  currentPlayerIndex,
  cardsDrawnCount,
  cardsRemainingCount,
  activeRules,
  history = [],
  onUseBathroomPass,
}) => {
  if (!isOpen) return null;

  const currentPlayer = players[currentPlayerIndex];
  const phaseInfo = PHASE_CONFIG[currentPhase];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="font-black text-base tracking-wide text-white">
                  {gameTitle} — OVERVIEW
                </h3>
                <p className="text-xs text-slate-400">ภาพรวมสถานะเกมและคะแนนสด</p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors active:scale-95"
              aria-label="ปิด Overview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">VIBE</span>
                <span className="font-black text-cyan-400 text-xs">{level}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">DIFFICULTY</span>
                <span className="font-black text-amber-400 text-xs">{difficulty}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ตาปัจจุบัน</span>
                <span className="font-black text-white text-xs truncate block">
                  {currentPlayer?.name || '-'}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ความคืบหน้า</span>
                <span className="font-black text-purple-400 text-xs">{phaseInfo.badge}</span>
              </div>
            </div>

            {/* Cards Left / Drawn (If Card Game) */}
            {cardsDrawnCount !== undefined && cardsRemainingCount !== undefined && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300 font-bold">สำรับไพ่โดราเอมอน:</span>
                </div>
                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-emerald-400">จั่วแล้ว: {cardsDrawnCount} ใบ</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-cyan-400">เหลือ: {cardsRemainingCount} ใบ</span>
                </div>
              </div>
            )}

            {/* PLAYER TRACKER TABLE (J / Q / K / Bathroom) */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black tracking-wider text-slate-200 uppercase">
                    PLAYER TRACKER (J / Q / K)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">บันทึกอัตโนมัติ</span>
              </div>

              <div className="space-y-1.5">
                {players.map((p, idx) => {
                  const isCurrent = idx === currentPlayerIndex;
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isCurrent
                          ? 'bg-cyan-950/30 border-cyan-500/40'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg text-[10px] font-black border flex items-center justify-center ${p.avatarColor}`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {p.name}
                            {isCurrent && (
                              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded">
                                กำลังเล่น
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* J, Q, K counters */}
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30 font-bold" title="คนถือ J">
                          J: {p.stats.jCards}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30 font-bold" title="Question Master">
                          Q: {p.stats.qCards}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-500/30 font-bold" title="King">
                          K: {p.stats.kCards}
                        </span>
                        {p.stats.bathroomPasses > 0 && (
                          <button
                            onClick={() => onUseBathroomPass && onUseBathroomPass(p.id)}
                            className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-800/40 active:scale-95 text-[10px] flex items-center gap-0.5"
                            title="กดเพื่อใช้บัตรเข้าห้องน้ำ"
                          >
                            <span>🚽 x{p.stats.bathroomPasses}</span>
                            <span className="underline ml-0.5">ใช้</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE RULES & STATUS */}
            {activeRules && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black tracking-wider text-slate-200 uppercase">
                    กฎและสถานะพิเศษที่ยังมีผลอยู่
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  {activeRules.questionMasterName && (
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 flex items-center justify-between">
                      <span className="font-bold">❓ Question Master ปัจจุบัน:</span>
                      <span className="bg-purple-900/50 px-2 py-0.5 rounded font-black text-white">
                        {activeRules.questionMasterName}
                      </span>
                    </div>
                  )}

                  {activeRules.princeName && (
                    <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 flex items-center justify-between">
                      <span className="font-bold">👑 คนถือ J (ห้ามใครพูดด้วย):</span>
                      <span className="bg-blue-900/50 px-2 py-0.5 rounded font-black text-white">
                        {activeRules.princeName}
                      </span>
                    </div>
                  )}

                  {activeRules.kingsDrawn !== undefined && (
                    <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 flex items-center justify-between">
                      <span className="font-bold">🏰 King ที่เปิดแล้ว:</span>
                      <span className="font-mono font-black text-amber-300">
                        {activeRules.kingsDrawn} / 4 ใบ
                      </span>
                    </div>
                  )}

                  {activeRules.activeHouseRules && activeRules.activeHouseRules.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        กฎพิเศษจาก King:
                      </span>
                      {activeRules.activeHouseRules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] flex items-center gap-1.5"
                        >
                          <ScrollText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!activeRules.questionMasterName &&
                    !activeRules.princeName &&
                    (!activeRules.activeHouseRules || activeRules.activeHouseRules.length === 0) && (
                      <p className="text-slate-500 text-[11px] italic text-center py-1">
                        ยังไม่มีกฎพิเศษที่ทำงานอยู่ เปิดไพ่ต่อไป!
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* RECENT EVENT HISTORY */}
            {history.length > 0 && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-black tracking-wider text-slate-300 uppercase">
                    ประวัติไพ่ล่าสุด (5 รายการหลังสุด)
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto">
                  {history.slice(-5).reverse().map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white mr-1.5">{item.playerName}:</span>
                        <span className="text-slate-300">{item.summary}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Close Button */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 shrink-0">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm active:scale-98 transition-all shadow-lg shadow-cyan-950"
            >
              กลับเข้าสู่เกม (เล่นต่อ)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
