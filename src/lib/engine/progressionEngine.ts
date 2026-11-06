import { ProgressionPhase } from '../types/game';

export interface PhaseMetadata {
  id: ProgressionPhase;
  nameThai: string;
  badge: string;
  rangeText: string;
  description: string;
  accentColor: string;
  textColor: string;
  bgGradient: string;
}

export const PHASE_CONFIG: Record<ProgressionPhase, PhaseMetadata> = {
  WARM_UP: {
    id: 'WARM_UP',
    nameThai: 'อุ่นเครื่อง (Warm Up)',
    badge: '🌱 Warm Up',
    rangeText: '0–25%',
    description: 'ละลายพฤติกรรม สบายๆ ผ่อนคลาย สร้างบรรยากาศปาร์ตี้',
    accentColor: '#38bdf8', // sky-400
    textColor: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-blue-600/10',
  },
  BUILD_UP: {
    id: 'BUILD_UP',
    nameThai: 'ไต่ระดับ (Build Up)',
    badge: '🔥 Build Up',
    rangeText: '25–50%',
    description: 'เพิ่มความสนุก เพิ่มความสนิท เริ่มเปิดเผยตัวตนและแข่งขัน',
    accentColor: '#fbbf24', // amber-400
    textColor: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-orange-600/10',
  },
  PEAK: {
    id: 'PEAK',
    nameThai: 'จุดเดือด (Peak)',
    badge: '⚡ Peak Phase',
    rangeText: '50–75%',
    description: 'เข้มข้นที่สุดตาม Level ที่เลือก มินิเกมท้าทาย ความมันส์เต็มพิกัด',
    accentColor: '#f43f5e', // rose-500
    textColor: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-600/10',
  },
  FINALE: {
    id: 'FINALE',
    nameThai: 'ส่งท้าย (Finale)',
    badge: '👑 Finale',
    rangeText: '75–100%',
    description: 'รอบสุดท้าย บทลงโทษส่งท้าย และมินิเกมสู่จุดไคลแมกซ์',
    accentColor: '#a855f7', // purple-500
    textColor: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-600/10',
  },
};

export function calculateDoraemonPhase(drawnCount: number, totalCards: number = 52): ProgressionPhase {
  const ratio = drawnCount / totalCards;
  if (ratio < 0.25) return 'WARM_UP';
  if (ratio < 0.50) return 'BUILD_UP';
  if (ratio < 0.75) return 'PEAK';
  return 'FINALE';
}

export function calculateRoundPhase(currentRound: number, totalRounds: number): ProgressionPhase {
  if (totalRounds <= 0) return 'WARM_UP';
  const ratio = currentRound / totalRounds;
  if (ratio < 0.25) return 'WARM_UP';
  if (ratio < 0.50) return 'BUILD_UP';
  if (ratio < 0.75) return 'PEAK';
  return 'FINALE';
}
