export type GameVibeLevel = 'CHILL' | 'FLIRTY' | 'SPICY' | 'NAUGHTY' | 'UNLEASHED';

export type GameDifficulty = 'EASY' | 'HARD' | 'EXTREME';

export type ProgressionPhase = 'WARM_UP' | 'BUILD_UP' | 'PEAK' | 'FINALE';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface PlayerStats {
  drinksDrunk: number;
  miniGamesWon: number;
  jCards: number;
  qCards: number;
  kCards: number;
  bathroomPasses: number;
  activeBuffs: string[];
}

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  stats: PlayerStats;
}

export interface PlayingCard {
  id: string;
  suit: Suit;
  rank: Rank;
  isDrawn: boolean;
  drawnByPlayerId?: string;
  ruleTitle: string;
  ruleDescription: string;
  ruleDetails?: string;
  triggersMiniGame?: boolean;
}

export interface GameEventLog {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  type: 'DRAW_CARD' | 'MINI_GAME' | 'TRUTH_DARE' | 'RULE_TRIGGER' | 'PASS_USED';
  summary: string;
  details?: string;
}

export interface BaseGameSession {
  gameId: 'doraemon' | 'truth-or-dare' | string;
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  players: Player[];
  currentPlayerIndex: number;
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  currentPhase: ProgressionPhase;
  status: 'SETUP' | 'READY' | 'PLAYING' | 'MINI_GAME' | 'PAUSED' | 'FINISHED';
  history: GameEventLog[];
}

export interface DoraemonSession extends BaseGameSession {
  gameId: 'doraemon';
  deck: PlayingCard[];
  drawnCards: PlayingCard[];
  activeRules: {
    questionMasterId?: string; // Player who holds Q
    princeId?: string;         // Player who holds J (can't talk to them)
    kingsDrawn: number;        // King count (1..4)
    buddies?: { p1Id: string; p2Id: string }[];
    activeHouseRules: string[];
  };
}

export interface TruthOrDareItem {
  id: string;
  type: 'TRUTH' | 'DARE';
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  phase: ProgressionPhase;
  text: string;
  drinkAlternative?: string;
  timerSeconds?: number;
  category?: string;
}

export interface TruthOrDareSession extends BaseGameSession {
  gameId: 'truth-or-dare';
  currentRound: number;
  totalRounds: number;
  completedItems: string[];
  currentItem?: TruthOrDareItem;
}

export type MiniGameType = 'SOLO' | 'PAIR' | 'GROUP' | 'ALL' | 'TEAM' | 'VERSUS';

export interface MiniGame {
  id: string;
  title: string;
  description: string;
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  phase: ProgressionPhase;
  playerRequirement: MiniGameType;
  minPlayers: number;
  instructions: string[];
  durationSeconds?: number;
  penaltyText: string;
}

export interface ActiveMiniGameInstance {
  game: MiniGame;
  participantIds: string[];
  roleDescriptions?: { [playerId: string]: string };
}

export type CoupleLevel = 'SWEET' | 'SPICY' | 'WILD';
export type CoupleQuestionType = 'SYNC' | 'TRUTH' | 'DARE';

export interface CoupleItem {
  id: string;
  type: CoupleQuestionType;
  level: CoupleLevel;
  title: string;
  text: string;
  options?: [string, string];
  timerSeconds?: number;
  penaltyText: string;
}

export interface CoupleSession extends BaseGameSession {
  gameId: 'couples';
  coupleLevel: CoupleLevel;
  partnerAName: string;
  partnerBName: string;
  currentRound: number;
  totalRounds: number;
  syncMatches: number;
  syncTotal: number;
  completedItems: string[];
  currentItem?: CoupleItem;
}
