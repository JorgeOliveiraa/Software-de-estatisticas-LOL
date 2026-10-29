import { MODES } from '../constants/matchOptions';
import { ChampionStats, StatsMatch, calculateStats } from './matchStats';

export type ModeStats = {
  mode: string;
  label: string;
  stats: ChampionStats;
};

/**
 * Estatísticas separadas por modo de jogo.
 * Sempre devolve os 4 modos (mesmo sem partidas), na ordem do formulário.
 * Se existir alguma partida com um modo desconhecido, ela vai para "Outros".
 */
export function calculateStatsByMode(
  matches: (StatsMatch & { mode: string })[]
): ModeStats[] {
  const known = new Set<string>(MODES.map((m) => m.value));

  const result: ModeStats[] = MODES.map((m) => ({
    mode: m.value,
    label: m.label,
    stats: calculateStats(matches.filter((x) => x.mode === m.value)),
  }));

  const others = matches.filter((x) => !known.has(x.mode));
  if (others.length > 0) {
    result.push({ mode: 'other', label: 'Outros', stats: calculateStats(others) });
  }

  return result;
}
