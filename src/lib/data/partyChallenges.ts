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
  ...CHILL_TRUTH_OR_DARE.map((item, idx): UnifiedChallenge => {
    let normalPack: 'FUN' | 'DEEP_TALK' | 'COMPETITION' = 'FUN';
    if (item.category === 'COMPETITION' || item.type === 'DARE') {
      normalPack = idx % 2 === 0 ? 'COMPETITION' : 'FUN';
    } else if (item.category === 'CONFESSION' || item.text.includes('เคย') || item.text.includes('ความลับ')) {
      normalPack = 'DEEP_TALK';
    }
    return {
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
      rating: 'NORMAL',
      normalPack,
      requiresPrivacy: false,
      participantCount: 1,
    };
  }),

  // =========================================================================
  // LEVEL 2: FLIRTY (Intensity 2) - Playful attraction, compliments, eye contact
  // =========================================================================
  ...FLIRTY_TRUTH_OR_DARE.map((item, idx): UnifiedChallenge => {
    const isTouch = item.type === 'DARE' && (
      item.text.includes('จับมือ') ||
      item.text.includes('กอด') ||
      item.text.includes('สัมผัส') ||
      item.text.includes('แตะ')
    );
    let normalPack: 'FUN' | 'DEEP_TALK' | 'COMPETITION' = 'FUN';
    if (item.category === 'CONFESSION' || item.category === 'RELATIONSHIP') {
      normalPack = idx % 2 === 0 ? 'DEEP_TALK' : 'FUN';
    } else if (item.category === 'COMPETITION' || item.type === 'DARE') {
      normalPack = 'COMPETITION';
    }
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
      rating: 'NORMAL',
      normalPack,
      requiresPrivacy: false,
      participantCount: isTouch ? 2 : 1,
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
    rating: 'NSFW',
    requiresPrivacy: false,
    participantCount: 1,
  })),

  // =========================================================================
  // LEVEL 4: NAUGHTY (Intensity 4) - 18+ Consensual closeness, touch, daring physical challenges
  // STRICT REQUIREMENT: Physical participation optional, affirmative consent required!
  // =========================================================================
  ...NAUGHTY_TRUTH_OR_DARE.map((item): UnifiedChallenge => {
    const isTouch = Boolean(item.requiresConsent) || (
      item.text.includes('จับ') ||
      item.text.includes('กอด') ||
      item.text.includes('สัมผัส') ||
      item.text.includes('แตะ') ||
      item.text.includes('วางมือ') ||
      item.text.includes('สกินชิพ')
    );
    return {
      id: item.id,
      mode: 'PARTY',
      type: item.type,
      content: item.text,
      intensity: 4,
      categories: [item.category || 'INTIMACY'],
      minPlayers: 3,
      allowedPhases: ['PEAK', 'FINALE'],
      requiresConsent: isTouch,
      isPhysical: isTouch,
      alternativeAction: 'สามารถปฏิเสธได้ทันทีโดยไม่มีใครว่า หรือเลือกตอบคำถามธรรมดา 1 ข้อแทน',
      estimatedDuration: item.timerSeconds || 60,
      tags: ['naughty', 'physical_closeness', 'consensual'],
      rating: 'NSFW',
      requiresPrivacy: true,
      participantCount: isTouch ? 2 : 1,
    };
  }),

  // =========================================================================
  // LEVEL 5: UNLEASHED / AFTER DARK MAX (Intensity 5) - Highest intensity adult experience
  // Comprehensive adult conversations: ONS, Group Sex, Anal Sex, Fantasies, Kinks, Boundaries
  // STRICT REQUIREMENT: Never in WARM_UP! Gated exclusively for PEAK and FINALE!
  // =========================================================================
  ...UNLEASHED_TRUTH_OR_DARE.map((item): UnifiedChallenge => {
    const isTouch = Boolean(item.requiresConsent) && (
      item.text.includes('จับ') ||
      item.text.includes('กอด') ||
      item.text.includes('สัมผัส') ||
      item.text.includes('แตะ') ||
      item.text.includes('วางมือ') ||
      item.text.includes('สกินชิพ')
    );

    let adultTopic: UnifiedChallenge['adultTopic'] = 'GENERAL';
    if (item.text.includes('One-Night') || item.text.includes('ONS')) adultTopic = 'ONS';
    else if (item.text.includes('Threesome') || item.text.includes('Group Sex')) adultTopic = 'GROUP_SEX';
    else if (item.text.includes('Anal')) adultTopic = 'ANAL_SEX';
    else if (item.text.includes('แฟนตาซี') || item.text.includes('Fantasy')) adultTopic = 'FANTASIES';
    else if (item.text.includes('FWB') || item.text.includes('Casual')) adultTopic = 'CASUAL_SEX';
    else if (item.text.includes('Open') || item.text.includes('Non-monogamous')) adultTopic = 'NON_MONOGAMY';
    else if (item.text.includes('Hard Limit') || item.text.includes('Safe Word') || item.text.includes('ขอบเขต')) adultTopic = 'BOUNDARIES';
    else if (item.text.includes('รสนิยม') || item.text.includes('Kink') || item.text.includes('Toys')) adultTopic = 'ROLEPLAY_KINKS';

    let type: UnifiedChallenge['type'] = item.type;
    if (item.category === 'WHO_LIKELY' || item.text.includes('โหวตชี้')) {
      type = 'VOTE';
    }

    return {
      id: item.id,
      mode: 'PARTY',
      type,
      content: item.text,
      intensity: 5,
      categories: [item.category || 'WILDCARD'],
      minPlayers: 3,
      allowedPhases: ['PEAK', 'FINALE'], // NEVER WARM_UP
      requiresConsent: isTouch,
      isPhysical: isTouch,
      alternativeAction: item.drinkAlternative
        ? `Pass ได้อย่างปลอดภัย หรือ ${item.drinkAlternative}`
        : 'Pass ไปยังผู้เล่นคนถัดไปได้ทันทีโดยไม่มีบทลงโทษ',
      estimatedDuration: item.timerSeconds || 45,
      tags: ['unleashed', 'after_dark_max', 'adult_curiosity'],
      adultTopic,
      rating: 'NSFW',
      requiresPrivacy: true,
      participantCount: adultTopic === 'GROUP_SEX' ? 3 : 2,
    };
  }),
];
