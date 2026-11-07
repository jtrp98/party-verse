export type GameMode = 'PARTY' | 'COUPLE';

export type ContentRating = 'NORMAL' | 'NSFW';

export type NormalPack = 'FUN' | 'DEEP_TALK' | 'COMPETITION';

export type AreaType = 'PUBLIC' | 'PRIVATE';

export type GamePhase = 'WARM_UP' | 'BUILD_UP' | 'PEAK' | 'FINALE';

export type RelationshipStage =
  | 'BEFORE_DATING'
  | 'BEFORE_INTIMACY'
  | 'ESTABLISHED_INTIMACY';

export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

export type IntimacyLevel = 1 | 2 | 3 | 4 | 5;

export type FullRoundsChoice = 2 | 3 | 5;

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

export type ChallengeType =
  | 'TRUTH'
  | 'DARE'
  | 'SYNC'
  | 'MINI_GAME'
  | 'CHALLENGE'
  | 'VOTE'
  | 'SECRET_REVEAL'
  | 'GUESS'
  | 'MUTUAL_CHOICE'
  | 'WILDCARD';

export type AdultTopicTag =
  | 'ONS'
  | 'GROUP_SEX'
  | 'ANAL_SEX'
  | 'FANTASIES'
  | 'PREFERENCES'
  | 'BOUNDARIES'
  | 'NON_MONOGAMY'
  | 'CASUAL_SEX'
  | 'ROLEPLAY_KINKS'
  | 'GENERAL';

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
  relationshipStages?: RelationshipStage[]; // For Couple Mode (legacy stage mapping)
  intimacyLevel?: IntimacyLevel;             // For Couple Mode (1-5 closeness level)
  allowedPhases?: GamePhase[];
  requiresConsent: boolean;
  isPhysical: boolean;
  options?: [string, string];               // For SYNC 3-2-1 challenges or voting
  alternativeAction?: string;               // Sober/friendly alternative
  estimatedDuration?: number;
  tags?: string[];
  adultTopic?: AdultTopicTag;
  rating?: ContentRating;                   // 'NORMAL' or 'NSFW'
  normalPack?: NormalPack;                  // 'FUN' (ขำ ๆ), 'DEEP_TALK' (คุยเปิดใจ), 'COMPETITION' (แข่งขันเบา ๆ)
  requiresPrivacy?: boolean;                // Private space requirement
  participantCount?: number;                // 1 (solo), 2 (pair), 3+ (group)
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
  rating: ContentRating;                    // 'NORMAL' | 'NSFW'
  normalPack?: NormalPack;                  // 'FUN' | 'DEEP_TALK' | 'COMPETITION'
  areaType?: AreaType;                      // 'PUBLIC' | 'PRIVATE'
  fullRounds?: FullRoundsChoice;            // 2 | 3 | 5
  currentRound: number;
  totalRounds: number;
  currentTurnIndex?: number;
  totalTurns?: number;
  currentPhase: GamePhase;
  currentAllowedIntensity: IntensityLevel;
  maxAllowedIntensity: IntensityLevel;
  boundaries: SessionBoundaries;
  completedChallengeIds: string[];
  history: GameEventLog[];
  scores?: Record<string, number>;          // Player ID -> score (e.g. for Light Competition)
  optInPlayerIds?: string[];                // Opt-in pool for NSFW (in-memory only)
  requiresResumeConfirmation?: boolean;     // Set on load for NSFW before card reveal
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
  intimacyLevel?: IntimacyLevel;             // 1 to 5
  syncScore: {
    matches: number;
    total: number;
  };
  currentTurn: 'A' | 'B' | 'BOTH';
  currentChallenge?: UnifiedChallenge;
}

export type ActiveGameSession = PartySession | CoupleSessionData;
