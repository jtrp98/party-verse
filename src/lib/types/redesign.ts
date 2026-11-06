export type GameMode = 'PARTY' | 'COUPLE';

export type GamePhase = 'WARM_UP' | 'BUILD_UP' | 'PEAK' | 'FINALE';

export type RelationshipStage =
  | 'BEFORE_DATING'
  | 'BEFORE_INTIMACY'
  | 'ESTABLISHED_INTIMACY';

export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

export type GameVibeLevel = 'CHILL' | 'FLIRTY' | 'SPICY' | 'NAUGHTY' | 'UNLEASHED';

export const INTENSITY_TO_VIBE: Record<IntensityLevel, GameVibeLevel> = {
  1: 'CHILL',
  2: 'FLIRTY',
  3: 'SPICY',
  4: 'NAUGHTY',
  5: 'UNLEASHED',
};

export const VIBE_TO_INTENSITY: Record<GameVibeLevel, IntensityLevel> = {
  CHILL: 1,
  FLIRTY: 2,
  SPICY: 3,
  NAUGHTY: 4,
  UNLEASHED: 5,
};

export interface SessionBoundaries {
  allowPhysical: boolean;       // Consensual touch / skinship challenges
  allowAlcohol: boolean;        // Drink penalties vs sober alternatives
  allowExplicitTalk: boolean;   // 18+ sex talk and private questions
}

export type ChallengeType = 'TRUTH' | 'DARE' | 'SYNC' | 'MINI_GAME' | 'CHALLENGE';

export interface UnifiedChallenge {
  id: string;
  mode: GameMode;
  type: ChallengeType;
  title?: string;
  content: string;
  intensity: IntensityLevel;
  categories: string[];
  minPlayers: number;
  maxPlayers?: number;
  relationshipStages?: RelationshipStage[]; // For Couple Mode
  allowedPhases?: GamePhase[];
  requiresConsent: boolean;
  isPhysical: boolean;
  options?: [string, string];               // For SYNC 3-2-1 challenges
  alternativeAction?: string;               // Sober/friendly alternative
  estimatedDuration?: number;
  tags?: string[];
}

export interface PlayerStats {
  drinksDrunk: number;
  challengesCompleted: number;
  challengesSkipped: number;
}

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  stats: PlayerStats;
}

export interface GameEventLog {
  id: string;
  timestamp: number;
  playerId?: string;
  playerName?: string;
  type: 'CHALLENGE' | 'SYNC' | 'SKIP' | 'INTENSITY_CHANGE' | 'START' | 'FINISH';
  summary: string;
  details?: string;
}

export interface BaseSession {
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  status: 'SETUP' | 'PLAYING' | 'PAUSED' | 'FINISHED';
  currentRound: number;
  totalRounds: number;
  currentPhase: GamePhase;
  currentAllowedIntensity: IntensityLevel;
  maxAllowedIntensity: IntensityLevel;
  boundaries: SessionBoundaries;
  completedChallengeIds: string[];
  history: GameEventLog[];
}

export interface PartySession extends BaseSession {
  mode: 'PARTY';
  players: Player[];
  currentPlayerIndex: number;
  currentChallenge?: UnifiedChallenge;
}

export interface CoupleSessionData extends BaseSession {
  mode: 'COUPLE';
  partnerAName: string;
  partnerBName: string;
  relationshipStage: RelationshipStage;
  syncScore: {
    matches: number;
    total: number;
  };
  currentTurn: 'A' | 'B' | 'BOTH';
  currentChallenge?: UnifiedChallenge;
}

export type ActiveGameSession = PartySession | CoupleSessionData;
