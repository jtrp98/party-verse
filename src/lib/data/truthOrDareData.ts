import { TruthOrDareItem } from '../types/game';
import { CHILL_TRUTH_OR_DARE } from './truthOrDare/chill';
import { FLIRTY_TRUTH_OR_DARE } from './truthOrDare/flirty';
import { SPICY_TRUTH_OR_DARE } from './truthOrDare/spicy';
import { NAUGHTY_TRUTH_OR_DARE } from './truthOrDare/naughty';
import { UNLEASHED_TRUTH_OR_DARE } from './truthOrDare/unleashed';

export {
  CHILL_TRUTH_OR_DARE,
  FLIRTY_TRUTH_OR_DARE,
  SPICY_TRUTH_OR_DARE,
  NAUGHTY_TRUTH_OR_DARE,
  UNLEASHED_TRUTH_OR_DARE,
};

export const TRUTH_OR_DARE_DATABASE: TruthOrDareItem[] = [
  ...CHILL_TRUTH_OR_DARE,
  ...FLIRTY_TRUTH_OR_DARE,
  ...SPICY_TRUTH_OR_DARE,
  ...NAUGHTY_TRUTH_OR_DARE,
  ...UNLEASHED_TRUTH_OR_DARE,
];
