/**
 * Cálculo das estatísticas de um campeão a partir das partidas registradas.
 * Arquivo SEM dependências: não usa banco, tela nem bibliotecas.
 * Tudo é calculado na hora; nada de totais salvos no banco.
 */

export type MatchResult = "win" | "loss";

/** Só os campos que o cálculo precisa. Uma partida completa do banco também serve. */
export type StatsMatch = {
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
};

export type ChampionStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  /** 0 a 100. null quando não há partidas. */
  winRate: number | null;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  /** (kills + assistências) / mortes. null quando não há partidas. */
  kda: number | null;
  /** true quando há partidas, mas nenhuma morte (KDA "perfeito"). */
  isPerfectKda: boolean;
  /** Médias por partida. null quando não há partidas. */
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
};

export function calculateStats(matches: StatsMatch[]): ChampionStats {
  const totalMatches = matches.length;

  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;

  for (const match of matches) {
    if (match.result === "win") wins += 1;
    else losses += 1;

    totalKills += match.kills;
    totalDeaths += match.deaths;
    totalAssists += match.assists;
  }

  // Nenhuma partida: nada de números inventados.
  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: null,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      kda: null,
      isPerfectKda: false,
      avgKills: null,
      avgDeaths: null,
      avgAssists: null,
    };
  }

  const isPerfectKda = totalDeaths === 0;

  // Com zero mortes não dá para dividir. Convenção: KDA = kills + assistências.
  const kda = isPerfectKda
    ? totalKills + totalAssists
    : (totalKills + totalAssists) / totalDeaths;

  return {
    totalMatches,
    wins,
    losses,
    winRate: (wins / totalMatches) * 100,
    totalKills,
    totalDeaths,
    totalAssists,
    kda,
    isPerfectKda,
    avgKills: totalKills / totalMatches,
    avgDeaths: totalDeaths / totalMatches,
    avgAssists: totalAssists / totalMatches,
  };
}

/* ------------------------------------------------------------------ */
/* Formatação para exibir na tela                                      */
/* ------------------------------------------------------------------ */

const EMPTY = "—";

/** Ex.: 3.456 -> "3.46". null -> "—". */
export function formatNumber(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return EMPTY;
  return value.toFixed(digits);
}

/** Ex.: 62.5 -> "62.5%". null -> "—". */
export function formatWinRate(winRate: number | null): string {
  if (winRate === null || !Number.isFinite(winRate)) return EMPTY;
  return `${winRate.toFixed(1)}%`;
}

/** Ex.: "3.25", ou "Perfeito" quando não houve mortes. */
export function formatKda(stats: ChampionStats): string {
  if (stats.kda === null) return EMPTY;
  if (stats.isPerfectKda) return "Perfeito";
  return stats.kda.toFixed(2);
}

/** Ex.: "5.2 / 3.1 / 7.8" (kills / mortes / assistências por partida). */
export function formatAverages(stats: ChampionStats): string {
  if (stats.avgKills === null) return EMPTY;
  return `${formatNumber(stats.avgKills, 1)} / ${formatNumber(
    stats.avgDeaths,
    1
  )} / ${formatNumber(stats.avgAssists, 1)}`;
}