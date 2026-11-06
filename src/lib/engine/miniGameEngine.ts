import {
  GameVibeLevel,
  GameDifficulty,
  ProgressionPhase,
  Player,
  ActiveMiniGameInstance,
  MiniGame,
} from '../types/game';
import { MINI_GAMES_DATABASE } from '../data/miniGamesData';
import { pickPairOfPlayers, pickGroupOfPlayers, formatPromptWithPlayers } from './playerEngine';

export interface MiniGamePickerParams {
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  phase: ProgressionPhase;
  players: Player[];
  currentPlayerIndex: number;
  recentMiniGameIds?: string[];
  database?: MiniGame[];
}

/**
 * Filter and select appropriate mini-game avoiding immediate repetitions,
 * respecting seating positions and weighted progression.
 */
export function pickNextMiniGame(params: MiniGamePickerParams): ActiveMiniGameInstance | null {
  const {
    level,
    difficulty,
    phase,
    players,
    currentPlayerIndex,
    recentMiniGameIds = [],
    database = MINI_GAMES_DATABASE,
  } = params;
  const playerCount = players.length;

  if (playerCount === 0 || database.length === 0) return null;

  // 1. Filter by Level and minimum player count requirement
  let eligible = database.filter((mg) => {
    const matchesLevel = mg.level === level;
    const matchesPlayers = mg.minPlayers <= playerCount;
    return matchesLevel && matchesPlayers;
  });

  // Fallback: If no exact level match, allow fallback to CHILL or lower
  if (eligible.length === 0) {
    eligible = database.filter((mg) => mg.minPlayers <= playerCount);
  }

  if (eligible.length === 0) {
    return null;
  }

  // 2. Filter out recently played games to avoid immediate repetition
  const notRecent = eligible.filter((mg) => !recentMiniGameIds.includes(mg.id));
  const pool = notRecent.length > 0 ? notRecent : eligible;

  // 3. Weighted scoring based on phase and difficulty
  const scored = pool.map((mg) => {
    let weight = 1;
    if (mg.phase === phase) weight += 3;
    if (mg.difficulty === difficulty) weight += 2;
    return { game: mg, weight };
  });

  // Weighted random pick
  const totalWeight = scored.reduce((acc, curr) => acc + curr.weight, 0);
  let randomVal = Math.random() * totalWeight;
  let chosenGame = scored[0].game;

  for (const item of scored) {
    if (randomVal <= item.weight) {
      chosenGame = item.game;
      break;
    }
    randomVal -= item.weight;
  }

  // 4. Resolve Participants respecting relative seating directions
  const n = players.length;
  const currentPlayer = players[currentPlayerIndex] || players[0];
  let participantIds: string[] = [];
  const roleDescriptions: { [playerId: string]: string } = {};

  // Check if game targets specific relative neighbor
  const instructionsJoined = chosenGame.instructions.join(' ') + ' ' + chosenGame.description;
  const targetsRight =
    chosenGame.targetPlayerRole === 'RIGHT' ||
    instructionsJoined.includes('{RIGHT_PLAYER}') ||
    instructionsJoined.includes('ข้างขวา');
  const targetsLeft =
    chosenGame.targetPlayerRole === 'LEFT' ||
    instructionsJoined.includes('{LEFT_PLAYER}') ||
    instructionsJoined.includes('ข้างซ้าย');
  const targetsOpposite =
    chosenGame.targetPlayerRole === 'OPPOSITE' ||
    instructionsJoined.includes('{OPPOSITE_PLAYER}') ||
    instructionsJoined.includes('ตรงข้าม');

  switch (chosenGame.playerRequirement) {
    case 'SOLO':
      participantIds = [currentPlayer.id];
      roleDescriptions[currentPlayer.id] = 'ผู้ปฏิบัติภารกิจเดี่ยว';
      break;

    case 'VERSUS':
    case 'PAIR': {
      let secondaryPlayer: Player;
      if (targetsRight && n > 1) {
        secondaryPlayer = players[(currentPlayerIndex + 1) % n];
      } else if (targetsLeft && n > 1) {
        secondaryPlayer = players[(currentPlayerIndex - 1 + n) % n];
      } else if (targetsOpposite && n > 2) {
        secondaryPlayer = players[(currentPlayerIndex + Math.floor(n / 2)) % n];
      } else {
        const pair = pickPairOfPlayers(players, currentPlayer.id);
        secondaryPlayer = pair ? pair[1] : currentPlayer;
      }

      participantIds = [currentPlayer.id, secondaryPlayer.id];
      if (chosenGame.playerRequirement === 'VERSUS') {
        roleDescriptions[currentPlayer.id] = 'ผู้ท้าชิงคนที่ 1';
        roleDescriptions[secondaryPlayer.id] = 'ผู้ท้าชิงคนที่ 2';
      } else {
        roleDescriptions[currentPlayer.id] = 'ผู้เล่นหลัก';
        roleDescriptions[secondaryPlayer.id] = 'คู่หูร่วมภารกิจ';
      }
      break;
    }

    case 'TEAM': {
      // Split players into 2 balanced teams
      const half = Math.ceil(n / 2);
      const team1 = players.slice(0, half);
      const team2 = players.slice(half);
      participantIds = players.map((p) => p.id);
      team1.forEach((p) => {
        roleDescriptions[p.id] = 'ทีมสีส้ม';
      });
      team2.forEach((p) => {
        roleDescriptions[p.id] = 'ทีมสีน้ำเงิน';
      });
      break;
    }

    case 'GROUP': {
      const groupCount = Math.max(2, Math.min(3, players.length));
      const group = pickGroupOfPlayers(players, groupCount);
      participantIds = group.map((p) => p.id);
      participantIds.forEach((id, idx) => {
        roleDescriptions[id] = `สมาชิกกลุ่มคนที่ ${idx + 1}`;
      });
      break;
    }

    case 'ALL':
    default:
      participantIds = players.map((p) => p.id);
      participantIds.forEach((id) => {
        if (id === currentPlayer.id) {
          roleDescriptions[id] = 'ผู้นำรอบนี้';
        } else {
          roleDescriptions[id] = 'ผู้เล่นร่วมวง';
        }
      });
      break;
  }

  // 5. Format prompt tokens inside game description and instructions
  const formattedDescription = formatPromptWithPlayers(chosenGame.description, currentPlayer, players);
  const formattedInstructions = chosenGame.instructions.map((inst) =>
    formatPromptWithPlayers(inst, currentPlayer, players)
  );

  return {
    game: {
      ...chosenGame,
      description: formattedDescription,
      instructions: formattedInstructions,
    },
    participantIds,
    roleDescriptions,
  };
}
