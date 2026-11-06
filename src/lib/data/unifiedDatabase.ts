import { UnifiedChallenge } from '../types/redesign';
import { PARTY_CHALLENGES } from './partyChallenges';
import { COUPLE_CHALLENGES } from './coupleChallenges';

export { PARTY_CHALLENGES } from './partyChallenges';
export { COUPLE_CHALLENGES } from './coupleChallenges';

export const ALL_UNIFIED_CHALLENGES: UnifiedChallenge[] = [
  ...PARTY_CHALLENGES,
  ...COUPLE_CHALLENGES,
];
