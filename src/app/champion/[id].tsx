import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradeBadge } from '../../components/GradeBadge';
import { MatchItem } from '../../components/MatchItem';
import { StatsPanel } from '../../components/StatsPanel';
import { Match, deleteMatch } from '../../db/matches';
import { useChampionMatches } from '../../hooks/useChampionMatches';
import { useChampions } from '../../hooks/useChampions';
import { portraitUrl, splashUrl } from '../../services/champions';
import { calculateGrade } from '../../services/grade';
import { calculateStats } from '../../services/matchStats';
import { colors } from '../../theme/colors';

export default function ChampionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championId = String(id);

  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const { data } = useChampions();
  const { matches, loading, error, reload } = useChampionMatches(championId);

  const champion = data?.champions.find((c) => c.id === championId);
  const name = champion?.name ?? championId;
  const version = data?.version ?? '';

  // Tudo é recalculado a partir das partidas. Nada de totais salvos.
  const stats = useMemo(() => calculateStats(matches), [matches]);
  const grade = useMemo(() => calculateGrade(matches), [matches]);

  const openForm = useCallback(
    (matchId?: number) => {
      router.push({
        pathname: '/match-form',
        params: {
          championId,
          championName: name,
          ...(matchId !== undefined ? { matchId: String(matchId) } : {}),
        },
      });
    },
    [router, championId, name]
  );

  const confirmDelete = useCallback(
    (match: Match) => {
      Alert.alert(
        'Excluir partida?',
        'Essa partida será removida do histórico e das estatísticas. Não dá para desfazer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMatch(db, match.id);
                await reload();
              } catch {
                Alert.alert('Erro', 'Não foi possível excluir a partida.');
              }
            },
          },
        ]
      );
    },
    [db, reload]
  );

  const header = (
    <View>
      <View style={styles.hero}>
        <Image
          source={{ uri: splashUrl(championId) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          transition={250}
        />
        <LinearGradient
          colors={['rgba(10,14,19,0.15)', 'rgba(10,14,19,1)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroInfo}>
          {version ? (
            <Image
              source={{ uri: portraitUrl(version, championId) }}
              style={styles.portrait}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : null}
          <View style={styles.heroText}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {champion?.title ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {champion.title}
              </Text>
            ) : null}
          </View>
          <View style={styles.gradeBox}>
            <GradeBadge grade={grade.grade} size="large" />
            <Text style={styles.gradeCaption}>NOTA</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        {stats.totalMatches > 0 ? (
          <>
            <StatsPanel
              stats={stats}
              grade={grade}
              matches={matches}
              championName={name}
            />
            <Text style={styles.historyTitle}>
              Histórico ({stats.totalMatches})
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );

  const empty = loading ? (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.gold} />
    </View>
  ) : error ? (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={44} color={colors.red} />
      <Text style={styles.message}>{error}</Text>
      <Pressable style={styles.retry} onPress={reload}>
        <Text style={styles.retryText}>Tentar novamente</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.center}>
      <Ionicons name="stats-chart-outline" size={44} color={colors.textMuted} />
      <Text style={styles.message}>
        Você ainda não registrou partidas com {name}.{'\n'}
        Sua nota fica como ND até a primeira partida.{'\n'}
        Toque em “Registrar partida” para começar.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <MatchItem
              match={item}
              onEdit={(m) => openForm(m.id)}
              onDelete={confirmDelete}
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => router.back()}
        style={[styles.back, { top: insets.top + 8 }]}
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={26} color={colors.goldLight} />
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => openForm()}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Ionicons name="add-circle" size={24} color={colors.bg} />
          <Text style={styles.ctaText}>Registrar partida</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { flexGrow: 1, paddingBottom: 16 },
  hero: { height: 260, justifyContent: 'flex-end' },
  heroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  portrait: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  heroText: { flex: 1 },
  gradeBox: { alignItems: 'center', gap: 4 },
  gradeCaption: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  name: { color: colors.goldLight, fontSize: 32, fontWeight: '900' },
  subtitle: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: { paddingHorizontal: 14, paddingTop: 4 },
  historyTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 2,
  },
  itemWrap: { paddingHorizontal: 14, paddingTop: 10 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retry: {
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
  back: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,14,19,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.gold,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaText: { color: colors.bg, fontSize: 17, fontWeight: '900' },
});
