'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Users, UserCheck } from 'lucide-react';
import { Player } from '@/lib/types/game';
import { createNewPlayer } from '@/lib/engine/playerEngine';
import { sounds } from '@/lib/sound/webAudio';
import { savePlayerNames } from '@/lib/engine/sessionManager';

interface PlayerSetupModalProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
}

export const PlayerSetupModal: React.FC<PlayerSetupModalProps> = ({
  players,
  onPlayersChange,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    sounds.playClick();
    const updated = [...players, createNewPlayer(name, players.length)];
    onPlayersChange(updated);
    savePlayerNames(updated.map((p) => p.name));
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) {
      alert('ต้องการผู้เล่นอย่างน้อย 2 คนครับ');
      return;
    }
    sounds.playClick();
    const updated = players.filter((p) => p.id !== id);
    onPlayersChange(updated);
    savePlayerNames(updated.map((p) => p.name));
  };

  const handleUpdateName = (id: string, name: string) => {
    const updated = players.map((p) => (p.id === id ? { ...p, name } : p));
    onPlayersChange(updated);
    savePlayerNames(updated.map((p) => p.name));
  };

  const handlePreset = (count: number) => {
    sounds.playClick();
    const defaultNames = ['คุณ A', 'คุณ B', 'คุณ C', 'คุณ D', 'คุณ E', 'คุณ F'];
    const newOnes: Player[] = [];
    for (let i = 0; i < count; i++) {
      newOnes.push(createNewPlayer(defaultNames[i] || `ผู้เล่น ${i + 1}`, i));
    }
    onPlayersChange(newOnes);
    savePlayerNames(newOnes.map((p) => p.name));
  };

  return (
    <div className="w-full space-y-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <label className="text-sm font-black text-slate-200 tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>รายชื่อผู้เล่น ({players.length} คน)</span>
        </label>
        <div className="flex gap-1.5">
          {[2, 3, 4, 5].map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => handlePreset(cnt)}
              className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              {cnt} คน
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {players.map((player, idx) => (
          <div
            key={player.id}
            className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 p-2 rounded-2xl"
          >
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${player.avatarColor}`}
            >
              {idx + 1}
            </div>

            <input
              type="text"
              value={player.name}
              onChange={(e) => handleUpdateName(player.id, e.target.value)}
              placeholder={`ชื่อผู้เล่น ${idx + 1}`}
              className="flex-1 bg-transparent text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50 rounded px-1.5 py-1"
            />

            <button
              type="button"
              onClick={() => handleRemovePlayer(player.id)}
              disabled={players.length <= 2}
              className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
              aria-label="ลบผู้เล่น"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new player row */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          placeholder="+ เพิ่มชื่อเพื่อนในวง..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={handleAddPlayer}
          className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold text-sm flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-cyan-950"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่ม</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1">
        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>ระบบจำรายชื่อไว้อัตโนมัติ เล่นครั้งหน้าไม่ต้องพิมพ์ใหม่</span>
      </div>
    </div>
  );
};
