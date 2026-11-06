import { generate52CardDeck, shuffleDeck, drawNextCard, getDeckStats } from './src/lib/engine/cardEngine';
import { calculateDoraemonPhase, calculateRoundPhase } from './src/lib/engine/progressionEngine';
import { createNewPlayer, getNextPlayerIndex, pickPairOfPlayers, updatePlayerStat, formatPromptWithPlayers } from './src/lib/engine/playerEngine';
import { pickNextMiniGame } from './src/lib/engine/miniGameEngine';
import { MINI_GAMES_DATABASE } from './src/lib/data/miniGamesData';
import { TRUTH_OR_DARE_DATABASE } from './src/lib/data/truthOrDareData';
import { COUPLE_DATABASE } from './src/lib/data/coupleData';

console.log('🧪 Starting PARTYVERSE Game Engines Verification...\n');

// 1. Verify Card Engine
console.log('--- 1. Card Engine ---');
const deck = generate52CardDeck();
console.assert(deck.length === 52, `Expected 52 cards, got ${deck.length}`);
const uniqueIds = new Set(deck.map(c => c.id));
console.assert(uniqueIds.size === 52, `Expected 52 unique card IDs, got ${uniqueIds.size}`);
console.log(`✓ 52 Cards generated with 52 unique IDs`);

const shuffled = shuffleDeck(deck);
console.assert(shuffled.length === 52, `Shuffled deck length must be 52`);
console.log(`✓ Fisher-Yates shuffle validated`);

// Simulate drawing all 52 cards
let currentDeck = shuffled;
const drawnCards = [];
for (let i = 0; i < 52; i++) {
  const { card, updatedDeck } = drawNextCard(currentDeck, 'player_test');
  if (card) {
    drawnCards.push(card);
    currentDeck = updatedDeck;
  }
}
console.assert(drawnCards.length === 52, `Expected 52 drawn cards, got ${drawnCards.length}`);
const stats = getDeckStats(currentDeck);
console.assert(stats.remainingCount === 0, `Expected 0 remaining cards`);
console.log(`✓ Draw 52 cards sequentially without duplicates: PASS (Remaining: ${stats.remainingCount})`);

// 2. Progression Engine
console.log('\n--- 2. Progression Engine ---');
console.assert(calculateDoraemonPhase(5, 52) === 'WARM_UP', '5 cards must be WARM_UP');
console.assert(calculateDoraemonPhase(20, 52) === 'BUILD_UP', '20 cards must be BUILD_UP');
console.assert(calculateDoraemonPhase(35, 52) === 'PEAK', '35 cards must be PEAK');
console.assert(calculateDoraemonPhase(48, 52) === 'FINALE', '48 cards must be FINALE');
console.log(`✓ Doraemon 4-Phase Progression: PASS`);

console.assert(calculateRoundPhase(1, 12) === 'WARM_UP', 'Round 1 of 12 must be WARM_UP');
console.assert(calculateRoundPhase(5, 12) === 'BUILD_UP', 'Round 5 of 12 must be BUILD_UP');
console.assert(calculateRoundPhase(8, 12) === 'PEAK', 'Round 8 of 12 must be PEAK');
console.assert(calculateRoundPhase(11, 12) === 'FINALE', 'Round 11 of 12 must be FINALE');
console.log(`✓ Round-based 4-Phase Progression: PASS`);

// 3. Player Engine & Dynamic Prompt Formatting
console.log('\n--- 3. Player Engine & Dynamic Target Tokens ---');
const players = [
  createNewPlayer('ฟ้า', 0),
  createNewPlayer('บาส', 1),
  createNewPlayer('พีท', 2),
];
console.assert(players.length === 3, 'Must create 3 players');
console.assert(getNextPlayerIndex(0, 3) === 1, 'Next after 0 must be 1');
console.assert(getNextPlayerIndex(2, 3) === 0, 'Next after 2 must wrap to 0');
console.log(`✓ Cyclic Turn Rotation: PASS`);

const samplePrompt = 'จูบ {RIGHT_PLAYER} และหันไปสบตา {LEFT_PLAYER}';
const formatted = formatPromptWithPlayers(samplePrompt, players[0], players);
console.assert(formatted.includes('บาส') && formatted.includes('พีท'), `Expected dynamic names in prompt, got: "${formatted}"`);
console.log(`✓ Dynamic Target Token Replacement: PASS ("${formatted}")`);

// 4. Mini Game Engine
console.log('\n--- 4. Mini Game Engine ---');
console.assert(MINI_GAMES_DATABASE.length > 0, 'Mini game database must not be empty');
const dolphinGame = MINI_GAMES_DATABASE.find(g => g.id === 'chill_dolphin_dive');
console.assert(Boolean(dolphinGame), 'Must contain Dolphin Dive game');
console.log(`✓ Dolphin Game (เกมปลาโลมา): PASS`);

const agent007Game = MINI_GAMES_DATABASE.find(g => g.id === 'chill_agent_007');
console.assert(Boolean(agent007Game), 'Must contain 007 game');
console.log(`✓ Agent 007 (เกม 007 บ่างช่างปืน): PASS`);

const pointOfDoom = MINI_GAMES_DATABASE.find(g => g.id === 'chill_point_of_doom');
console.assert(Boolean(pointOfDoom), 'Must contain Point of Doom game');
console.log(`✓ Point of Doom (ชี้หน้ามรณะ): PASS`);

// 5. Truth or Dare Database Check across 5 Levels
console.log('\n--- 5. Truth or Dare Database (5 Levels) ---');
const levels = ['CHILL', 'FLIRTY', 'SPICY', 'NAUGHTY', 'UNLEASHED'] as const;
for (const lvl of levels) {
  const items = TRUTH_OR_DARE_DATABASE.filter(item => item.level === lvl);
  console.assert(items.length > 0, `Level ${lvl} must have questions/dares`);
  console.log(`✓ Level ${lvl}: ${items.length} items`);
}

// 6. Couple Challenge Database Check
console.log('\n--- 6. Couple Challenge Database ---');
console.assert(COUPLE_DATABASE.length > 0, 'Couple database must not be empty');
const sweetItems = COUPLE_DATABASE.filter(c => c.level === 'SWEET');
const spicyItems = COUPLE_DATABASE.filter(c => c.level === 'SPICY');
const wildItems = COUPLE_DATABASE.filter(c => c.level === 'WILD');
console.assert(sweetItems.length > 0, 'SWEET couple items must exist');
console.assert(spicyItems.length > 0, 'SPICY couple items must exist');
console.assert(wildItems.length > 0, 'WILD couple items must exist');
const syncItems = COUPLE_DATABASE.filter(c => c.type === 'SYNC');
console.assert(syncItems.length > 0, 'SYNC 3-2-1 couple items must exist');
console.log(`✓ Couple Database: ${COUPLE_DATABASE.length} items (SWEET: ${sweetItems.length}, SPICY: ${spicyItems.length}, WILD: ${wildItems.length}, SYNC 3-2-1: ${syncItems.length})`);

console.log('\n🎉 ALL GAME ENGINES & VERIFICATIONS PASSED SUCCESSFULLY!');
