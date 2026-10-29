import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { getFavoriteIds, setFavorite } from "../db/database";
import { useGrades } from "../hooks/useGrades";
import { useChampions } from "../hooks/useChampions";
import { ChampionCard } from "../components/ChampionCard";
import { Champion, normalizeText, sortChampions } from "../services/champions";

type Filter = "all" | "fav";

// Mostrar "ND" (sem nota) nos campeões que você ainda não jogou?
// Troque para false se achar que enche demais a tela.
const SHOW_ND_ON_HOME = true;

const GAP = 10;
const PADDING = 14;

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data, loading, error, retry } = useChampions();
  const grades = useGrades();

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getFavoriteIds(db).then((ids) => setFavorites(new Set(ids)));
  }, [db]);

  const columns = width >= 600 ? 5 : 3;
  const cardWidth = (width - PADDING * 2 - GAP * (columns - 1)) / columns;

  const toggleFavorite = useCallback(
    (champion: Champion) => {
      const willBeFavorite = !favorites.has(champion.id);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (willBeFavorite) next.add(champion.id);
        else next.delete(champion.id);
        return next;
      });
      setFavorite(db, champion.id, willBeFavorite).catch(() => {
        // desfaz se o banco falhar
        setFavorites((prev) => {
          const next = new Set(prev);
          if (willBeFavorite) next.delete(champion.id);
          else next.add(champion.id);
          return next;
        });
      });
    },
    [db, favorites],
  );

  const openChampion = useCallback(
    (champion: Champion) => {
      router.push({
        pathname: "/champion/[id]",
        params: { id: champion.id },
      });
    },
    [router],
  );

  const list = useMemo(() => {
    if (!data) return [];
    const q = normalizeText(query);
    let filtered = data.champions;
    if (q) {
      filtered = filtered.filter((c) => normalizeText(c.name).includes(q));
    }
    if (filter === "fav") {
      filtered = filtered.filter((c) => favorites.has(c.id));
    }
    return sortChampions(filtered, favorites);
  }, [data, query, filter, favorites]);

  const version = data?.version ?? "";

  const renderItem = useCallback(
    ({ item }: { item: Champion }) => (
      <ChampionCard
        champion={item}
        version={version}
        width={cardWidth}
        isFavorite={favorites.has(item.id)}
        grade={
          grades[item.id] ?? (SHOW_ND_ON_HOME ? "ND" : undefined)
        }
        onPress={openChampion}
        onToggleFavorite={toggleFavorite}
      />
    ),
    [version, cardWidth, favorites, grades, openChampion, toggleFavorite],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          LOL <Text style={styles.titleAccent}>STATS</Text>
        </Text>
        <Text style={styles.subtitle}>
          {data ? `${data.champions.length} campeões` : "Carregando..."}
          {favorites.size > 0 ? `  •  ${favorites.size} favoritos` : ""}
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar campeão..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filters}>
        <FilterChip
          label="Todos"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterChip
          label="Favoritos"
          icon="star"
          active={filter === "fav"}
          onPress={() => setFilter("fav")}
        />
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.message}>Carregando campeões...</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline" size={48} color={colors.red} />
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.button} onPress={retry}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={columns}
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={18}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name={filter === "fav" ? "star-outline" : "search"}
                size={44}
                color={colors.textMuted}
              />
              <Text style={styles.message}>
                {filter === "fav" && !query
                  ? "Você ainda não tem favoritos.\nToque na estrela de um campeão para adicioná-lo."
                  : "Nenhum campeão encontrado."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.bg : colors.gold}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: PADDING, paddingTop: 8, paddingBottom: 12 },
  title: {
    color: colors.goldLight,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 3,
  },
  titleAccent: { color: colors.gold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: PADDING,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16 },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: PADDING,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.gold, fontWeight: "700", fontSize: 14 },
  chipTextActive: { color: colors.bg },
  listContent: { paddingHorizontal: PADDING, paddingBottom: 30, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 14,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
});

