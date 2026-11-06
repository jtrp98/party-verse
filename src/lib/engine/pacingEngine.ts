import { GamePhase, IntensityLevel } from '../types/redesign';

export interface PhaseConfig {
  id: GamePhase;
  nameThai: string;
  badge: string;
  rangeText: string;
  description: string;
  accentColor: string;
  bgGradient: string;
}

export const GAME_PHASES: Record<GamePhase, PhaseConfig> = {
  WARM_UP: {
    id: 'WARM_UP',
    nameThai: 'อุ่นเครื่อง (Warm Up)',
    badge: '🌱 Warm Up',
    rangeText: '0–25%',
    description: 'ละลายพฤติกรรม สบายๆ ผ่อนคลาย สร้างบรรยากาศและรอยยิ้ม',
    accentColor: '#38bdf8', // sky-400
    bgGradient: 'from-sky-500/20 to-blue-600/10',
  },
  BUILD_UP: {
    id: 'BUILD_UP',
    nameThai: 'ไต่ระดับ (Build Up)',
    badge: '🔥 Build Up',
    rangeText: '25–50%',
    description: 'เพิ่มความสนุก เปิดเผยความรู้สึก เริ่มสร้างเคมีและความตื่นเต้น',
    accentColor: '#fbbf24', // amber-400
    bgGradient: 'from-amber-500/20 to-orange-600/10',
  },
  PEAK: {
    id: 'PEAK',
    nameThai: 'จุดเดือด (Peak)',
    badge: '⚡ Peak Phase',
    rangeText: '50–75%',
    description: 'ช่วงที่เข้มข้นที่สุดตามระดับที่เลือก ความท้าทายจัดเต็ม',
    accentColor: '#f43f5e', // rose-500
    bgGradient: 'from-rose-500/20 to-red-600/10',
  },
  FINALE: {
    id: 'FINALE',
    nameThai: 'ส่งท้าย (Finale)',
    badge: '👑 Finale',
    rangeText: '75–100%',
    description: 'รอบสุดท้ายส่งท้ายความทรงจำ สู่จุดไคลแมกซ์ที่น่าจดจำ',
    accentColor: '#a855f7', // purple-500
    bgGradient: 'from-purple-500/20 to-indigo-600/10',
  },
};

/**
 * Calculates current game phase from round progress ratio (0 to 1)
 */
export function calculateGamePhase(currentRound: number, totalRounds: number): GamePhase {
  if (totalRounds <= 0) return 'WARM_UP';
  const ratio = Math.max(0, Math.min(1, (currentRound - 1) / totalRounds));
  if (ratio < 0.25) return 'WARM_UP';
  if (ratio < 0.50) return 'BUILD_UP';
  if (ratio < 0.75) return 'PEAK';
  return 'FINALE';
}

/**
 * Calculates the current permitted intensity cap using intelligent wave pacing.
 * 
 * CORE REQUIREMENT:
 * - Selected maxIntensity is the CEILING, NEVER the starting point!
 * - If maxIntensity is 5 (UNLEASHED), round 1 MUST NOT start at 5. It starts at 1 or 2!
 * - Wave pacing modulates between peak and breather rounds to maintain tension & comfort.
 */
export function calculateAllowedIntensity(
  currentRound: number,
  totalRounds: number,
  maxIntensity: IntensityLevel
): IntensityLevel {
  const phase = calculateGamePhase(currentRound, totalRounds);

  // If ceiling is 1, always 1
  if (maxIntensity <= 1) return 1;

  switch (phase) {
    case 'WARM_UP':
      // Start light: max 1 or 2 regardless of how high maxIntensity is
      if (maxIntensity === 2) {
        return 1;
      }
      // For maxIntensity >= 3, alternate gently between 1 and 2
      return (currentRound % 2 === 1 ? 1 : 2) as IntensityLevel;

    case 'BUILD_UP':
      // Mid-level chemistry build up
      if (maxIntensity === 2) {
        return (currentRound % 2 === 1 ? 1 : 2) as IntensityLevel;
      }
      if (maxIntensity === 3) {
        return (currentRound % 2 === 1 ? 2 : 3) as IntensityLevel;
      }
      // For maxIntensity 4 or 5: allow up to 3
      return (currentRound % 2 === 1 ? 2 : 3) as IntensityLevel;

    case 'PEAK':
      // Delivers the primary excitement with wave pacing
      if (maxIntensity === 2) return 2;
      if (maxIntensity === 3) {
        // Wave: 2 -> 3 -> 2 -> 3
        return (currentRound % 2 === 1 ? 3 : 2) as IntensityLevel;
      }
      if (maxIntensity === 4) {
        // Wave: 3 -> 4 -> 3 -> 4
        return (currentRound % 2 === 1 ? 4 : 3) as IntensityLevel;
      }
      // maxIntensity === 5 (UNLEASHED)
      // Wave between 4 and 5
      return (currentRound % 2 === 1 ? 5 : 4) as IntensityLevel;

    case 'FINALE':
      // Final climactic rounds at the maximum allowable intensity
      return maxIntensity;

    default:
      return 1;
  }
}
