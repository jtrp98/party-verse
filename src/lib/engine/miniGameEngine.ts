import {
  GameVibeLevel,
  GameDifficulty,
  ProgressionPhase,
  Player,
  ActiveMiniGameInstance,
  MiniGame,
  IntensityLevel,
  SessionBoundaries,
  VIBE_TO_INTENSITY,
  ContentRating,
  NormalPack,
  AreaType,
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
  maxAllowedIntensity?: IntensityLevel;
  boundaries?: SessionBoundaries;
  rating?: ContentRating;
  normalPack?: NormalPack;
  areaType?: AreaType;
  optInPlayerIds?: string[];
  isFinale?: boolean;
}

/**
 * Filter and select appropriate mini-game avoiding immediate repetitions,
 * strictly enforcing maximum intensity ceiling and boundaries,
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
    maxAllowedIntensity,
    boundaries,
    rating,
    normalPack,
    areaType,
    optInPlayerIds,
    isFinale,
  } = params;
  const playerCount = players.length;

  if (playerCount === 0 || database.length === 0) return null;

  // 1. Determine strict intensity ceiling
  const ceilingNum = maxAllowedIntensity ?? (VIBE_TO_INTENSITY[level] || 1);

  // 2. Strict Filter: Intensity must never exceed ceiling, player count must be satisfied, and boundaries respected
  const boundaryCompliant = database.filter((mg) => {
    const mgIntensity = VIBE_TO_INTENSITY[mg.level] || 1;
    if (mgIntensity > ceilingNum) return false;
    if (mg.minPlayers > playerCount) return false;

    // Normal rating strictly excludes 18+ adult mini-games
    if (rating === 'NORMAL') {
      if (mgIntensity >= 3) return false;
      if (mg.tags?.includes('18plus') || mg.tags?.includes('adult') || mg.tags?.includes('nsfw')) return false;
    }

    // Public area rejects private-only mini-games
    if (areaType === 'PUBLIC' && (mg.tags?.includes('private_space') || (mg.requiresConsent && mgIntensity >= 4))) {
      return false;
    }

    if (boundaries) {
      if (!boundaries.allowPhysical && (mg.requiresConsent || mg.tags?.includes('physical'))) {
        return false;
      }
      if (!boundaries.allowExplicitTalk && mgIntensity >= 3) {
        return false;
      }
    }
    return true;
  });

  if (boundaryCompliant.length === 0) {
    return null;
  }

  // 3. Prefer exact level match if within ceiling
  let eligible = boundaryCompliant.filter((mg) => mg.level === level);

  // Safe Fallback: If no exact level match, pick from boundaryCompliant (which is guaranteed <= ceilingNum)
  if (eligible.length === 0) {
    eligible = boundaryCompliant;
  }

  // 4. Filter out recently played games to avoid immediate repetition
  const notRecent = eligible.filter((mg) => !recentMiniGameIds.includes(mg.id));
  const pool = notRecent.length > 0 ? notRecent : eligible;

  // 5. Weighted scoring based on phase, difficulty, pack, and finale status
  const scored = pool.map((mg) => {
    let weight = 1;
    if (isFinale && mg.phase === 'FINALE') weight += 10;
    if (mg.phase === phase) weight += 3;
    if (mg.difficulty === difficulty) weight += 2;
    if (normalPack === 'COMPETITION' && (mg.category === 'SPEED_REACTION' || mg.category === 'VERSUS_DUEL' || mg.category === 'PARTY_CLASSIC')) {
      weight += 4;
    }
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

  // Sober alternative check
  if (boundaries && !boundaries.allowAlcohol && chosenGame.penaltyText.includes('ดื่ม')) {
    chosenGame = {
      ...chosenGame,
      penaltyText: 'ทำท่าตลก 5 วินาที หรือสารภาพความลับ 1 ข้อ (ปลอดภัยไร้แอลกอฮอล์)',
    };
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
