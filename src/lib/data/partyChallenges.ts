import { UnifiedChallenge } from '../types/redesign';
import { CHILL_TRUTH_OR_DARE } from './truthOrDare/chill';
import { FLIRTY_TRUTH_OR_DARE } from './truthOrDare/flirty';
import { SPICY_TRUTH_OR_DARE } from './truthOrDare/spicy';
import { NAUGHTY_TRUTH_OR_DARE } from './truthOrDare/naughty';
import { UNLEASHED_TRUTH_OR_DARE } from './truthOrDare/unleashed';

/**
 * High-quality Party Mode challenges across 5 intensities (1: CHILL, 2: FLIRTY, 3: SPICY, 4: NAUGHTY, 5: UNLEASHED)
 * Minimum players: 3.
 * Strictly gated phases and affirmative consent flags.
 */
export const PARTY_CHALLENGES: UnifiedChallenge[] = [
  // =========================================================================
  // LEVEL 1: CHILL (Intensity 1) - Casual, funny, icebreaker, friendly games
  // =========================================================================
  ...CHILL_TRUTH_OR_DARE.map((item): UnifiedChallenge => ({
    id: item.id,
    mode: 'PARTY',
    type: item.type,
    content: item.text,
    intensity: 1,
    categories: [item.category || 'CONFESSION'],
    minPlayers: 3,
    allowedPhases: ['WARM_UP', 'BUILD_UP', 'PEAK', 'FINALE'],
    requiresConsent: false,
    isPhysical: false,
    alternativeAction: 'ขอ Pass รอบนี้ได้ฟรี หรือเล่าเรื่องตลกสั้นๆ 1 เรื่องให้เพื่อนฟัง',
    estimatedDuration: item.timerSeconds || 30,
    tags: ['chill', 'icebreaker', 'fun'],
  })),

  // =========================================================================
  // LEVEL 2: FLIRTY (Intensity 2) - Playful attraction, compliments, eye contact
  // =========================================================================
  ...FLIRTY_TRUTH_OR_DARE.map((item): UnifiedChallenge => {
    const isTouch = item.type === 'DARE' && (
      item.text.includes('จับมือ') ||
      item.text.includes('กอด') ||
      item.text.includes('สัมผัส') ||
      item.text.includes('แตะ')
    );
    return {
      id: item.id,
      mode: 'PARTY',
      type: item.type,
      content: item.text,
      intensity: 2,
      categories: [item.category || 'RELATIONSHIP'],
      minPlayers: 3,
      allowedPhases: ['WARM_UP', 'BUILD_UP', 'PEAK', 'FINALE'],
      requiresConsent: isTouch,
      isPhysical: isTouch,
      alternativeAction: 'ส่งมินิฮาร์ตให้เพื่อนรอบวง หรือดื่มเครื่องดื่ม 1 จิบ',
      estimatedDuration: item.timerSeconds || 30,
      tags: ['flirty', 'chemistry', 'playful'],
    };
  }),

  // =========================================================================
  // LEVEL 3: SPICY (Intensity 3) - 18+ Adult conversations, preferences, kinks
  // STRICT REQUIREMENT: Adult-oriented discussions, ZERO mandatory physical contact.
  // =========================================================================
  ...SPICY_TRUTH_OR_DARE.map((item): UnifiedChallenge => ({
    id: item.id,
    mode: 'PARTY',
    type: item.type,
    content: item.text,
    intensity: 3,
    categories: [item.category || 'CONFESSION'],
    minPlayers: 3,
    allowedPhases: ['BUILD_UP', 'PEAK', 'FINALE'],
    requiresConsent: false,
    isPhysical: false, // Spicy is strictly verbal/conversational adult discussion
    alternativeAction: 'ขอ Pass ไปยังผู้เล่นคนถัดไปโดยไม่มีบทลงโทษ หรือแชร์สเปกในฝันแทน',
    estimatedDuration: item.timerSeconds || 45,
    tags: ['spicy', 'adult_talk', '18plus'],
  })),

  // =========================================================================
  // LEVEL 4: NAUGHTY (Intensity 4) - 18+ Consensual closeness, touch, daring physical challenges
  // STRICT REQUIREMENT: Physical participation optional, affirmative consent required!
  // =========================================================================
  ...NAUGHTY_TRUTH_OR_DARE.map((item): UnifiedChallenge => {
    const isPhysicalDare = item.type === 'DARE';
    return {
      id: item.id,
      mode: 'PARTY',
      type: item.type,
      content: item.text,
      intensity: 4,
      categories: [item.category || 'INTIMACY'],
      minPlayers: 3,
      allowedPhases: ['PEAK', 'FINALE'],
      requiresConsent: true,
      isPhysical: isPhysicalDare,
      alternativeAction: 'สามารถปฏิเสธได้ทันทีโดยไม่มีใครว่า หรือเลือกตอบคำถามธรรมดา 1 ข้อแทน',
      estimatedDuration: item.timerSeconds || 60,
      tags: ['naughty', 'physical_closeness', 'consensual'],
    };
  }),

  // =========================================================================
  // LEVEL 5: UNLEASHED (Intensity 5) - Highest intensity adult experience, deep trust, novelty
  // STRICT REQUIREMENT: Never in WARM_UP! Gated exclusively for PEAK and FINALE!
  // =========================================================================
  ...UNLEASHED_TRUTH_OR_DARE.map((item): UnifiedChallenge => {
    const isPhysicalDare = item.type === 'DARE';
    return {
      id: item.id,
      mode: 'PARTY',
      type: item.type,
      content: item.text,
      intensity: 5,
      categories: [item.category || 'WILDCARD'],
      minPlayers: 3,
      allowedPhases: ['PEAK', 'FINALE'], // NEVER WARM_UP
      requiresConsent: true,
      isPhysical: isPhysicalDare,
      alternativeAction: 'กอดเพื่อนข้างๆ 1 ที หรือ Pass ไปยังผู้เล่นคนถัดไปอย่างปลอดภัย',
      estimatedDuration: item.timerSeconds || 60,
      tags: ['unleashed', 'adult_climax', 'high_trust'],
    };
  }),
];
