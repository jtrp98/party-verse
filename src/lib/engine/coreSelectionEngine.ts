import {
  UnifiedChallenge,
  GameMode,
  IntensityLevel,
  RelationshipStage,
  GamePhase,
  SessionBoundaries,
  Player,
} from '../types/redesign';

export interface SelectionCriteria {
  pool: UnifiedChallenge[];
  mode: GameMode;
  currentPermittedIntensity: IntensityLevel;
  maxAllowedIntensity: IntensityLevel;
  currentPhase: GamePhase;
  boundaries: SessionBoundaries;
  completedIds: string[];
  playerCount: number;
  relationshipStage?: RelationshipStage;
  lastCategory?: string;
  currentPlayer?: Player;
  allPlayers?: Player[];
  partnerAName?: string;
  partnerBName?: string;
}

export interface SelectionResult {
  challenge: UnifiedChallenge;
  updatedCompletedIds: string[];
  isNewCycle: boolean;
}

/**
 * Filter pool using strict hard eligibility gates.
 * NO random fallbacks may bypass these gates.
 */
export function filterEligibleChallenges(
  pool: UnifiedChallenge[],
  criteria: Omit<SelectionCriteria, 'completedIds' | 'lastCategory'>
): UnifiedChallenge[] {
  const {
    mode,
    currentPermittedIntensity,
    maxAllowedIntensity,
    boundaries,
    playerCount,
    relationshipStage,
  } = criteria;

  return pool.filter((item) => {
    // 1. Mode Gate
    if (item.mode !== mode) return false;

    // 2. Hard Intensity Gate: Never exceed current permitted intensity or session ceiling
    if (item.intensity > currentPermittedIntensity) return false;
    if (item.intensity > maxAllowedIntensity) return false;

    // 3. Couple Mode: Hard Relationship Stage Gate
    if (mode === 'COUPLE') {
      if (!relationshipStage) return false;
      if (item.relationshipStages && !item.relationshipStages.includes(relationshipStage)) {
        return false;
      }
    }

    // 4. Boundary Gate: Physical touch
    if (!boundaries.allowPhysical && item.isPhysical) {
      return false;
    }

    // 5. Boundary Gate: Explicit adult talk (intensity 3+)
    if (!boundaries.allowExplicitTalk && item.intensity >= 3) {
      return false;
    }

    // 6. Player Count Gate
    if (playerCount < item.minPlayers) return false;
    if (item.maxPlayers && playerCount > item.maxPlayers) return false;

    return true;
  });
}

/**
 * Resolves player token placeholders in challenge text:
 * {CURRENT_PLAYER}, {TARGET_PLAYER}, {NEXT_PLAYER}, {RANDOM_OTHER}, {PARTNER_A}, {PARTNER_B}
 */
export function formatChallengeTokens(
  rawText: string,
  options: {
    currentPlayer?: Player;
    allPlayers?: Player[];
    partnerAName?: string;
    partnerBName?: string;
  }
): string {
  let text = rawText;
  const { currentPlayer, allPlayers = [], partnerAName, partnerBName } = options;

  if (partnerAName) {
    text = text.replace(/\{PARTNER_A\}/g, partnerAName);
  }
  if (partnerBName) {
    text = text.replace(/\{PARTNER_B\}/g, partnerBName);
  }

  if (currentPlayer) {
    text = text.replace(/\{CURRENT_PLAYER\}/g, currentPlayer.name);
  }

  if (allPlayers.length > 0) {
    const currentIndex = currentPlayer
      ? allPlayers.findIndex((p) => p.id === currentPlayer.id)
      : 0;

    // Next player (to the left/cyclic)
    const nextPlayer = allPlayers[(currentIndex + 1) % allPlayers.length];
    text = text.replace(/\{NEXT_PLAYER\}/g, nextPlayer.name);

    // Target player / Random other
    const otherPlayers = allPlayers.filter((p) => p.id !== currentPlayer?.id);
    const targetPlayer = otherPlayers.length > 0
      ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
      : (allPlayers[0] || { name: 'เพื่อน' });

    text = text.replace(/\{TARGET_PLAYER\}/g, targetPlayer.name);
    text = text.replace(/\{RANDOM_OTHER\}/g, targetPlayer.name);
  }

  return text;
}

/**
 * Select next challenge with strict gating, safe fallback, and category/phase balancing.
 */
export function selectNextUnifiedChallenge(criteria: SelectionCriteria): SelectionResult | null {
  const {
    pool,
    completedIds,
    lastCategory,
    currentPhase,
    currentPermittedIntensity,
    currentPlayer,
    allPlayers,
    partnerAName,
    partnerBName,
  } = criteria;

  // 1. Apply hard eligibility filtering
  const eligiblePool = filterEligibleChallenges(pool, criteria);
  if (eligiblePool.length === 0) {
    // If the pool is empty even under strict gates, search for the safest lower-intensity item in the same mode
    const emergencySafePool = pool.filter(
      (c) => c.mode === criteria.mode && c.intensity <= 1 && (!c.isPhysical || criteria.boundaries.allowPhysical)
    );
    if (emergencySafePool.length === 0) return null;
    const fallbackItem = emergencySafePool[Math.floor(Math.random() * emergencySafePool.length)];
    return {
      challenge: {
        ...fallbackItem,
        content: formatChallengeTokens(fallbackItem.content, {
          currentPlayer,
          allPlayers,
          partnerAName,
          partnerBName,
        }),
      },
      updatedCompletedIds: [...completedIds, fallbackItem.id],
      isNewCycle: true,
    };
  }

  // 2. Identify unplayed items
  const unplayed = eligiblePool.filter((item) => !completedIds.includes(item.id));

  let candidatePool: UnifiedChallenge[];
  let updatedCompletedIds: string[];
  let isNewCycle = false;

  if (unplayed.length > 0) {
    candidatePool = unplayed;
    updatedCompletedIds = [...completedIds];
  } else {
    // Cycle exhausted: recycle eligible pool, keeping a recent cooldown buffer
    isNewCycle = true;
    const cooldownSize = Math.min(3, Math.floor(eligiblePool.length / 2));
    const recentCooldownIds = completedIds.slice(-cooldownSize);

    candidatePool = eligiblePool.filter((item) => !recentCooldownIds.includes(item.id));
    if (candidatePool.length === 0) {
      candidatePool = eligiblePool;
    }
    updatedCompletedIds = [...recentCooldownIds];
  }

  // 3. Weight candidates: Phase alignment, Category variety, Pacing match
  const hasDifferentCategory = lastCategory
    ? candidatePool.some((c) => !c.categories.includes(lastCategory))
    : false;

  const scored = candidatePool.map((item) => {
    let weight = 10;

    // Match exact target permitted intensity: encourage feeling the wave
    if (item.intensity === currentPermittedIntensity) {
      weight += 15;
    }

    // Phase alignment
    if (item.allowedPhases && item.allowedPhases.includes(currentPhase)) {
      weight += 10;
    }

    // Category diversity: if other categories are available, de-weight repeating
    if (lastCategory && hasDifferentCategory) {
      if (item.categories.includes(lastCategory)) {
        weight = Math.max(1, Math.floor(weight * 0.1));
      } else {
        weight += 10;
      }
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

  // 5. Format tokens
  const formattedContent = formatChallengeTokens(selected.content, {
    currentPlayer,
    allPlayers,
    partnerAName,
    partnerBName,
  });

  const formattedAlternative = selected.alternativeAction
    ? formatChallengeTokens(selected.alternativeAction, {
        currentPlayer,
        allPlayers,
        partnerAName,
        partnerBName,
      })
    : undefined;

  return {
    challenge: {
      ...selected,
      content: formattedContent,
      alternativeAction: formattedAlternative,
    },
    updatedCompletedIds,
    isNewCycle,
  };
}
