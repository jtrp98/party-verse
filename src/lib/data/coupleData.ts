import { CoupleItem } from '../types/game';
import { SWEET_COUPLE_CHALLENGES } from './couples/sweet';
import { SPICY_COUPLE_CHALLENGES } from './couples/spicy';
import { WILD_COUPLE_CHALLENGES } from './couples/wild';

export {
  SWEET_COUPLE_CHALLENGES,
  SPICY_COUPLE_CHALLENGES,
  WILD_COUPLE_CHALLENGES,
};

export const COUPLE_DATABASE: CoupleItem[] = [
  ...SWEET_COUPLE_CHALLENGES,
  ...SPICY_COUPLE_CHALLENGES,
  ...WILD_COUPLE_CHALLENGES,
];
