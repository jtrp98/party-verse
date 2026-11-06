import {
  calculateGamePhase,
  calculateAllowedIntensity,
} from '../src/lib/engine/pacingEngine';
import {
  selectNextUnifiedChallenge,
  filterEligibleChallenges,
} from '../src/lib/engine/coreSelectionEngine';
import { PARTY_CHALLENGES } from '../src/lib/data/partyChallenges';
import { COUPLE_CHALLENGES } from '../src/lib/data/coupleChallenges';
import { Player, SessionBoundaries, IntensityLevel } from '../src/lib/types/redesign';

console.log('🧪 Starting Redesign Verification Test Suite (10 Required Core Tests)...\n');

let passCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

const mockPlayers: Player[] = [
  { id: 'p1', name: 'ต้น', avatarColor: 'bg-cyan-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p2', name: 'พลอย', avatarColor: 'bg-rose-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p3', name: 'มาร์ค', avatarColor: 'bg-amber-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
];

const defaultBoundaries: SessionBoundaries = {
  allowPhysical: true,
  allowAlcohol: true,
  allowExplicitTalk: true,
};

// =========================================================================
// TEST 1 — INTENSITY GATING
// A session selecting maximum intensity 5 must not start with intensity 5 automatically.
// =========================================================================
console.log('--- TEST 1: Intensity Gating (UNLEASHED does not start at 5) ---');
const round1Allowed = calculateAllowedIntensity(1, 20, 5);
assert(
  round1Allowed <= 2,
  `Round 1 with max intensity 5 must start at level 1 or 2 (Warm Up), got: ${round1Allowed}`
);

const round1Selection = selectNextUnifiedChallenge({
  pool: PARTY_CHALLENGES,
  mode: 'PARTY',
  currentPermittedIntensity: round1Allowed,
  maxAllowedIntensity: 5,
  currentPhase: 'WARM_UP',
  boundaries: defaultBoundaries,
  completedIds: [],
  playerCount: 3,
  currentPlayer: mockPlayers[0],
  allPlayers: mockPlayers,
});

assert(round1Selection !== null, 'Round 1 challenge must be selected');
assert(
  round1Selection!.challenge.intensity <= 2,
  `Round 1 challenge intensity must be <= 2, got: ${round1Selection!.challenge.intensity}`
);
console.log(`✓ Passed: Round 1 started safely at intensity ${round1Selection!.challenge.intensity} (Permitted cap: ${round1Allowed})`);

// =========================================================================
// TEST 2 — NO ILLEGAL ESCALATION
// Challenges above the current permitted intensity must never be selected.
// =========================================================================
console.log('\n--- TEST 2: No Illegal Escalation ---');
for (let targetCap = 1; targetCap <= 4; targetCap++) {
  for (let trial = 0; trial < 15; trial++) {
    const res = selectNextUnifiedChallenge({
      pool: PARTY_CHALLENGES,
      mode: 'PARTY',
      currentPermittedIntensity: targetCap as IntensityLevel,
      maxAllowedIntensity: 5,
      currentPhase: 'BUILD_UP',
      boundaries: defaultBoundaries,
      completedIds: [],
      playerCount: 3,
      currentPlayer: mockPlayers[0],
      allPlayers: mockPlayers,
    });
    assert(res !== null, `Trial ${trial} must return challenge`);
    assert(
      res!.challenge.intensity <= targetCap,
      `Illegal escalation! Requested cap: ${targetCap}, received: ${res!.challenge.intensity}`
    );
  }
}
console.log('✓ Passed: Zero illegal intensity escalations across 60 trials!');

// =========================================================================
// TEST 3 — RELATIONSHIP COMPATIBILITY
// BEFORE_DATING players must never receive challenges requiring ESTABLISHED_INTIMACY.
// =========================================================================
console.log('\n--- TEST 3: Relationship Compatibility ---');
for (let trial = 0; trial < 30; trial++) {
  const coupleRes = selectNextUnifiedChallenge({
    pool: COUPLE_CHALLENGES,
    mode: 'COUPLE',
    currentPermittedIntensity: 3,
    maxAllowedIntensity: 3,
    currentPhase: 'BUILD_UP',
    boundaries: defaultBoundaries,
    completedIds: [],
    playerCount: 2,
    relationshipStage: 'BEFORE_DATING',
    partnerAName: 'วิน',
    partnerBName: 'น้ำ',
  });

  assert(coupleRes !== null, 'Must select couple challenge');
  const stages = coupleRes!.challenge.relationshipStages;
  assert(
    !stages || stages.includes('BEFORE_DATING'),
    `Compatibility violation! BEFORE_DATING received inappropriate challenge: ${coupleRes!.challenge.id}`
  );
  assert(
    !stages || !stages.every((s) => s === 'ESTABLISHED_INTIMACY'),
    `BEFORE_DATING received exclusive ESTABLISHED_INTIMACY challenge: ${coupleRes!.challenge.id}`
  );
}
console.log('✓ Passed: Strict relationship stage gating preserved across 30 draws!');

// =========================================================================
// TEST 4 — PLAYER COUNT
// Party challenges must respect the configured number of participants.
// =========================================================================
console.log('\n--- TEST 4: Player Count Gating ---');
const eligibleFor3 = filterEligibleChallenges(PARTY_CHALLENGES, {
  pool: PARTY_CHALLENGES,
  mode: 'PARTY',
  currentPermittedIntensity: 5,
  maxAllowedIntensity: 5,
  currentPhase: 'PEAK',
  boundaries: defaultBoundaries,
  playerCount: 3,
});
for (const item of eligibleFor3) {
  assert(item.minPlayers <= 3, `Item ${item.id} requires ${item.minPlayers} players, but playerCount is 3`);
  if (item.maxPlayers) {
    assert(item.maxPlayers >= 3, `Item ${item.id} allows max ${item.maxPlayers} players, but playerCount is 3`);
  }
}
console.log(`✓ Passed: All ${eligibleFor3.length} eligible challenges respect 3-player bounds!`);

// =========================================================================
// TEST 5 — CONSENT & BOUNDARIES
// Challenges involving physical participation must respect boundaries.
// =========================================================================
console.log('\n--- TEST 5: Boundaries & Consent Filtering ---');
const soberNoPhysical: SessionBoundaries = {
  allowPhysical: false,
  allowAlcohol: false,
  allowExplicitTalk: false,
};

for (let trial = 0; trial < 30; trial++) {
  const res = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    currentPermittedIntensity: 2,
    maxAllowedIntensity: 2,
    currentPhase: 'BUILD_UP',
    boundaries: soberNoPhysical,
    completedIds: [],
    playerCount: 3,
    currentPlayer: mockPlayers[0],
    allPlayers: mockPlayers,
  });

  assert(res !== null, 'Must select non-physical challenge');
  assert(res!.challenge.isPhysical === false, `Boundary violation: isPhysical true when allowPhysical is false!`);
  assert(res!.challenge.intensity <= 2, `Boundary violation: intensity >= 3 when allowExplicitTalk is false!`);
}
console.log('✓ Passed: Zero physical or explicit challenges selected when boundaries are disabled!');

// =========================================================================
// TEST 6 — NO REPETITION
// Completed challenges must not be repeated during the same session.
// =========================================================================
console.log('\n--- TEST 6: Anti-Repetition Within Cycle ---');
let completedIds: string[] = [];
const seenChallengeIds = new Set<string>();
const testDrawCount = 20;

for (let i = 0; i < testDrawCount; i++) {
  const res = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    currentPermittedIntensity: 2,
    maxAllowedIntensity: 2,
    currentPhase: 'WARM_UP',
    boundaries: defaultBoundaries,
    completedIds,
    playerCount: 3,
    currentPlayer: mockPlayers[i % 3],
    allPlayers: mockPlayers,
  });

  assert(res !== null, `Draw ${i + 1} must return a challenge`);
  assert(!seenChallengeIds.has(res!.challenge.id), `Duplicate challenge detected: ${res!.challenge.id}`);
  seenChallengeIds.add(res!.challenge.id);
  completedIds = res!.updatedCompletedIds;
}
console.log(`✓ Passed: ${testDrawCount} consecutive challenges drawn with 0 duplicates!`);

// =========================================================================
// TEST 7 — SAFE FALLBACK
// An exhausted challenge pool must not cause the engine to bypass eligibility restrictions.
// =========================================================================
console.log('\n--- TEST 7: Safe Fallback on Pool Exhaustion ---');
// Create a small pool of 3 items
const smallPool = PARTY_CHALLENGES.filter((c) => c.intensity === 1).slice(0, 3);
const allIds = smallPool.map((c) => c.id);

// Exhaust the pool
const fallbackRes = selectNextUnifiedChallenge({
  pool: smallPool,
  mode: 'PARTY',
  currentPermittedIntensity: 1,
  maxAllowedIntensity: 1,
  currentPhase: 'WARM_UP',
  boundaries: defaultBoundaries,
  completedIds: allIds, // All exhausted
  playerCount: 3,
});

assert(fallbackRes !== null, 'Fallback must gracefully return an item');
assert(fallbackRes!.isNewCycle === true, 'Fallback must indicate isNewCycle');
assert(fallbackRes!.challenge.intensity === 1, 'Fallback must NEVER exceed intensity cap');
console.log('✓ Passed: Safe fallback recycled pool without escalating intensity!');

// =========================================================================
// TEST 8 — SESSION PROGRESSION
// Short and long sessions must both have coherent pacing.
// =========================================================================
console.log('\n--- TEST 8: Session Progression (Short 10 vs Long 30 rounds) ---');
// Short session (10 rounds, max intensity 5)
const shortPhases = Array.from({ length: 10 }, (_, i) => calculateGamePhase(i + 1, 10));
assert(shortPhases[0] === 'WARM_UP', 'Short round 1 must be WARM_UP');
assert(shortPhases[3] === 'BUILD_UP', 'Short round 4 must be BUILD_UP');
assert(shortPhases[6] === 'PEAK', 'Short round 7 must be PEAK');
assert(shortPhases[9] === 'FINALE', 'Short round 10 must be FINALE');

// Long session (30 rounds, max intensity 5)
const longPhases = Array.from({ length: 30 }, (_, i) => calculateGamePhase(i + 1, 30));
assert(longPhases[0] === 'WARM_UP', 'Long round 1 must be WARM_UP');
assert(longPhases[10] === 'BUILD_UP', 'Long round 11 must be BUILD_UP');
assert(longPhases[18] === 'PEAK', 'Long round 19 must be PEAK');
assert(longPhases[29] === 'FINALE', 'Long round 30 must be FINALE');

const shortIntensities = Array.from({ length: 10 }, (_, i) => calculateAllowedIntensity(i + 1, 10, 5));
assert(shortIntensities[0] <= 2, 'Short session round 1 must start <= 2');
assert(shortIntensities[9] === 5, 'Short session round 10 must reach 5');
console.log('✓ Passed: Coherent pacing curves verified across short & long sessions!');

// =========================================================================
// TEST 9 — COUPLE DIFFERENTIATION
// The same progression phase should produce appropriate experiences for different relationship stages.
// =========================================================================
console.log('\n--- TEST 9: Couple Differentiation by Relationship Stage ---');
const bdWarmUp = selectNextUnifiedChallenge({
  pool: COUPLE_CHALLENGES,
  mode: 'COUPLE',
  currentPermittedIntensity: 2,
  maxAllowedIntensity: 4,
  currentPhase: 'WARM_UP',
  boundaries: defaultBoundaries,
  completedIds: [],
  playerCount: 2,
  relationshipStage: 'BEFORE_DATING',
});

const eiWarmUp = selectNextUnifiedChallenge({
  pool: COUPLE_CHALLENGES,
  mode: 'COUPLE',
  currentPermittedIntensity: 2,
  maxAllowedIntensity: 4,
  currentPhase: 'WARM_UP',
  boundaries: defaultBoundaries,
  completedIds: [],
  playerCount: 2,
  relationshipStage: 'ESTABLISHED_INTIMACY',
});

assert(bdWarmUp !== null && eiWarmUp !== null, 'Both selections must succeed');
assert(bdWarmUp!.challenge.id !== eiWarmUp!.challenge.id, 'Different relationship stages must not share identical challenges');
assert(
  Boolean(bdWarmUp!.challenge.relationshipStages?.includes('BEFORE_DATING')),
  'BEFORE_DATING must receive stage-appropriate challenge'
);
assert(
  Boolean(eiWarmUp!.challenge.relationshipStages?.includes('ESTABLISHED_INTIMACY')),
  'ESTABLISHED_INTIMACY must receive stage-appropriate challenge'
);
console.log(`✓ Passed: Distinct experiences generated for BEFORE_DATING vs ESTABLISHED_INTIMACY!`);

// =========================================================================
// TEST 10 — GAMEPLAY COMPLETION
// Full session simulation without broken state, dead ends, or inconsistent transitions.
// =========================================================================
console.log('\n--- TEST 10: 100 Complete Session Simulations ---');
let totalSimulatedRounds = 0;

for (let sessionIndex = 0; sessionIndex < 100; sessionIndex++) {
  const isParty = sessionIndex % 2 === 0;
  const totalRounds = 15;
  const maxAllowedIntensity = ((sessionIndex % 5) + 1) as IntensityLevel;
  let sessionCompletedIds: string[] = [];
  let lastCategory: string | undefined = undefined;

  for (let r = 1; r <= totalRounds; r++) {
    const phase = calculateGamePhase(r, totalRounds);
    const allowedIntensity = calculateAllowedIntensity(r, totalRounds, maxAllowedIntensity);

    const res = selectNextUnifiedChallenge({
      pool: isParty ? PARTY_CHALLENGES : COUPLE_CHALLENGES,
      mode: isParty ? 'PARTY' : 'COUPLE',
      currentPermittedIntensity: allowedIntensity,
      maxAllowedIntensity,
      currentPhase: phase,
      boundaries: defaultBoundaries,
      completedIds: sessionCompletedIds,
      playerCount: isParty ? 4 : 2,
      relationshipStage: isParty ? undefined : (sessionIndex % 3 === 0 ? 'BEFORE_DATING' : sessionIndex % 3 === 1 ? 'BEFORE_INTIMACY' : 'ESTABLISHED_INTIMACY'),
      lastCategory,
      currentPlayer: isParty ? mockPlayers[r % 3] : undefined,
      allPlayers: isParty ? mockPlayers : undefined,
      partnerAName: 'บอย',
      partnerBName: 'ฝน',
    });

    assert(res !== null, `Session ${sessionIndex + 1} Round ${r} must not fail`);
    assert(res!.challenge.intensity <= allowedIntensity, `Session ${sessionIndex + 1} Round ${r} intensity exceeded`);
    sessionCompletedIds = res!.updatedCompletedIds;
    lastCategory = res!.challenge.categories[0];
    totalSimulatedRounds++;
  }
}
console.log(`✓ Passed: 100 complete sessions (${totalSimulatedRounds} rounds) simulated seamlessly!`);

console.log(`\n🎉 ALL 10 REDESIGN ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY! (${passCount} assertions)\n`);
