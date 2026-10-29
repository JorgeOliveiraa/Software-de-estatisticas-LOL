import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getCache, setCache } from '../db/database';
import {
  ChampionData,
  fetchChampionsFromNetwork,
} from '../services/champions';

const CACHE_KEY = 'champions';

/**
 * 1) Mostra o cache imediatamente (funciona offline).
 * 2) Tenta atualizar pela internet em segundo plano.
 */
export function useChampions() {
  const db = useSQLiteContext();
  const [data, setData] = useState<ChampionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    let hasCache = false;
    try {
      const cached = await getCache(db, CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached) as ChampionData);
        setLoading(false);
        hasCache = true;
      }
    } catch {
      // cache corrompido: ignora e tenta pela rede
    }

    try {
      const fresh = await fetchChampionsFromNetwork();
      setData(fresh);
      await setCache(db, CACHE_KEY, JSON.stringify(fresh));
    } catch {
      if (!hasCache) {
        setError(
          'Não foi possível carregar os campeões. Conecte-se à internet na primeira abertura do app.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return { data, loading, error, retry };
}