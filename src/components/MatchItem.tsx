import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { laneLabel, modeLabel } from '../constants/matchOptions';
import { Match } from '../db/matches';
import { isoToBr } from '../services/dates';
import { calculateStats, formatKda } from '../services/matchStats';
import { colors } from '../theme/colors';

type Props = {
  match: Match;
  onEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
};

/** Uma linha do histórico, com indicador de vitória/derrota e botões editar/excluir. */
export function MatchItem({ match, onEdit, onDelete }: Props) {
  const win = match.result === 'win';
  const accent = win ? colors.win : colors.loss;
  const kda = formatKda(calculateStats([match]));

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: accent }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.result, { color: accent }]}>
            {win ? 'VITÓRIA' : 'DERROTA'}
          </Text>
          <Text style={styles.date}>{isoToBr(match.playedAt)}</Text>
        </View>

        <Text style={styles.score}>
          {match.kills} / {match.deaths} / {match.assists}
          <Text style={styles.kda}>{`   KDA ${kda}`}</Text>
        </Text>

        <Text style={styles.meta}>
          {laneLabel(match.lane)}  •  {modeLabel(match.mode)}
        </Text>

        {match.notes ? (
          <Text style={styles.notes} numberOfLines={3}>
            {match.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => onEdit(match)}
          style={styles.iconButton}
          accessibilityLabel="Editar partida"
        >
          <Ionicons name="create-outline" size={22} color={colors.gold} />
        </Pressable>
        <Pressable
          onPress={() => onDelete(match)}
          style={styles.iconButton}
          accessibilityLabel="Excluir partida"
        >
          <Ionicons name="trash-outline" size={22} color={colors.red} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: { width: 5 },
  body: { flex: 1, padding: 12, gap: 4 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  result: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  date: { color: colors.textMuted, fontSize: 12 },
  score: { color: colors.goldLight, fontSize: 20, fontWeight: '800' },
  kda: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 13 },
  notes: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: { justifyContent: 'center', paddingRight: 4 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
