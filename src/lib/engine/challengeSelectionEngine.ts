import {
  GameVibeLevel,
  GameDifficulty,
  ProgressionPhase,
  TruthOrDareItem,
  CoupleItem,
  CoupleLevel,
  Player,
  TruthOrDareCategory,
  CoupleCategory,
} from '../types/game';
import { formatPromptWithPlayers } from './playerEngine';

export interface SelectionParams<T> {
  pool: T[];
  completedItemIds: string[];
  level: string;
  difficulty?: GameDifficulty;
  phase?: ProgressionPhase;
  lastCategory?: string;
  recentCooldownSize?: number;
}

export interface SelectionResult<T> {
  item: T;
  updatedCompletedIds: string[];
  isNewCycle: boolean;
}

/**
 * Generic, robust weighted selection algorithm with cycle exhaustion cooldown
 * and category balance.
 */
export function selectChallengeWithCooldown<
  T extends {
    id: string;
    level: string;
    difficulty?: GameDifficulty;
    phase?: ProgressionPhase;
    category?: string;
  }
>(params: SelectionParams<T>): SelectionResult<T> | null {
  const {
    pool,
    completedItemIds,
    level,
    difficulty = 'EASY',
    phase = 'WARM_UP',
    lastCategory,
    recentCooldownSize = 3,
  } = params;

  if (!pool || pool.length === 0) return null;

  // 1. Filter pool by level (fallback to whole pool if level not found)
  let levelPool = pool.filter((item) => item.level === level);
  if (levelPool.length === 0) {
    levelPool = pool;
  }

  // 2. Identify unplayed items in this level pool
  const unplayed = levelPool.filter((item) => !completedItemIds.includes(item.id));

  let candidatePool: T[];
  let updatedCompletedIds: string[];
  let isNewCycle = false;

  if (unplayed.length > 0) {
    candidatePool = unplayed;
    updatedCompletedIds = [...completedItemIds];
  } else {
    // Cycle exhausted! Start a fresh cycle, but preserve a cooldown buffer
    // from the end of the previous cycle so recent items don't immediately repeat.
    isNewCycle = true;
    const cooldownSize = Math.min(recentCooldownSize, Math.floor(levelPool.length / 2));
    const recentCooldownIds = completedItemIds.slice(-cooldownSize);

    candidatePool = levelPool.filter((item) => !recentCooldownIds.includes(item.id));
    if (candidatePool.length === 0) {
      candidatePool = levelPool;
    }
    // New cycle starts with the cooldown IDs remaining as "completed" to prevent immediate re-pick
    updatedCompletedIds = [...recentCooldownIds];
  }

  // 3. Weight candidates based on phase, difficulty, and category diversity
  const hasDifferentCategory = lastCategory
    ? candidatePool.some((item) => item.category && item.category !== lastCategory)
    : false;

  const scored = candidatePool.map((item) => {
    let weight = 1;

    // Phase alignment
    if (item.phase && item.phase === phase) {
      weight += 3;
    }

    // Difficulty alignment
    if (item.difficulty && item.difficulty === difficulty) {
      weight += 2;
    }

    // Category diversity: if alternatives exist, heavily prioritize switching
    if (hasDifferentCategory && item.category === lastCategory) {
      weight = Math.max(0.05, weight * 0.1);
    } else if (item.category && item.category !== lastCategory) {
      weight += 5;
    }

    return { item, weight };
  });

  // 4. Roulette-wheel selection among weighted candidates
  const totalWeight = scored.reduce((acc, curr) => acc + curr.weight, 0);
  let randomVal = Math.random() * totalWeight;
  let selected = scored[0].item;

  for (const entry of scored) {
    if (randomVal <= entry.weight) {
      selected = entry.item;
      break;
    }
    randomVal -= entry.weight;
  }

  updatedCompletedIds.push(selected.id);

  return {
    item: selected,
    updatedCompletedIds,
    isNewCycle,
  };
}

/**
 * Specialized selector for Truth or Dare
 */
export function selectNextTruthOrDare(params: {
  database: TruthOrDareItem[];
  completedItemIds: string[];
  type: 'TRUTH' | 'DARE';
  level: GameVibeLevel;
  difficulty: GameDifficulty;
  phase: ProgressionPhase;
  lastCategory?: TruthOrDareCategory;
  currentPlayer?: Player | null;
  allPlayers?: Player[];
}): { item: TruthOrDareItem; updatedCompletedIds: string[]; isNewCycle: boolean } | null {
  const {
    database,
    completedItemIds,
    type,
    level,
    difficulty,
    phase,
    lastCategory,
    currentPlayer,
    allPlayers = [],
  } = params;

  // Filter by requested type (TRUTH or DARE)
  const typePool = database.filter((item) => item.type === type);
  if (typePool.length === 0) return null;

  const result = selectChallengeWithCooldown({
    pool: typePool,
    completedItemIds,
    level,
    difficulty,
    phase,
    lastCategory,
    recentCooldownSize: 4,
  });

  if (!result) return null;

  // Format dynamic player names in text and alternative
  const formattedText = formatPromptWithPlayers(result.item.text, currentPlayer, allPlayers);
  const formattedDrinkAlt = result.item.drinkAlternative
    ? formatPromptWithPlayers(result.item.drinkAlternative, currentPlayer, allPlayers)
    : undefined;

  return {
    item: {
      ...result.item,
      text: formattedText,
      drinkAlternative: formattedDrinkAlt,
    },
    updatedCompletedIds: result.updatedCompletedIds,
    isNewCycle: result.isNewCycle,
  };
}

/**
 * Specialized selector for Couple Challenge
 */
export function selectNextCoupleChallenge(params: {
  database: CoupleItem[];
  completedItemIds: string[];
  level: CoupleLevel;
  partnerAName: string;
  partnerBName: string;
  phase?: ProgressionPhase;
  difficulty?: GameDifficulty;
  lastCategory?: CoupleCategory;
}): { item: CoupleItem; updatedCompletedIds: string[]; isNewCycle: boolean } | null {
  const {
    database,
    completedItemIds,
    level,
    partnerAName,
    partnerBName,
    phase = 'WARM_UP',
    difficulty = 'EASY',
    lastCategory,
  } = params;

  const result = selectChallengeWithCooldown({
    pool: database,
    completedItemIds,
    level,
    difficulty,
    phase,
    lastCategory,
    recentCooldownSize: 4,
  });

  if (!result) return null;

  // Substitute partner names if tokens exist
  let formattedText = result.item.text;
  let formattedTitle = result.item.title;

  if (formattedText.includes('{PARTNER_A}')) {
    formattedText = formattedText.replace(/\{PARTNER_A\}/g, partnerAName);
  }
  if (formattedText.includes('{PARTNER_B}')) {
    formattedText = formattedText.replace(/\{PARTNER_B\}/g, partnerBName);
  }
  if (formattedTitle.includes('{PARTNER_A}')) {
    formattedTitle = formattedTitle.replace(/\{PARTNER_A\}/g, partnerAName);
  }
  if (formattedTitle.includes('{PARTNER_B}')) {
    formattedTitle = formattedTitle.replace(/\{PARTNER_B\}/g, partnerBName);
  }

  return {
    item: {
      ...result.item,
      title: formattedTitle,
      text: formattedText,
    },
    updatedCompletedIds: result.updatedCompletedIds,
    isNewCycle: result.isNewCycle,
  };
}
