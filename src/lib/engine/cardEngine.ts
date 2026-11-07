import { PlayingCard, Suit, Rank, SessionBoundaries, ContentRating, NormalPack } from '../types/game';
import { DEFAULT_DORAEMON_RULES, CardRuleDefinition } from '../data/doraemonRules';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, { symbol: string; nameThai: string; color: string }> = {
  spades: { symbol: '♠', nameThai: 'โพดำ', color: 'text-zinc-100' },
  hearts: { symbol: '♥', nameThai: 'โพแดง', color: 'text-rose-500' },
  diamonds: { symbol: '♦', nameThai: 'ข้าวหลามตัด', color: 'text-amber-500' },
  clubs: { symbol: '♣', nameThai: 'ดอกจิก', color: 'text-cyan-400' },
};

export function generate52CardDeck(
  customRules: Record<Rank, CardRuleDefinition> = DEFAULT_DORAEMON_RULES,
  boundaries?: SessionBoundaries,
  rating?: ContentRating,
  normalPack?: NormalPack
): PlayingCard[] {
  const deck: PlayingCard[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const rule = customRules[rank] || DEFAULT_DORAEMON_RULES[rank];

      let title = rule.title;
      let desc = rule.shortDesc;
      let details = rule.fullDesc;
      let triggersMiniGame = rule.triggersMiniGame;

      if (rating === 'NSFW') {
        if (rank === 'A') {
          title = 'ดื่มคนเดียว / เผยรสนิยม';
          desc = 'คนจั่วดื่ม 1 ช็อต หรือเผยสเปกคนในวงที่ดึงดูดใจที่สุด';
        } else if (rank === '2') {
          title = 'แจกสัมผัสหรือดื่ม';
          desc = 'สั่งเพื่อนดื่ม 2 ช็อต หรือสั่งสกินชิพน่ารัก ๆ (เฉพาะคนที่ยินยอม)';
        } else if (rank === '9') {
          title = 'คนข้างซ้ายชะตาขาด';
          desc = 'คนทางซ้ายมือดื่ม 1 ช็อต หรือสารภาพความรู้สึกที่มีต่อคนจั่ว';
        } else if (rank === 'K') {
          details = 'ใบที่ 1-3 สั่งกฎพิเศษประจำวง / ใบที่ 4 ปลุกมินิเกมผู้ใหญ่ส่งท้าย แล้วเล่นต่อจนไพ่หมด 52 ใบ';
        }
      } else if (rating === 'NORMAL') {
        if (normalPack === 'DEEP_TALK') {
          if (rank === 'A') {
            title = 'เปิดใจคนเดียว';
            desc = 'เล่าเรื่องซึ้ง ๆ หรือความทรงจำที่ประทับใจที่สุดในชีวิต 1 เรื่อง';
          } else if (rank === '9') {
            title = 'คนข้างซ้ายชมจากใจ';
            desc = 'คนทางซ้ายพูดข้อดีที่ประทับใจในตัวคนจั่ว 1 ประโยค';
          }
        } else if (normalPack === 'COMPETITION') {
          if (rank === '4' || rank === '5' || rank === '7' || rank === '10') {
            desc = `${desc} (ผู้ชนะได้รับ +1 แต้มสะสม)`;
          }
        }
        if (rank === 'K') {
          details = 'ใบที่ 1-3 สั่งกฎใหม่ 1 ข้อ / ใบที่ 4 ฉลองปิดวง แล้วเล่นต่อจนไพ่หมด 52 ใบ';
        }
      }

      // Adapt if boundaries disable alcohol
      if (boundaries && !boundaries.allowAlcohol && rule.alternativeAction) {
        if (rank === 'A') {
          title = 'ภารกิจคนเดียว (ไร้แอลกอฮอล์)';
          desc = rule.alternativeAction;
        } else if (rank === '2') {
          title = 'สั่งเพื่อน 2 คน';
          desc = rule.alternativeAction;
        } else if (rank === '9') {
          title = 'คนข้างซ้ายทำภารกิจ';
          desc = rule.alternativeAction;
        } else if (rank === 'K') {
          details = 'ใบที่ 1-3 สั่งกฎใหม่ 1 ข้อ / ใบที่ 4: ' + rule.alternativeAction + ' (แล้วเล่นต่อจนไพ่หมด 52 ใบ)';
        }
      }

      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        isDrawn: false,
        ruleTitle: title,
        ruleDescription: desc,
        ruleDetails: details,
        triggersMiniGame,
        alternativeAction: rule.alternativeAction,
        isPhysical: rule.isPhysical ?? false,
        requiresConsent: rule.requiresConsent ?? false,
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
