import { TRUTH_OR_DARE_DATABASE } from '../src/lib/data/truthOrDareData';
import { COUPLE_DATABASE } from '../src/lib/data/coupleData';
import { MINI_GAMES_DATABASE } from '../src/lib/data/miniGamesData';

console.log('🧪 Starting Database Integrity & Quality Validation...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ----------------------------------------------------
// 1. Quotas & Minimum Targets Check
// ----------------------------------------------------
console.log('--- 1. Target Volume Quotas ---');
console.log(`Truth or Dare: ${TRUTH_OR_DARE_DATABASE.length} items (Target: >= 250)`);
assert(TRUTH_OR_DARE_DATABASE.length >= 250, `Expected at least 250 Truth/Dare items, got ${TRUTH_OR_DARE_DATABASE.length}`);

console.log(`Couple Challenges: ${COUPLE_DATABASE.length} items (Target: >= 120)`);
assert(COUPLE_DATABASE.length >= 120, `Expected at least 120 Couple items, got ${COUPLE_DATABASE.length}`);

console.log(`Mini Games: ${MINI_GAMES_DATABASE.length} games (Target: >= 50)`);
assert(MINI_GAMES_DATABASE.length >= 50, `Expected at least 50 Mini games, got ${MINI_GAMES_DATABASE.length}`);
console.log('✓ All content volume quotas passed!');

// ----------------------------------------------------
// 2. ID Uniqueness Across Entire System
// ----------------------------------------------------
console.log('\n--- 2. ID Uniqueness ---');
const allIds = new Set<string>();

for (const item of TRUTH_OR_DARE_DATABASE) {
  assert(!allIds.has(item.id), `Duplicate ID in Truth/Dare: ${item.id}`);
  allIds.add(item.id);
}
console.log(`✓ Truth or Dare: ${TRUTH_OR_DARE_DATABASE.length} unique IDs`);

for (const item of COUPLE_DATABASE) {
  assert(!allIds.has(item.id), `Duplicate ID in Couple DB: ${item.id}`);
  allIds.add(item.id);
}
console.log(`✓ Couple Challenge: ${COUPLE_DATABASE.length} unique IDs`);

for (const item of MINI_GAMES_DATABASE) {
  assert(!allIds.has(item.id), `Duplicate ID in Mini Games DB: ${item.id}`);
  allIds.add(item.id);
}
console.log(`✓ Mini Games: ${MINI_GAMES_DATABASE.length} unique IDs`);
console.log(`✓ Total unique IDs across all databases: ${allIds.size}`);

// ----------------------------------------------------
// 3. Field Completeness & Non-Empty Content
// ----------------------------------------------------
console.log('\n--- 3. Field Validity & Non-Empty Content ---');

for (const item of TRUTH_OR_DARE_DATABASE) {
  assert(Boolean(item.id && item.id.trim()), 'Truth/Dare item missing ID');
  assert(item.type === 'TRUTH' || item.type === 'DARE', `Invalid type: ${item.type}`);
  assert(Boolean(item.text && item.text.trim()), `Empty text in Truth/Dare ${item.id}`);
  assert(Boolean(item.level), `Missing level in Truth/Dare ${item.id}`);
  assert(Boolean(item.difficulty), `Missing difficulty in Truth/Dare ${item.id}`);
  assert(Boolean(item.phase), `Missing phase in Truth/Dare ${item.id}`);
  assert(Boolean(item.category), `Missing category in Truth/Dare ${item.id}`);
}
console.log('✓ Truth or Dare: All fields, categories, and texts valid');

for (const item of COUPLE_DATABASE) {
  assert(Boolean(item.id && item.id.trim()), 'Couple item missing ID');
  assert(['SYNC', 'TRUTH', 'DARE'].includes(item.type), `Invalid couple type: ${item.type}`);
  assert(Boolean(item.title && item.title.trim()), `Empty title in Couple ${item.id}`);
  assert(Boolean(item.text && item.text.trim()), `Empty text in Couple ${item.id}`);
  assert(Boolean(item.penaltyText && item.penaltyText.trim()), `Empty penaltyText in Couple ${item.id}`);
  assert(Boolean(item.category), `Missing category in Couple ${item.id}`);
  if (item.type === 'SYNC') {
    assert(Array.isArray(item.options) && item.options.length === 2, `SYNC item ${item.id} must have 2 options`);
  }
}
console.log('✓ Couple Challenges: All fields, categories, options, and penalties valid');

for (const game of MINI_GAMES_DATABASE) {
  assert(Boolean(game.id && game.id.trim()), 'Mini game missing ID');
  assert(Boolean(game.title && game.title.trim()), `Empty title in Mini game ${game.id}`);
  assert(Boolean(game.description && game.description.trim()), `Empty description in Mini game ${game.id}`);
  assert(Array.isArray(game.instructions) && game.instructions.length > 0, `Mini game ${game.id} missing instructions`);
  assert(Boolean(game.penaltyText && game.penaltyText.trim()), `Empty penalty in Mini game ${game.id}`);
  assert(game.minPlayers >= 2, `Mini game ${game.id} minPlayers must be >= 2`);
}
console.log('✓ Mini Games: All fields, instructions, and requirements valid');

// ----------------------------------------------------
// 4. Duplicate Normalized Text Detector
// ----------------------------------------------------
console.log('\n--- 4. Normalized Text Duplication Check ---');
const normalizedTexts = new Set<string>();
function normalize(t: string) {
  return t.replace(/\s+/g, '').replace(/[!?,.():"']/g, '');
}

for (const item of TRUTH_OR_DARE_DATABASE) {
  const norm = normalize(item.text);
  assert(!normalizedTexts.has(norm), `Normalized duplicate text in Truth/Dare: "${item.text}"`);
  normalizedTexts.add(norm);
}

for (const item of COUPLE_DATABASE) {
  const norm = normalize(item.text);
  assert(!normalizedTexts.has(norm), `Normalized duplicate text in Couple DB: "${item.text}"`);
  normalizedTexts.add(norm);
}
console.log('✓ Zero duplicate or copy-paste text entries detected across databases!');

// ----------------------------------------------------
// 5. Check Elimination of Robotic Thai Clichés
// ----------------------------------------------------
console.log('\n--- 5. Cliché & Robotic Language Check ---');
const forbiddenClichés = [
  'สบตาประกบใจ',
  'นั่งตักสบตานาทีทอง',
  'ผู้บัญชาการสูงสุดแห่งค่ำคืนนี้',
];

const allCombinedContent = [
  ...TRUTH_OR_DARE_DATABASE.map(t => t.text + ' ' + (t.drinkAlternative || '')),
  ...COUPLE_DATABASE.map(c => c.title + ' ' + c.text + ' ' + c.penaltyText),
  ...MINI_GAMES_DATABASE.map(m => m.title + ' ' + m.description + ' ' + m.instructions.join(' ')),
].join(' ');

for (const cliché of forbiddenClichés) {
  assert(!allCombinedContent.includes(cliché), `Found forbidden robotic cliché: "${cliché}"`);
}
console.log('✓ All identified artificial / robotic Thai phrases successfully eradicated!');

// ----------------------------------------------------
// 6. Category & Level Distribution Check
// ----------------------------------------------------
console.log('\n--- 6. Content Distribution Stats ---');
const todVibes = ['CHILL', 'FLIRTY', 'SPICY', 'NAUGHTY', 'UNLEASHED'] as const;
for (const v of todVibes) {
  const count = TRUTH_OR_DARE_DATABASE.filter(t => t.level === v).length;
  console.log(`  Truth/Dare [${v}]: ${count} items`);
  assert(count >= 30, `Each Truth/Dare level must have at least 30 items`);
}

const coupleLevels = ['SWEET', 'SPICY', 'WILD'] as const;
for (const l of coupleLevels) {
  const count = COUPLE_DATABASE.filter(c => c.level === l).length;
  console.log(`  Couple [${l}]: ${count} items`);
  assert(count >= 30, `Each Couple level must have at least 30 items`);
}

for (const v of todVibes) {
  const count = MINI_GAMES_DATABASE.filter(m => m.level === v).length;
  console.log(`  Mini Games [${v}]: ${count} games`);
  assert(count >= 5, `Each Mini Game level must have at least 5 games`);
}

console.log(`\n🎉 DATABASE INTEGRITY VERIFICATION COMPLETED: ${passCount} checks passed (${failCount} failures)!`);
