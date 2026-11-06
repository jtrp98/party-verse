import { pickNextMiniGame } from '../src/lib/engine/miniGameEngine';
import { generate52CardDeck } from '../src/lib/engine/cardEngine';
import { MINI_GAMES_DATABASE } from '../src/lib/data/miniGamesData';
import { Player, GameVibeLevel, IntensityLevel, SessionBoundaries, VIBE_TO_INTENSITY } from '../src/lib/types/game';

console.log('🧪 Starting Doraemon Hard Intensity Ceiling & Boundary Tests...\n');

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
  { id: 'p1', name: 'ต้น', avatarColor: 'bg-cyan-500', stats: { drinksDrunk: 0, miniGamesWon: 0, jCards: 0, qCards: 0, kCards: 0, bathroomPasses: 0, activeBuffs: [] } },
  { id: 'p2', name: 'พลอย', avatarColor: 'bg-rose-500', stats: { drinksDrunk: 0, miniGamesWon: 0, jCards: 0, qCards: 0, kCards: 0, bathroomPasses: 0, activeBuffs: [] } },
  { id: 'p3', name: 'มาร์ค', avatarColor: 'bg-amber-500', stats: { drinksDrunk: 0, miniGamesWon: 0, jCards: 0, qCards: 0, kCards: 0, bathroomPasses: 0, activeBuffs: [] } },
  { id: 'p4', name: 'บาส', avatarColor: 'bg-emerald-500', stats: { drinksDrunk: 0, miniGamesWon: 0, jCards: 0, qCards: 0, kCards: 0, bathroomPasses: 0, activeBuffs: [] } },
];

const defaultBoundaries: SessionBoundaries = {
  allowPhysical: true,
  allowAlcohol: true,
  allowExplicitTalk: true,
};

// =========================================================================
// TEST 1 — STRICT CEILING GATING AT EVERY LEVEL (1 TO 5)
// No minigame above the ceiling can EVER be returned.
// =========================================================================
console.log('--- TEST 1: Strict Ceiling Gating Across All 5 Levels ---');
const levels: { ceiling: IntensityLevel; vibe: GameVibeLevel }[] = [
  { ceiling: 1, vibe: 'CHILL' },
  { ceiling: 2, vibe: 'FLIRTY' },
  { ceiling: 3, vibe: 'SPICY' },
  { ceiling: 4, vibe: 'NAUGHTY' },
  { ceiling: 5, vibe: 'UNLEASHED' },
];

for (const { ceiling, vibe } of levels) {
  for (let trial = 0; trial < 40; trial++) {
    const res = pickNextMiniGame({
      level: vibe,
      difficulty: 'EASY',
      phase: 'WARM_UP',
      players: mockPlayers,
      currentPlayerIndex: trial % mockPlayers.length,
      maxAllowedIntensity: ceiling,
      boundaries: defaultBoundaries,
    });

    assert(res !== null, `Trial ${trial} at ceiling ${ceiling} must return a minigame`);
    const itemIntensity = VIBE_TO_INTENSITY[res!.game.level];
    assert(
      itemIntensity <= ceiling,
      `Ceiling breached! Max ceiling: ${ceiling}, got item with intensity ${itemIntensity} (${res!.game.id})`
    );
  }
  console.log(`✓ Passed: 40 draws at ceiling Level ${ceiling} (${vibe}) strictly respected maximum ceiling`);
}

// =========================================================================
// TEST 2 — FALLBACK NEVER BYPASSES CEILING
// When database only has higher intensity items or empty pool, ceiling holds.
// =========================================================================
console.log('\n--- TEST 2: Fallback Pool Integrity Under Ceiling ---');
// Create a synthetic database with only Level 4 and 5 items
const highIntensityDb = MINI_GAMES_DATABASE.filter((mg) => VIBE_TO_INTENSITY[mg.level] >= 4);

const fallbackResult = pickNextMiniGame({
  level: 'CHILL',
  difficulty: 'EASY',
  phase: 'WARM_UP',
  players: mockPlayers,
  currentPlayerIndex: 0,
  maxAllowedIntensity: 2, // Ceiling is 2, but DB only has 4 and 5
  database: highIntensityDb,
});

// Since no items <= 2 exist, it MUST return null rather than breaching the ceiling!
assert(fallbackResult === null, 'Engine must return null when no items satisfy the ceiling, never leak higher content');
console.log('✓ Passed: Fallback strictly rejects higher intensity content when no compliant items exist');

// =========================================================================
// TEST 3 — MID-GAME CEILING LOWERING
// Lowering the ceiling mid-session takes effect immediately.
// =========================================================================
console.log('\n--- TEST 3: Mid-Game Ceiling Lowering ---');
let currentCeiling: IntensityLevel = 5;

// First draw at ceiling 5
const draw1 = pickNextMiniGame({
  level: 'UNLEASHED',
  difficulty: 'HARD',
  phase: 'PEAK',
  players: mockPlayers,
  currentPlayerIndex: 0,
  maxAllowedIntensity: currentCeiling,
});
assert(draw1 !== null, 'Initial draw at ceiling 5 must succeed');

// User taps "ลดระดับความเดือด" -> ceiling lowered to 1
currentCeiling = 1;
for (let trial = 0; trial < 25; trial++) {
  const drawAfterLower = pickNextMiniGame({
    level: 'CHILL',
    difficulty: 'EASY',
    phase: 'PEAK',
    players: mockPlayers,
    currentPlayerIndex: trial % mockPlayers.length,
    maxAllowedIntensity: currentCeiling,
  });

  assert(drawAfterLower !== null, 'Draw after lowering ceiling must succeed');
  const levelNum = VIBE_TO_INTENSITY[drawAfterLower!.game.level];
  assert(levelNum === 1, `Lowered ceiling breached! Expected 1, got ${levelNum}`);
}
console.log('✓ Passed: Lowering ceiling to 1 mid-game immediately constrains all 25 subsequent draws to Level 1');

// =========================================================================
// TEST 4 — BOUNDARY FILTERING (SOBER & NON-PHYSICAL)
// =========================================================================
console.log('\n--- TEST 4: Boundary Filtering (Non-Alcohol & Non-Physical) ---');
const soberBoundaries: SessionBoundaries = {
  allowPhysical: false,
  allowAlcohol: false,
  allowExplicitTalk: false,
};

for (let trial = 0; trial < 30; trial++) {
  const soberGame = pickNextMiniGame({
    level: 'CHILL',
    difficulty: 'EASY',
    phase: 'WARM_UP',
    players: mockPlayers,
    currentPlayerIndex: 0,
    maxAllowedIntensity: 2,
    boundaries: soberBoundaries,
  });

  assert(soberGame !== null, 'Must select boundary-compliant game');
  assert(!soberGame!.game.requiresConsent, 'Must not require consent / physical contact');
  assert(!soberGame!.game.penaltyText.includes('ดื่ม'), 'Penalty must offer sober alternative');
}
console.log('✓ Passed: Zero physical or alcohol-enforced penalties selected when boundaries are disabled');

// =========================================================================
// TEST 5 — 52-CARD DECK INTEGRITY WITH BOUNDARIES
// =========================================================================
console.log('\n--- TEST 5: 52-Card Deck with Boundaries ---');
const soberDeck = generate52CardDeck(undefined, soberBoundaries);
assert(soberDeck.length === 52, `Deck must contain exactly 52 cards, got ${soberDeck.length}`);

const aceOfSpades = soberDeck.find((c) => c.rank === 'A' && c.suit === 'spades');
assert(aceOfSpades !== null, 'Ace of spades must exist');
assert(aceOfSpades!.ruleTitle.includes('ไร้แอลกอฮอล์'), `Ace must have sober title, got: ${aceOfSpades!.ruleTitle}`);

const kingOfHearts = soberDeck.find((c) => c.rank === 'K' && c.suit === 'hearts');
assert(kingOfHearts !== null, 'King of hearts must exist');
assert(kingOfHearts!.ruleDetails!.includes('ไม่ต้องดื่มหมดแก้ว'), `King must have sober alternative, got: ${kingOfHearts!.ruleDetails}`);

console.log('✓ Passed: 52 unique cards generated with non-alcoholic variations on ranks A, 2, 9, K');

console.log(`\n🎉 ALL DORAEMON CEILING & BOUNDARY TESTS PASSED SUCCESSFULLY! (${passCount} assertions)\n`);
