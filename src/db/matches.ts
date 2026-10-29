import type { SQLiteDatabase } from 'expo-sqlite';
import type { MatchResult } from '../services/matchStats';

/** Dados que o usuário preenche no formulário. */
export type MatchValues = {
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
  lane: string;
  mode: string;
  playedAt: string; // "AAAA-MM-DD"
  notes: string | null;
};

export type Match = MatchValues & {
  id: number;
  championId: string;
};

type MatchRow = {
  id: number;
  champion_id: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  lane: string;
  mode: string;
  played_at: string;
  notes: string | null;
};

const COLUMNS =
  'id, champion_id, result, kills, deaths, assists, lane, mode, played_at, notes';

function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    championId: row.champion_id,
    result: row.result === 'win' ? 'win' : 'loss',
    kills: row.kills,
    deaths: row.deaths,
    assists: row.assists,
    lane: row.lane,
    mode: row.mode,
    playedAt: row.played_at,
    notes: row.notes,
  };
}

/** Partidas de um campeão, da mais recente para a mais antiga. */
export async function getMatchesByChampion(
  db: SQLiteDatabase,
  championId: string
): Promise<Match[]> {
  const rows = await db.getAllAsync<MatchRow>(
    `SELECT ${COLUMNS} FROM matches WHERE champion_id = ? ORDER BY played_at DESC, id DESC`,
    [championId]
  );
  return rows.map(toMatch);
}

export async function getMatchById(
  db: SQLiteDatabase,
  id: number
): Promise<Match | null> {
  const row = await db.getFirstAsync<MatchRow>(
    `SELECT ${COLUMNS} FROM matches WHERE id = ?`,
    [id]
  );
  return row ? toMatch(row) : null;
}

export async function insertMatch(
  db: SQLiteDatabase,
  championId: string,
  v: MatchValues
) {
  await db.runAsync(
    `INSERT INTO matches (champion_id, result, kills, deaths, assists, lane, mode, played_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [championId, v.result, v.kills, v.deaths, v.assists, v.lane, v.mode, v.playedAt, v.notes]
  );
}

export async function updateMatch(
  db: SQLiteDatabase,
  id: number,
  v: MatchValues
) {
  await db.runAsync(
    `UPDATE matches
        SET result = ?, kills = ?, deaths = ?, assists = ?, lane = ?, mode = ?, played_at = ?, notes = ?
      WHERE id = ?`,
    [v.result, v.kills, v.deaths, v.assists, v.lane, v.mode, v.playedAt, v.notes, id]
  );
}

export async function deleteMatch(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM matches WHERE id = ?', [id]);
}

/** Só o que a nota precisa, de todos os campeões de uma vez (1 consulta só). */
export type MatchBrief = {
  championId: string;
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
};

export async function getAllMatchesBrief(
  db: SQLiteDatabase
): Promise<MatchBrief[]> {
  const rows = await db.getAllAsync<{
    champion_id: string;
    result: string;
    kills: number;
    deaths: number;
    assists: number;
  }>('SELECT champion_id, result, kills, deaths, assists FROM matches');

  return rows.map((r) => ({
    championId: r.champion_id,
    result: r.result === 'win' ? 'win' : 'loss',
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
  }));
}
