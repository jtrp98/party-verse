import {
  GameVibeLevel,
  GameDifficulty,
  ProgressionPhase,
  Player,
  ActiveMiniGameInstance,
} from '../types/game';
import { MINI_GAMES_DATABASE } from '../data/miniGamesData';
import { pickPairOfPlayers, pickGroupOfPlayers } from './playerEngine';

export interface MiniGamePickerParams {
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  phase: ProgressionPhase;
  players: Player[];
  currentPlayerIndex: number;
  recentMiniGameIds?: string[];
}

/**
 * Filter and select appropriate mini-game avoiding immediate repetitions
 */
export function pickNextMiniGame(params: MiniGamePickerParams): ActiveMiniGameInstance | null {
  const { level, difficulty, phase, players, currentPlayerIndex, recentMiniGameIds = [] } = params;
  const playerCount = players.length;

  // 1. Filter by Level and player count capacity
  let eligible = MINI_GAMES_DATABASE.filter((mg) => {
    // Level must match or be equal/lower tier
    const matchesLevel = mg.level === level;
    const matchesPlayers = mg.minPlayers <= playerCount;
    return matchesLevel && matchesPlayers;
  });

  // If no exact level match, allow fallback within CHILL
  if (eligible.length === 0) {
    eligible = MINI_GAMES_DATABASE.filter((mg) => mg.level === 'CHILL' && mg.minPlayers <= playerCount);
  }

  if (eligible.length === 0) {
    return null;
  }

  // 2. Filter out recent to avoid immediate duplicates
  const notRecent = eligible.filter((mg) => !recentMiniGameIds.includes(mg.id));
  const pool = notRecent.length > 0 ? notRecent : eligible;

  // 3. Score candidates by matching phase & difficulty
  const scored = pool.map((mg) => {
    let score = 1;
    if (mg.phase === phase) score += 3;
    if (mg.difficulty === difficulty) score += 2;
    return { game: mg, score };
  });

  // Weighted random pick from top candidates
  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, Math.min(3, scored.length));
  const chosenGame = topCandidates[Math.floor(Math.random() * topCandidates.length)].game;

  // 4. Assign participants according to requirement
  const currentPlayer = players[currentPlayerIndex] || players[0];
  let participantIds: string[] = [];
  const roleDescriptions: { [playerId: string]: string } = {};

  switch (chosenGame.playerRequirement) {
    case 'SOLO':
      participantIds = [currentPlayer.id];
      roleDescriptions[currentPlayer.id] = 'ผู้ปฏิบัติภารกิจเดี่ยว';
      break;

    case 'VERSUS':
    case 'PAIR': {
      const pair = pickPairOfPlayers(players, currentPlayer.id);
      if (pair) {
        participantIds = [pair[0].id, pair[1].id];
        roleDescriptions[pair[0].id] = 'ผู้ท้าชิงฝ่ายที่ 1';
        roleDescriptions[pair[1].id] = 'ผู้ท้าชิงฝ่ายที่ 2';
      } else {
        participantIds = [currentPlayer.id];
      }
      break;
    }

    case 'GROUP': {
      const groupCount = Math.max(2, Math.min(3, players.length));
      const group = pickGroupOfPlayers(players, groupCount);
      participantIds = group.map((p) => p.id);
      break;
    }

    case 'ALL':
    default:
      participantIds = players.map((p) => p.id);
      break;
  }

  return {
    game: chosenGame,
    participantIds,
    roleDescriptions,
  };
}
