import { Player } from '../types/game';

export const AVATAR_COLORS = [
  'bg-cyan-500 text-cyan-950 border-cyan-300',
  'bg-rose-500 text-rose-950 border-rose-300',
  'bg-amber-500 text-amber-950 border-amber-300',
  'bg-emerald-500 text-emerald-950 border-emerald-300',
  'bg-violet-500 text-violet-950 border-violet-300',
  'bg-orange-500 text-orange-950 border-orange-300',
  'bg-pink-500 text-pink-950 border-pink-300',
  'bg-indigo-500 text-indigo-950 border-indigo-300',
];

export function createNewPlayer(name: string, index: number): Player {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return {
    id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `ผู้เล่น ${index + 1}`,
    avatarColor: color,
    stats: {
      drinksDrunk: 0,
      miniGamesWon: 0,
      jCards: 0,
      qCards: 0,
      kCards: 0,
      bathroomPasses: 0,
      activeBuffs: [],
    },
  };
}

export function getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
  if (totalPlayers <= 0) return 0;
  return (currentIndex + 1) % totalPlayers;
}

/**
 * Pick a random player, optionally excluding certain player IDs (fairness balancing)
 */
export function pickRandomPlayer(players: Player[], excludeIds: string[] = []): Player | null {
  const eligible = players.filter((p) => !excludeIds.includes(p.id));
  if (eligible.length === 0) {
    if (players.length === 0) return null;
    return players[Math.floor(Math.random() * players.length)];
  }
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Pick a pair of two different players
 */
export function pickPairOfPlayers(players: Player[], preferredPrimaryId?: string): [Player, Player] | null {
  if (players.length < 2) return null;

  let primary: Player;
  if (preferredPrimaryId) {
    primary = players.find((p) => p.id === preferredPrimaryId) || players[0];
  } else {
    primary = players[Math.floor(Math.random() * players.length)];
  }

  const eligibleSecondary = players.filter((p) => p.id !== primary.id);
  const secondary = eligibleSecondary[Math.floor(Math.random() * eligibleSecondary.length)];

  return [primary, secondary];
}

/**
 * Pick a group of players
 */
export function pickGroupOfPlayers(players: Player[], count: number): Player[] {
  if (players.length <= count) return [...players];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Update player stats immutably
 */
export function updatePlayerStat(
  players: Player[],
  playerId: string,
  statKey: keyof Player['stats'],
  deltaOrValue: number | string[]
): Player[] {
  return players.map((p) => {
    if (p.id !== playerId) return p;
    const current = p.stats[statKey];

    if (typeof current === 'number' && typeof deltaOrValue === 'number') {
      return {
        ...p,
        stats: {
          ...p.stats,
          [statKey]: Math.max(0, current + deltaOrValue),
        },
      };
    } else if (Array.isArray(deltaOrValue)) {
      return {
        ...p,
        stats: {
          ...p.stats,
          [statKey]: deltaOrValue,
        },
      };
    }
    return p;
  });
}

/**
 * Replace dynamic target tokens in Truth / Dare / Mini-Game prompts
 */
export function formatPromptWithPlayers(
  text: string,
  currentPlayer?: Player | null,
  allPlayers: Player[] = []
): string {
  if (!text || allPlayers.length === 0) return text;

  let result = text;
  const currentIdx = currentPlayer ? allPlayers.findIndex((p) => p.id === currentPlayer.id) : 0;
  const n = allPlayers.length;

  // Left Player (previous in circle)
  if (result.includes('{LEFT_PLAYER}')) {
    const leftIdx = (currentIdx - 1 + n) % n;
    const leftName = allPlayers[leftIdx]?.name || 'คนที่นั่งทางซ้าย';
    result = result.replace(/\{LEFT_PLAYER\}/g, leftName);
  }

  // Right Player (next in circle)
  if (result.includes('{RIGHT_PLAYER}')) {
    const rightIdx = (currentIdx + 1) % n;
    const rightName = allPlayers[rightIdx]?.name || 'คนที่นั่งทางขวา';
    result = result.replace(/\{RIGHT_PLAYER\}/g, rightName);
  }

  // Opposite Player
  if (result.includes('{OPPOSITE_PLAYER}')) {
    const oppIdx = (currentIdx + Math.floor(n / 2)) % n;
    const oppName = allPlayers[oppIdx]?.name || 'คนที่นั่งตรงข้าม';
    result = result.replace(/\{OPPOSITE_PLAYER\}/g, oppName);
  }

  // Random other player
  if (result.includes('{RANDOM_OTHER}')) {
    const others = allPlayers.filter((p) => p.id !== currentPlayer?.id);
    const chosen = others.length > 0 ? others[Math.floor(Math.random() * others.length)].name : 'เพื่อนในวง';
    result = result.replace(/\{RANDOM_OTHER\}/g, chosen);
  }

  return result;
}
