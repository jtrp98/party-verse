import { PlayingCard, Suit, Rank } from '../types/game';
import { DEFAULT_DORAEMON_RULES, CardRuleDefinition } from '../data/doraemonRules';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, { symbol: string; nameThai: string; color: string }> = {
  spades: { symbol: '♠', nameThai: 'โพดำ', color: 'text-zinc-100' },
  hearts: { symbol: '♥', nameThai: 'โพแดง', color: 'text-rose-500' },
  diamonds: { symbol: '♦', nameThai: 'ข้าวหลามตัด', color: 'text-amber-500' },
  clubs: { symbol: '♣', nameThai: 'ดอกจิก', color: 'text-cyan-400' },
};

export function generate52CardDeck(customRules: Record<Rank, CardRuleDefinition> = DEFAULT_DORAEMON_RULES): PlayingCard[] {
  const deck: PlayingCard[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const rule = customRules[rank] || DEFAULT_DORAEMON_RULES[rank];
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        isDrawn: false,
        ruleTitle: rule.title,
        ruleDescription: rule.shortDesc,
        ruleDetails: rule.fullDesc,
        triggersMiniGame: rule.triggersMiniGame,
      });
    }
  }

  return deck;
}

/**
 * Fisher-Yates unbiased shuffle
 */
export function shuffleDeck<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Draw a card from deck
 */
export function drawNextCard(deck: PlayingCard[], playerId: string): { card: PlayingCard | null; updatedDeck: PlayingCard[] } {
  const availableIndex = deck.findIndex((c) => !c.isDrawn);
  if (availableIndex === -1) {
    return { card: null, updatedDeck: deck };
  }

  const updatedDeck = [...deck];
  const drawnCard: PlayingCard = {
    ...updatedDeck[availableIndex],
    isDrawn: true,
    drawnByPlayerId: playerId,
  };
  updatedDeck[availableIndex] = drawnCard;

  return { card: drawnCard, updatedDeck };
}

export function getDeckStats(deck: PlayingCard[]) {
  const drawn = deck.filter((c) => c.isDrawn);
  const remaining = deck.filter((c) => !c.isDrawn);
  return {
    total: deck.length,
    drawnCount: drawn.length,
    remainingCount: remaining.length,
    percentCompleted: Math.round((drawn.length / deck.length) * 100),
  };
}
