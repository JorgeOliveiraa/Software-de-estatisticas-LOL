import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { MatchBrief, getAllMatchesBrief } from '../db/matches';
import { Grade, calculateGrade } from '../services/grade';

/**
 * Nota de cada campeão que tem partidas registradas.
 * Campeão que não aparece no resultado = ND.
 * Recarrega toda vez que a tela volta a ficar visível.
 */
export function useGrades() {
  const db = useSQLiteContext();
  const [grades, setGrades] = useState<Record<string, Grade>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      getAllMatchesBrief(db)
        .then((rows) => {
          const byChampion: Record<string, MatchBrief[]> = {};
          for (const row of rows) {
            (byChampion[row.championId] ??= []).push(row);
          }

          const result: Record<string, Grade> = {};
          for (const [championId, list] of Object.entries(byChampion)) {
            result[championId] = calculateGrade(list).grade;
          }

          if (!cancelled) setGrades(result);
        })
        .catch(() => {
          // se falhar, a tela continua funcionando sem as notas
        });

      return () => {
        cancelled = true;
      };
    }, [db])
  );

  return grades;
}
