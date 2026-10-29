import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Match, getMatchesByChampion } from '../db/matches';

/**
 * Carrega as partidas de um campeão.
 * Recarrega sozinho toda vez que a tela volta a ficar visível
 * (por exemplo, depois de salvar no formulário).
 */
export function useChampionMatches(championId: string) {
  const db = useSQLiteContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setMatches(await getMatchesByChampion(db, championId));
      setError(null);
    } catch {
      setError('Não foi possível ler as partidas salvas.');
    } finally {
      setLoading(false);
    }
  }, [db, championId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { matches, loading, error, reload };
}
