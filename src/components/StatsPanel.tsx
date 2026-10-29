import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Match } from '../db/matches';
import {
  GradeResult,
  RELIABLE_MATCHES,
  gradeColor,
} from '../services/grade';
import {
  ChampionStats,
  formatKda,
  formatNumber,
  formatWinRate,
} from '../services/matchStats';
import { calculateStatsByMode } from '../services/modeStats';
import { colors } from '../theme/colors';
import { GradeBadge } from './GradeBadge';
import { ModeBreakdownModal } from './ModeBreakdownModal';
import { StatBox } from './StatBox';

type Props = {
  stats: ChampionStats;
  grade: GradeResult;
  matches: Match[];
  championName: string;
};

/** Todas as estatísticas do campeão (já calculadas por calculateStats e calculateGrade). */
export function StatsPanel({ stats, grade, matches, championName }: Props) {
  const [showModes, setShowModes] = useState(false);
  const byMode = useMemo(() => calculateStatsByMode(matches), [matches]);
  const winRate = stats.winRate ?? 0;
  const barWidth = Math.min(100, Math.max(0, winRate));
  const accent = gradeColor(grade.grade);

  return (
    <View style={styles.wrap}>
      {/* Nota */}
      <View style={[styles.gradeCard, { borderColor: accent }]}>
        <GradeBadge grade={grade.grade} size="large" />
        <View style={styles.gradeInfo}>
          <Text style={[styles.gradeTitle, { color: accent }]}>
            Nota {grade.grade}
          </Text>
          <Text style={styles.gradeScore}>{grade.score} de 100 pontos</Text>
          <MiniBar label="KDA" value={grade.kdaScore} color={accent} />
          <MiniBar label="Vitórias" value={grade.winScore} color={accent} />
          <MiniBar
            label="Consistência"
            value={grade.consistencyScore}
            color={accent}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        {grade.reliable
          ? 'Nota = KDA (40%) + taxa de vitória (40%) + consistência (20%).'
          : `Poucas partidas: a nota fica mais confiável a partir de ${RELIABLE_MATCHES} partidas. (KDA 40% + vitórias 40% + consistência 20%)`}
      </Text>

      <View style={styles.row}>
        <StatBox
          label="Partidas"
          value={String(stats.totalMatches)}
          onPress={() => setShowModes(true)}
          accessibilityHint="Abre o detalhamento por modo de jogo"
        />
        <StatBox label="Vitórias" value={String(stats.wins)} color={colors.win} />
        <StatBox label="Derrotas" value={String(stats.losses)} color={colors.loss} />
      </View>
      <Text style={styles.hint}>
        Toque em “Partidas” para ver o detalhe por modo de jogo.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Taxa de vitória</Text>
          <Text
            style={[
              styles.bigValue,
              { color: winRate >= 50 ? colors.win : colors.loss },
            ]}
          >
            {formatWinRate(stats.winRate)}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${barWidth}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>KDA médio</Text>
          <Text style={[styles.bigValue, { color: colors.gold }]}>
            {formatKda(stats)}
          </Text>
        </View>
        <Text style={styles.hint}>
          {stats.isPerfectKda
            ? 'Nenhuma morte registrada ainda.'
            : '(kills + assistências) ÷ mortes'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Totais</Text>
      <View style={styles.row}>
        <StatBox label="Kills" value={String(stats.totalKills)} />
        <StatBox label="Mortes" value={String(stats.totalDeaths)} />
        <StatBox label="Assistências" value={String(stats.totalAssists)} />
      </View>

      <Text style={styles.sectionTitle}>Média por partida</Text>
      <View style={styles.row}>
        <StatBox label="Kills" value={formatNumber(stats.avgKills, 1)} />
        <StatBox label="Mortes" value={formatNumber(stats.avgDeaths, 1)} />
        <StatBox label="Assistências" value={formatNumber(stats.avgAssists, 1)} />
      </View>

      <ModeBreakdownModal
        visible={showModes}
        championName={championName}
        items={byMode}
        onClose={() => setShowModes(false)}
      />
    </View>
  );
}

function MiniBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const v = value ?? 0;
  return (
    <View style={styles.miniRow}>
      <Text style={styles.miniLabel}>{label}</Text>
      <View style={styles.miniTrack}>
        <View
          style={[
            styles.miniFill,
            { width: `${Math.min(100, Math.max(0, v))}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.miniValue}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
  },
  gradeInfo: { flex: 1, gap: 4 },
  gradeTitle: { fontSize: 22, fontWeight: '900' },
  gradeScore: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLabel: { width: 82, color: colors.textMuted, fontSize: 12 },
  miniTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  miniFill: { height: 6, borderRadius: 3 },
  miniValue: {
    width: 26,
    textAlign: 'right',
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  bigValue: { fontSize: 30, fontWeight: '900' },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.loss,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: colors.win },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  sectionTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});
