import { StatsMatch, calculateStats } from "./matchStats";

/**
 * NOTA DO CAMPEÃO
 * ---------------
 * Combina 3 coisas (cada uma vira uma pontuação de 0 a 100):
 *   • KDA médio ........ 40%   (2.0 = 50 pts, 3.0 = 70, 4.0 = 85, 5+ = 100)
 *   • Taxa de vitória .. 40%   (30% = 0 pts, 50% = 50, 70%+ = 100)
 *   • Consistência ..... 20%   (quanto menos o desempenho varia de uma
 *                               partida para outra, maior a pontuação;
 *                               só conta por inteiro se o KDA for pelo menos
 *                               médio, para não premiar quem joga sempre mal)
 *
 * Com poucas partidas a nota é "puxada" para o meio (50), porque 1 ou 2
 * jogos não provam nada. Quanto mais partidas, mais a nota reflete o
 * seu desempenho de verdade.
 *
 * Faixas:  S ≥ 85  |  A ≥ 70  |  B ≥ 55  |  C ≥ 40  |  D < 40
 * ND = nenhuma partida registrada com o campeão.
 */

export type Grade = "S" | "A" | "B" | "C" | "D" | "ND";

export type GradeResult = {
  grade: Grade;
  /** Pontuação final, de 0 a 100. null quando é ND. */
  score: number | null;
  kdaScore: number | null;
  winScore: number | null;
  consistencyScore: number | null;
  matches: number;
  /** true a partir de 10 partidas. */
  reliable: boolean;
};

export const WEIGHTS = { kda: 0.35, win: 0.45, consistency: 0.2 };
export const RELIABLE_MATCHES = 10;

/** Quanto maior, mais devagar a nota se afasta de 50 com poucas partidas. */
const CONFIDENCE_K = 2;

const GRADE_LIMITS: { grade: Grade; min: number }[] = [
  { grade: "S", min: 85 },
  { grade: "A", min: 70 },
  { grade: "B", min: 55 },
  { grade: "C", min: 40 },
];

const KDA_POINTS: [number, number][] = [
  [0, 0],
  [1, 25],
  [2, 50],
  [3, 70],
  [4, 85],
  [5, 100],
];

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Liga os pontos [x, y] com retas (interpolação linear). */
function interpolate(x: number, points: [number, number][]) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

/** KDA de uma partida só. Mortes = 0 conta como 1; limite de 10 para um jogo não distorcer tudo. */
function singleMatchKda(m: StatsMatch) {
  return Math.min(10, (m.kills + m.assists) / Math.max(1, m.deaths));
}

function consistencyScore(matches: StatsMatch[]) {
  if (matches.length < 2) return 50; // sem como medir: neutro
  const values = matches.map(singleMatchKda);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean; // variação relativa
  return clamp(100 * (1 - cv / 2), 0, 100);
}

export function gradeFromScore(score: number): Grade {
  for (const limit of GRADE_LIMITS) {
    if (score >= limit.min) return limit.grade;
  }
  return "D";
}

export function calculateGrade(matches: StatsMatch[]): GradeResult {
  const n = matches.length;

  if (n === 0) {
    return {
      grade: "ND",
      score: null,
      kdaScore: null,
      winScore: null,
      consistencyScore: null,
      matches: 0,
      reliable: false,
    };
  }

  const stats = calculateStats(matches);

  const kdaScore = interpolate(stats.kda ?? 0, KDA_POINTS);
  const winScore = clamp(((stats.winRate ?? 0) - 30) / 40, 0, 1) * 100;
  // Consistência só vale por inteiro quando o KDA é 2.0 ou mais (50 pts).
  const consScore = consistencyScore(matches) * clamp(kdaScore / 50, 0, 1);

  const raw =
    kdaScore * WEIGHTS.kda +
    winScore * WEIGHTS.win +
    consScore * WEIGHTS.consistency;

  const confidence = n / (n + CONFIDENCE_K);
  const finalScore = 50 * (1 - confidence) + raw * confidence;

  return {
    grade: gradeFromScore(finalScore),
    score: Math.round(finalScore),
    kdaScore: Math.round(kdaScore),
    winScore: Math.round(winScore),
    consistencyScore: Math.round(consScore),
    matches: n,
    reliable: n >= RELIABLE_MATCHES,
  };
}

/* ---------- Cores ---------- */

export const GRADE_COLORS: Record<Grade, string> = {
  S: "#F0C14B", // dourado
  A: "#0AC8B9", // turquesa
  B: "#4DA3FF", // azul
  C: "#A09B8C", // cinza
  D: "#E84057", // vermelho
  ND: "#5C6B7A", // apagado
};

export function gradeColor(grade: Grade) {
  return GRADE_COLORS[grade];
}
