import {
  calculateGamePhase,
  calculateAllowedIntensity,
} from '../src/lib/engine/pacingEngine';
import {
  selectNextUnifiedChallenge,
} from '../src/lib/engine/coreSelectionEngine';
import { PARTY_CHALLENGES } from '../src/lib/data/partyChallenges';
import { COUPLE_CHALLENGES } from '../src/lib/data/coupleChallenges';
import { Player, SessionBoundaries } from '../src/lib/types/redesign';

console.log('🧪 Starting AFTERVERSE Master QA Verification Suite...\n');

let passCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

const mockPartyPlayers: Player[] = [
  { id: 'p1', name: 'ต้น', avatarColor: 'bg-cyan-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p2', name: 'พลอย', avatarColor: 'bg-rose-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p3', name: 'มาร์ค', avatarColor: 'bg-amber-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p4', name: 'บาส', avatarColor: 'bg-emerald-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p5', name: 'มายด์', avatarColor: 'bg-purple-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
  { id: 'p6', name: 'น้ำ', avatarColor: 'bg-orange-500', stats: { drinksDrunk: 0, challengesCompleted: 0, challengesSkipped: 0 } },
];

const fullBoundaries: SessionBoundaries = {
  allowPhysical: true,
  allowAlcohol: true,
  allowExplicitTalk: true,
};

// =========================================================================
// TEST 1 — CORE LOOP PLAYER CHOICE (TRUTH VS DARE GATING)
// =========================================================================
console.log('--- TEST 1: Core Loop Player Choice (Truth vs Dare Gating) ---');
for (let i = 0; i < 20; i++) {
  const truthSelection = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    preferredType: 'TRUTH',
    currentPermittedIntensity: 2,
    maxAllowedIntensity: 3,
    currentPhase: 'WARM_UP',
    boundaries: fullBoundaries,
    completedIds: [],
    playerCount: 6,
    currentPlayer: mockPartyPlayers[i % 6],
    allPlayers: mockPartyPlayers,
  });

  assert(truthSelection !== null, 'Truth selection must return an item');
  assert(truthSelection!.challenge.type === 'TRUTH', `Expected TRUTH item, got: ${truthSelection!.challenge.type}`);
}
console.log('✓ Passed: 20 consecutive TRUTH choices strictly returned TRUTH challenges');

for (let i = 0; i < 20; i++) {
  const dareSelection = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    preferredType: 'DARE',
    currentPermittedIntensity: 2,
    maxAllowedIntensity: 3,
    currentPhase: 'BUILD_UP',
    boundaries: fullBoundaries,
    completedIds: [],
    playerCount: 6,
    currentPlayer: mockPartyPlayers[i % 6],
    allPlayers: mockPartyPlayers,
  });

  assert(dareSelection !== null, 'Dare selection must return an item');
  assert(dareSelection!.challenge.type === 'DARE', `Expected DARE item, got: ${dareSelection!.challenge.type}`);
}
console.log('✓ Passed: 20 consecutive DARE choices strictly returned DARE challenges');

// =========================================================================
// TEST 2 — AFTER DARK MAX (LEVEL 5) POOL INTEGRITY & TOPICS
// =========================================================================
console.log('\n--- TEST 2: After Dark Max (Level 5) Content Coverage ---');

const partyMaxItems = PARTY_CHALLENGES.filter((c) => c.intensity === 5);
console.log(`Party Mode Level 5 items: ${partyMaxItems.length} (Target: >= 30)`);
assert(partyMaxItems.length >= 30, `Expected at least 30 Level 5 party items, got ${partyMaxItems.length}`);

// Adult Topic tags verified
const hasOns = partyMaxItems.some((c) => c.content.includes('One-Night') || c.content.includes('ONS') || c.adultTopic === 'ONS');
const hasGroupSex = partyMaxItems.some((c) => c.content.includes('Threesome') || c.content.includes('Group Sex') || c.adultTopic === 'GROUP_SEX');
const hasAnalSex = partyMaxItems.some((c) => c.content.includes('Anal') || c.adultTopic === 'ANAL_SEX');
const hasFantasies = partyMaxItems.some((c) => c.content.includes('แฟนตาซี') || c.adultTopic === 'FANTASIES');
const hasBoundaries = partyMaxItems.some((c) => c.content.includes('Safe Word') || c.content.includes('Hard Limit') || c.adultTopic === 'BOUNDARIES');

assert(hasOns, 'Level 5 must include ONS discussions');
assert(hasGroupSex, 'Level 5 must include Group Sex/Threesome discussions');
assert(hasAnalSex, 'Level 5 must include Anal Sex discussions');
assert(hasFantasies, 'Level 5 must include Sexual Fantasies');
assert(hasBoundaries, 'Level 5 must include Boundaries & Safe Words');
console.log('✓ Passed: All required adult topics (ONS, Group Sex, Anal Sex, Fantasies, Boundaries) present in Level 5');

const coupleMaxItems = COUPLE_CHALLENGES.filter((c) => c.intensity === 5 && c.relationshipStages?.includes('ESTABLISHED_INTIMACY'));
console.log(`Couple Mode Level 5 items: ${coupleMaxItems.length} (Target: >= 25)`);
assert(coupleMaxItems.length >= 25, `Expected at least 25 Level 5 couple items, got ${coupleMaxItems.length}`);
console.log('✓ Passed: Couple Mode Level 5 pool is well-stocked for ESTABLISHED_INTIMACY');

// =========================================================================
// TEST 3 — RELATIONSHIP STAGE GATING
// =========================================================================
console.log('\n--- TEST 3: Couple Relationship Stage Gating ---');

// BEFORE_DATING must never draw Level 4 or 5
for (let i = 0; i < 30; i++) {
  const selection = selectNextUnifiedChallenge({
    pool: COUPLE_CHALLENGES,
    mode: 'COUPLE',
    currentPermittedIntensity: 3,
    maxAllowedIntensity: 3,
    currentPhase: 'PEAK',
    boundaries: fullBoundaries,
    completedIds: [],
    playerCount: 2,
    relationshipStage: 'BEFORE_DATING',
    partnerAName: 'อเล็กซ์',
    partnerBName: 'เจมส์',
  });

  assert(selection !== null, 'Selection must succeed');
  assert(
    selection!.challenge.intensity <= 3,
    `BEFORE_DATING received intensity > 3: Level ${selection!.challenge.intensity}`
  );
  assert(
    Boolean(selection!.challenge.relationshipStages?.includes('BEFORE_DATING')),
    `BEFORE_DATING received incompatible stage item: ${selection!.challenge.id}`
  );
}
console.log('✓ Passed: BEFORE_DATING strictly constrained to <= Level 3');

// ESTABLISHED_INTIMACY draws Level 5 in Peak/Finale
const establishedPeakDraw = selectNextUnifiedChallenge({
  pool: COUPLE_CHALLENGES,
  mode: 'COUPLE',
  currentPermittedIntensity: 5,
  maxAllowedIntensity: 5,
  currentPhase: 'FINALE',
  boundaries: fullBoundaries,
  completedIds: [],
  playerCount: 2,
  relationshipStage: 'ESTABLISHED_INTIMACY',
  partnerAName: 'อเล็กซ์',
  partnerBName: 'เจมส์',
});
assert(establishedPeakDraw !== null, 'ESTABLISHED_INTIMACY must draw successfully');
assert(establishedPeakDraw!.challenge.intensity === 5, `Expected intensity 5, got ${establishedPeakDraw!.challenge.intensity}`);
console.log(`✓ Passed: ESTABLISHED_INTIMACY successfully drew Level 5 (${establishedPeakDraw!.challenge.id})`);

// =========================================================================
// TEST 4 — BOUNDARY FILTERING (ZERO TOUCH / ZERO EXPLICIT)
// =========================================================================
console.log('\n--- TEST 4: Boundary Filtering Under Level 5 Ceiling ---');

// 1. Physical Touch disabled
const noTouchBoundaries: SessionBoundaries = {
  allowPhysical: false,
  allowAlcohol: true,
  allowExplicitTalk: true,
};

for (let i = 0; i < 40; i++) {
  const res = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    currentPermittedIntensity: 4,
    maxAllowedIntensity: 5,
    currentPhase: 'PEAK',
    boundaries: noTouchBoundaries,
    completedIds: [],
    playerCount: 6,
    currentPlayer: mockPartyPlayers[i % 6],
    allPlayers: mockPartyPlayers,
  });

  assert(res !== null, 'Draw must succeed');
  assert(res!.challenge.isPhysical === false, `Physical challenge leaked when allowPhysical is false: ${res!.challenge.id}`);
}
console.log('✓ Passed: Zero physical challenges drawn when allowPhysical = false (40 draws)');

// 2. Explicit Talk disabled (Must cap intensity < 3)
const noExplicitBoundaries: SessionBoundaries = {
  allowPhysical: true,
  allowAlcohol: true,
  allowExplicitTalk: false,
};

for (let i = 0; i < 40; i++) {
  const res = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    currentPermittedIntensity: 2,
    maxAllowedIntensity: 5,
    currentPhase: 'FINALE',
    boundaries: noExplicitBoundaries,
    completedIds: [],
    playerCount: 6,
    currentPlayer: mockPartyPlayers[i % 6],
    allPlayers: mockPartyPlayers,
  });

  assert(res !== null, 'Draw must succeed');
  assert(res!.challenge.intensity < 3, `Explicit challenge (>= 3) leaked when allowExplicitTalk is false: Level ${res!.challenge.intensity}`);
}
console.log('✓ Passed: Zero explicit challenges (>= 3) drawn when allowExplicitTalk = false (40 draws)');

// =========================================================================
// TEST 5 — COERCION SCRUBBING VERIFICATION
// =========================================================================
console.log('\n--- TEST 5: Absolute Zero Coercion Verification ---');
const forbiddenCoercivePhrases = ['โดยห้ามปฏิเสธ', 'ห้ามขัด', 'ต้องทำตามคำสั่ง'];

for (const c of COUPLE_CHALLENGES) {
  for (const phrase of forbiddenCoercivePhrases) {
    assert(!c.content.includes(phrase), `Found coercive phrase "${phrase}" in couple challenge ${c.id}`);
  }
}
for (const p of PARTY_CHALLENGES) {
  for (const phrase of forbiddenCoercivePhrases) {
    assert(!p.content.includes(phrase), `Found coercive phrase "${phrase}" in party challenge ${p.id}`);
  }
}
console.log('✓ Passed: Zero coercive phrases across all Couple & Party challenge databases');

// =========================================================================
// TEST 6 — FULL SIMULATION: SCENARIO A (COUPLE MAX, 16 ROUNDS)
// =========================================================================
console.log('\n--- TEST 6: Scenario A — Couple Max Full 16-Round Simulation ---');
let coupleCompleted: string[] = [];
let syncMatches = 0;
let coupleLevel5Encountered = 0;

for (let round = 1; round <= 16; round++) {
  const phase = calculateGamePhase(round, 16);
  const allowed = calculateAllowedIntensity(round, 16, 5);

  const selection = selectNextUnifiedChallenge({
    pool: COUPLE_CHALLENGES,
    mode: 'COUPLE',
    currentPermittedIntensity: allowed,
    maxAllowedIntensity: 5,
    currentPhase: phase,
    boundaries: fullBoundaries,
    completedIds: coupleCompleted,
    playerCount: 2,
    relationshipStage: 'ESTABLISHED_INTIMACY',
    partnerAName: 'อเล็กซ์',
    partnerBName: 'เจมส์',
  });

  assert(selection !== null, `Round ${round} selection failed`);
  coupleCompleted = selection!.updatedCompletedIds;

  if (selection!.challenge.type === 'SYNC') {
    syncMatches++;
  }
  if (selection!.challenge.intensity === 5) {
    coupleLevel5Encountered++;
  }
}

assert(coupleCompleted.length === 16, `Expected 16 completed rounds, got ${coupleCompleted.length}`);
assert(coupleLevel5Encountered >= 3, `Expected at least 3 Level 5 items in Peak/Finale, got ${coupleLevel5Encountered}`);
console.log(`✓ Passed: Couple Max completed 16 rounds (${coupleLevel5Encountered} Level 5 moments, ${syncMatches} SYNC rounds)`);

// =========================================================================
// TEST 7 — FULL SIMULATION: SCENARIO B (PARTY MAX, 20 ROUNDS, 6 PLAYERS)
// =========================================================================
console.log('\n--- TEST 7: Scenario B — Party Max Full 20-Round Simulation (6 Players) ---');
let partyCompleted: string[] = [];
let partyLevel5Encountered = 0;
const playerTurnCounts: Record<string, number> = {};

for (let round = 1; round <= 20; round++) {
  const phase = calculateGamePhase(round, 20);
  const allowed = calculateAllowedIntensity(round, 20, 5);
  const activePlayer = mockPartyPlayers[(round - 1) % 6];
  playerTurnCounts[activePlayer.id] = (playerTurnCounts[activePlayer.id] || 0) + 1;

  // Alternate between player choosing TRUTH and DARE
  const preferredType = round % 2 === 1 ? 'TRUTH' : 'DARE';

  const selection = selectNextUnifiedChallenge({
    pool: PARTY_CHALLENGES,
    mode: 'PARTY',
    preferredType,
    currentPermittedIntensity: allowed,
    maxAllowedIntensity: 5,
    currentPhase: phase,
    boundaries: fullBoundaries,
    completedIds: partyCompleted,
    playerCount: 6,
    currentPlayer: activePlayer,
    allPlayers: mockPartyPlayers,
  });

  assert(selection !== null, `Party round ${round} selection failed`);
  partyCompleted = selection!.updatedCompletedIds;

  if (selection!.challenge.intensity === 5) {
    partyLevel5Encountered++;
  }
}

assert(partyCompleted.length === 20, `Expected 20 completed party rounds, got ${partyCompleted.length}`);
assert(partyLevel5Encountered >= 4, `Expected at least 4 Level 5 moments in Peak/Finale, got ${partyLevel5Encountered}`);

// Verify even turn distribution (each player got 3-4 turns)
for (const p of mockPartyPlayers) {
  assert(playerTurnCounts[p.id] >= 3, `Player ${p.name} had too few turns: ${playerTurnCounts[p.id]}`);
}
console.log(`✓ Passed: Party Max completed 20 rounds with 6 players evenly distributed (${partyLevel5Encountered} Level 5 moments)`);

console.log(`\n🎉 AFTERVERSE MASTER QA VERIFICATION PASSED: ${passCount} assertions succeeded (0 failures)!`);
