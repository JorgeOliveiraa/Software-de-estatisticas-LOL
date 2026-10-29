import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeStats } from '../services/modeStats';
import {
  formatKda,
  formatNumber,
  formatWinRate,
} from '../services/matchStats';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  championName: string;
  items: ModeStats[];
  onClose: () => void;
};

/** Janela que sobe de baixo mostrando as estatísticas de cada modo de jogo. */
export function ModeBreakdownModal({
  visible,
  championName,
  items,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Toque fora da janela para fechar */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Partidas por modo</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {championName}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Fechar"
              hitSlop={8}
            >
              <Ionicons name="close" size={26} color={colors.goldLight} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <ModeCard key={item.mode} item={item} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModeCard({ item }: { item: ModeStats }) {
  const { stats, label } = item;
  const empty = stats.totalMatches === 0;

  return (
    <View style={[styles.card, empty && styles.cardEmpty]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.cardCount}>
          {empty
            ? 'Sem partidas'
            : `${stats.totalMatches} ${stats.totalMatches === 1 ? 'partida' : 'partidas'}`}
        </Text>
      </View>

      {empty ? null : (
        <>
          <View style={styles.row}>
            <Mini label="Partidas" value={String(stats.totalMatches)} />
            <Mini label="Vitórias" value={String(stats.wins)} color={colors.win} />
            <Mini label="Derrotas" value={String(stats.losses)} color={colors.loss} />
          </View>

          <View style={styles.row}>
            <Mini
              label="Taxa de vitória"
              value={formatWinRate(stats.winRate)}
              color={(stats.winRate ?? 0) >= 50 ? colors.win : colors.loss}
            />
            <Mini label="KDA médio" value={formatKda(stats)} color={colors.gold} />
          </View>

          <View style={styles.row}>
            <Mini label="Kills" value={String(stats.totalKills)} small />
            <Mini label="Mortes" value={String(stats.totalDeaths)} small />
            <Mini label="Assist." value={String(stats.totalAssists)} small />
          </View>

          <Text style={styles.avg}>
            Média por partida: {formatNumber(stats.avgKills, 1)} /{' '}
            {formatNumber(stats.avgDeaths, 1)} /{' '}
            {formatNumber(stats.avgAssists, 1)}
          </Text>
        </>
      )}
    </View>
  );
}

function Mini({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <View style={styles.mini}>
      <Text
        style={[
          styles.miniValue,
          small && styles.miniValueSmall,
          color ? { color } : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.miniLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { flex: 1 },
  title: { color: colors.goldLight, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: 12, paddingTop: 10, paddingBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardEmpty: { opacity: 0.55 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { flex: 1, color: colors.goldLight, fontSize: 16, fontWeight: '800' },
  cardCount: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  mini: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  miniValue: { color: colors.goldLight, fontSize: 20, fontWeight: '900' },
  miniValueSmall: { fontSize: 16 },
  miniLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  avg: { color: colors.textMuted, fontSize: 12 },
});
