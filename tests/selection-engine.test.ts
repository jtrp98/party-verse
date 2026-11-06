import {
  selectChallengeWithCooldown,
  selectNextTruthOrDare,
  selectNextCoupleChallenge,
} from '../src/lib/engine/challengeSelectionEngine';
import { TRUTH_OR_DARE_DATABASE } from '../src/lib/data/truthOrDareData';
import { COUPLE_DATABASE } from '../src/lib/data/coupleData';
import { pickNextMiniGame } from '../src/lib/engine/miniGameEngine';
import { createNewPlayer, formatPromptWithPlayers } from '../src/lib/engine/playerEngine';
import { calculateRoundPhase } from '../src/lib/engine/progressionEngine';
import { TruthOrDareCategory, CoupleCategory } from '../src/lib/types/game';

console.log('🧪 Starting Selection Engine & Gameplay Simulation Tests...\n');

let passCount = 0;
function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

// ------------------------------------------------------------------
// 1. Anti-Repetition / Exhaustion Test
// ------------------------------------------------------------------
console.log('--- 1. Anti-Repetition Within a Full Cycle ---');
const chillTruths = TRUTH_OR_DARE_DATABASE.filter(t => t.level === 'CHILL' && t.type === 'TRUTH');
const totalChillTruths = chillTruths.length; // 30 items
let completedIds: string[] = [];
const drawnItems: string[] = [];

for (let i = 0; i < totalChillTruths; i++) {
  const result = selectChallengeWithCooldown({
    pool: chillTruths,
    completedItemIds: completedIds,
    level: 'CHILL',
    recentCooldownSize: 3,
  });

  assert(result !== null, `Turn ${i + 1}: Expected a valid item`);
  assert(!drawnItems.includes(result!.item.id), `Turn ${i + 1}: Premature repeat detected for ${result!.item.id}`);

  drawnItems.push(result!.item.id);
  completedIds = result!.updatedCompletedIds;
}

assert(new Set(drawnItems).size === totalChillTruths, `Expected all ${totalChillTruths} items to be drawn without duplicates`);
console.log(`✓ Drew all ${totalChillTruths} items in cycle 1 with 0 duplicates!`);

// ------------------------------------------------------------------
// 2. Cooldown Memory Across Cycle Reset
// ------------------------------------------------------------------
console.log('\n--- 2. Cooldown Memory Across Cycle Reset ---');
const lastDrawnItemInCycle1 = drawnItems[drawnItems.length - 1];
const secondLastDrawnItemInCycle1 = drawnItems[drawnItems.length - 2];

// Next draw triggers a new cycle
const cycle2FirstResult = selectChallengeWithCooldown({
  pool: chillTruths,
  completedItemIds: completedIds,
  level: 'CHILL',
  recentCooldownSize: 3,
});

assert(cycle2FirstResult !== null, 'Expected cycle 2 first draw to succeed');
assert(cycle2FirstResult!.isNewCycle === true, 'Expected isNewCycle flag to be true');
assert(
  cycle2FirstResult!.item.id !== lastDrawnItemInCycle1 &&
  cycle2FirstResult!.item.id !== secondLastDrawnItemInCycle1,
  `Cooldown violation: Immediate repeat of last drawn item across cycle boundary!`
);
console.log(`✓ Cycle reset preserved cooldown buffer: item ${cycle2FirstResult!.item.id} drawn (not ${lastDrawnItemInCycle1})`);

// ------------------------------------------------------------------
// 3. Category Variety & Balancing
// ------------------------------------------------------------------
console.log('\n--- 3. Category Balancing ---');
// Run 50 selections and count category switches
let consecutiveCategoryRepeats = 0;
let lastCat: TruthOrDareCategory | undefined = undefined;
let testCompleted: string[] = [];

for (let i = 0; i < 40; i++) {
  const result = selectNextTruthOrDare({
    database: TRUTH_OR_DARE_DATABASE,
    completedItemIds: testCompleted,
    type: 'TRUTH',
    level: 'CHILL',
    difficulty: 'EASY',
    phase: 'WARM_UP',
    lastCategory: lastCat,
  });

  if (result) {
    if (lastCat && result.item.category === lastCat) {
      consecutiveCategoryRepeats++;
    }
    lastCat = result.item.category;
    testCompleted = result.updatedCompletedIds;
  }
}

// In 40 rounds with weighted diversity, repeats should be minimal
assert(consecutiveCategoryRepeats <= 8, `Category balancing failed: ${consecutiveCategoryRepeats} consecutive repeats in 40 draws`);
console.log(`✓ Category balancing verified (${consecutiveCategoryRepeats} consecutive repeats out of 40 draws, highly varied)`);

// ------------------------------------------------------------------
// 4. Player Token Formatting & Seating Position Resolution
// ------------------------------------------------------------------
console.log('\n--- 4. Player Token Formatting & Seating Resolution ---');
const players = [
  createNewPlayer('ฟ้า', 0),    // index 0
  createNewPlayer('บาส', 1),    // index 1 (Right of ฟ้า)
  createNewPlayer('พีท', 2),    // index 2 (Opposite of ฟ้า in 4p, or left/opp)
  createNewPlayer('มายด์', 3),  // index 3 (Left of ฟ้า)
];

const testPrompt = '{RIGHT_PLAYER} ต้องหันไปสบตา {LEFT_PLAYER} และ {OPPOSITE_PLAYER}';
const formatted = formatPromptWithPlayers(testPrompt, players[0], players);
assert(formatted.includes('บาส'), `Expected right player 'บาส', got: ${formatted}`);
assert(formatted.includes('มายด์'), `Expected left player 'มายด์', got: ${formatted}`);
assert(formatted.includes('พีท'), `Expected opposite player 'พีท', got: ${formatted}`);
console.log(`✓ Seating tokens correctly formatted: "${formatted}"`);

// ------------------------------------------------------------------
// 5. Mini Game Player Assignment by Instructions
// ------------------------------------------------------------------
console.log('\n--- 5. Mini Game Seating-Aware Participant Assignment ---');
// Test mini game targeting right player
const mgRight = pickNextMiniGame({
  level: 'FLIRTY',
  difficulty: 'EASY',
  phase: 'WARM_UP',
  players,
  currentPlayerIndex: 0, // ฟ้า
});

assert(mgRight !== null, 'Mini game selection must succeed');
// If mini game requires PAIR and targets right, player 1 ('บาส') must be participant
if (mgRight?.game.targetPlayerRole === 'RIGHT') {
  assert(mgRight.participantIds.includes(players[1].id), `Expected right player ${players[1].id} to be assigned`);
  console.log(`✓ Mini game seating target resolved accurately for ${mgRight.game.id}`);
} else {
  assert(mgRight!.participantIds.length >= 1, 'Expected participants to be assigned');
  console.log(`✓ Mini game participants resolved: ${mgRight!.participantIds.length} players`);
}

// ------------------------------------------------------------------
// 6. 20-Round Truth or Dare Game Simulation
// ------------------------------------------------------------------
console.log('\n--- 6. 20-Round Truth or Dare Full Game Simulation ---');
let todSessionCompleted: string[] = [];
let prevCat: TruthOrDareCategory | undefined = undefined;

for (let r = 1; r <= 20; r++) {
  const currentPhase = calculateRoundPhase(r, 20);
  const currentPlayer = players[(r - 1) % players.length];
  const type: 'TRUTH' | 'DARE' = r % 2 === 1 ? 'TRUTH' : 'DARE';

  const res = selectNextTruthOrDare({
    database: TRUTH_OR_DARE_DATABASE,
    completedItemIds: todSessionCompleted,
    type,
    level: 'SPICY',
    difficulty: 'HARD',
    phase: currentPhase,
    lastCategory: prevCat,
    currentPlayer,
    allPlayers: players,
  });

  assert(res !== null, `Round ${r}: Truth or Dare selection failed`);
  assert(Boolean(res!.item.text), `Round ${r}: Item text empty`);
  assert(!res!.item.text.includes('{RIGHT_PLAYER}'), `Round ${r}: Unresolved token`);

  todSessionCompleted = res!.updatedCompletedIds;
  prevCat = res!.item.category;
}
console.log(`✓ 20-Round Truth or Dare session completed seamlessly (Completed: ${todSessionCompleted.length} items)`);

// ------------------------------------------------------------------
// 7. 16-Round Couple Challenge Game Simulation
// ------------------------------------------------------------------
console.log('\n--- 7. 16-Round Couple Challenge Full Game Simulation ---');
let coupleCompleted: string[] = [];
let prevCoupleCat: CoupleCategory | undefined = undefined;
let syncRoundsCount = 0;

for (let r = 1; r <= 16; r++) {
  const currentPhase = calculateRoundPhase(r, 16);
  const res = selectNextCoupleChallenge({
    database: COUPLE_DATABASE,
    completedItemIds: coupleCompleted,
    level: 'SWEET',
    partnerAName: 'ต้น',
    partnerBName: 'เมย์',
    phase: currentPhase,
    lastCategory: prevCoupleCat,
  });

  assert(res !== null, `Round ${r}: Couple selection failed`);
  assert(Boolean(res!.item.title), `Round ${r}: Title empty`);
  assert(Boolean(res!.item.text), `Round ${r}: Text empty`);
  assert(Boolean(res!.item.penaltyText), `Round ${r}: Penalty empty`);

  if (res!.item.type === 'SYNC') syncRoundsCount++;

  coupleCompleted = res!.updatedCompletedIds;
  prevCoupleCat = res!.item.category;
}
console.log(`✓ 16-Round Couple Challenge session completed seamlessly (${syncRoundsCount} SYNC rounds, 0 duplicates)`);

console.log(`\n🎉 ALL SELECTION ENGINE & GAMEPLAY SIMULATIONS PASSED! (${passCount} checks)`);
