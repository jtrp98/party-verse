import {
  UnifiedChallenge,
  GameMode,
  ChallengeType,
  IntensityLevel,
  RelationshipStage,
  IntimacyLevel,
  GamePhase,
  SessionBoundaries,
  Player,
  ContentRating,
  NormalPack,
  AreaType,
} from '../types/redesign';

export interface SelectionCriteria {
  pool: UnifiedChallenge[];
  mode: GameMode;
  preferredType?: ChallengeType;
  currentPermittedIntensity: IntensityLevel;
  maxAllowedIntensity: IntensityLevel;
  currentPhase: GamePhase;
  boundaries: SessionBoundaries;
  completedIds: string[];
  playerCount: number;
  relationshipStage?: RelationshipStage;
  intimacyLevel?: IntimacyLevel;
  rating?: ContentRating;
  normalPack?: NormalPack;
  areaType?: AreaType;
  optInPlayerIds?: string[];
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
    intimacyLevel,
    rating,
    normalPack,
    areaType,
    optInPlayerIds,
  } = criteria;

  return pool.filter((item) => {
    // 1. Mode Gate
    if (item.mode !== mode) return false;

    // 2. Rating Gate: NORMAL mode strictly forbids adult/NSFW content and 18+ topics
    if (rating === 'NORMAL') {
      if (item.rating === 'NSFW') return false;
      if (item.intensity >= 3) return false;
      if (item.adultTopic && item.adultTopic !== 'GENERAL') return false;
      if (normalPack && item.normalPack && item.normalPack !== normalPack) return false;
    }

    // 3. Hard Intensity Gate: Never exceed current permitted intensity or session ceiling
    if (item.intensity > currentPermittedIntensity) return false;
    if (item.intensity > maxAllowedIntensity) return false;

    // 4. Couple Mode: Relationship Stage & Intimacy Level Gate
    if (mode === 'COUPLE') {
      if (intimacyLevel && item.intimacyLevel && item.intimacyLevel > intimacyLevel) {
        return false;
      }
      if (relationshipStage && item.relationshipStages && !item.relationshipStages.includes(relationshipStage)) {
        return false;
      }
    }

    // 5. Area Gate: Challenges requiring privacy can ONLY be opened in private areas
    if (areaType === 'PUBLIC' && item.requiresPrivacy) {
      return false;
    }

    // 6. Opt-in Pool Gate: Multi-person NSFW challenges require participating players to be in opt-in pool
    if (rating === 'NSFW' && item.participantCount && item.participantCount >= 2 && optInPlayerIds) {
      // Need at least participantCount players in opt-in pool
      if (optInPlayerIds.length < item.participantCount) {
        return false;
      }
    }

    // 7. Boundary Gate: Physical touch
    if (!boundaries.allowPhysical && item.isPhysical) {
      return false;
    }

    // 8. Boundary Gate: Explicit adult talk (intensity 3+)
    if (!boundaries.allowExplicitTalk && item.intensity >= 3) {
      return false;
    }

    // 9. Player Count Gate
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
    optInPlayerIds?: string[];
  }
): string {
  let text = rawText;
  const { currentPlayer, allPlayers = [], partnerAName, partnerBName, optInPlayerIds } = options;

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

    // Target player / Random other - prioritize opt-in pool if available
    let eligibleOthers = allPlayers.filter((p) => p.id !== currentPlayer?.id);
    if (optInPlayerIds && optInPlayerIds.length > 0) {
      const optInOthers = eligibleOthers.filter((p) => optInPlayerIds.includes(p.id));
      if (optInOthers.length > 0) {
        eligibleOthers = optInOthers;
      }
    }

    const targetPlayer = eligibleOthers.length > 0
      ? eligibleOthers[Math.floor(Math.random() * eligibleOthers.length)]
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
  const baseEligiblePool = filterEligibleChallenges(pool, criteria);
  if (baseEligiblePool.length === 0) {
    // If the pool is empty even under strict gates, search for the safest lower-intensity item in the same mode and relationship stage
    const emergencySafePool = pool.filter(
      (c) =>
        c.mode === criteria.mode &&
        c.intensity <= 1 &&
        (criteria.rating !== 'NORMAL' || c.rating !== 'NSFW') &&
        (!criteria.relationshipStage || !c.relationshipStages || c.relationshipStages.includes(criteria.relationshipStage)) &&
        (!c.isPhysical || criteria.boundaries.allowPhysical) &&
        (criteria.boundaries.allowExplicitTalk || c.intensity < 3)
    );
    if (emergencySafePool.length === 0) {
      return {
        challenge: {
          id: `safe_pass_${Date.now()}`,
          mode: criteria.mode,
          type: 'CHALLENGE',
          title: 'ผ่านรอบนี้ (Pass)',
          content: 'ไม่มีโจทย์ที่เข้าเงื่อนไขในรอบนี้ ผู้เล่นสามารถขอ Pass เพื่อส่งมือถือให้คนถัดไปได้ทันที',
          intensity: 1,
          categories: ['PASS'],
          minPlayers: criteria.playerCount,
          requiresConsent: false,
          isPhysical: false,
          alternativeAction: 'ส่งต่อให้ผู้เล่นคนถัดไป',
          rating: criteria.rating || 'NORMAL',
        },
        updatedCompletedIds: completedIds,
        isNewCycle: false,
      };
    }
    const fallbackItem = emergencySafePool[Math.floor(Math.random() * emergencySafePool.length)];
    return {
      challenge: {
        ...fallbackItem,
        content: formatChallengeTokens(fallbackItem.content, {
          currentPlayer,
          allPlayers,
          partnerAName,
          partnerBName,
          optInPlayerIds: criteria.optInPlayerIds,
        }),
      },
      updatedCompletedIds: [...completedIds, fallbackItem.id],
      isNewCycle: true,
    };
  }

  // 1.1 Apply preferred type filtering if requested and available
  const typeFilteredPool = criteria.preferredType
    ? baseEligiblePool.filter((item) => item.type === criteria.preferredType)
    : [];
  const eligiblePool = typeFilteredPool.length > 0 ? typeFilteredPool : baseEligiblePool;

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

  // 2.1 Prioritize current target permitted intensity if available in candidate pool
  const exactIntensityPool = candidatePool.filter((item) => item.intensity === currentPermittedIntensity);
  if (exactIntensityPool.length > 0) {
    candidatePool = exactIntensityPool;
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
    optInPlayerIds: criteria.optInPlayerIds,
  });

  const formattedAlternative = selected.alternativeAction
    ? formatChallengeTokens(selected.alternativeAction, {
        currentPlayer,
        allPlayers,
        partnerAName,
        partnerBName,
        optInPlayerIds: criteria.optInPlayerIds,
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
