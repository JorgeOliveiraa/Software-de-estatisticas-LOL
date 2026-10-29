import type { SQLiteDatabase } from 'expo-sqlite';

/** Cria as tabelas na primeira execução. Chamado pelo SQLiteProvider. */
export async function migrateDb(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      champion_id TEXT NOT NULL,
      result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
      kills INTEGER NOT NULL CHECK (kills >= 0),
      deaths INTEGER NOT NULL CHECK (deaths >= 0),
      assists INTEGER NOT NULL CHECK (assists >= 0),
      lane TEXT NOT NULL,
      mode TEXT NOT NULL,
      played_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_matches_champion ON matches (champion_id);

    CREATE TABLE IF NOT EXISTS favorites (
      champion_id TEXT PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/* ---------- Favoritos ---------- */

export async function getFavoriteIds(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ champion_id: string }>(
    'SELECT champion_id FROM favorites'
  );
  return rows.map((r) => r.champion_id);
}

export async function setFavorite(
  db: SQLiteDatabase,
  championId: string,
  isFavorite: boolean
) {
  if (isFavorite) {
    await db.runAsync(
      'INSERT OR IGNORE INTO favorites (champion_id) VALUES (?)',
      championId
    );
  } else {
    await db.runAsync('DELETE FROM favorites WHERE champion_id = ?', championId);
  }
}

/* ---------- Cache (lista de campeões offline) ---------- */

export async function getCache(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM cache WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setCache(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO cache (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    key,
    value
  );
}