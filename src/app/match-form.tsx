import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LANES, MODES } from '../constants/matchOptions';
import {
  MatchValues,
  getMatchById,
  getMatchesByChampion,
  insertMatch,
  updateMatch,
} from '../db/matches';
import {
  brToIso,
  isoToBr,
  maskBrDate,
  todayIso,
  yesterdayIso,
} from '../services/dates';
import { MatchResult } from '../services/matchStats';
import { colors } from '../theme/colors';

const MAX_STAT = 99;
const MAX_NOTES = 300;

type Errors = Partial<
  Record<'result' | 'kills' | 'deaths' | 'assists' | 'date' | 'lane' | 'mode', string>
>;

export default function MatchFormScreen() {
  const params = useLocalSearchParams<{
    championId: string;
    championName?: string;
    matchId?: string;
  }>();
  const championId = String(params.championId);
  const championName = params.championName ?? championId;
  const matchId = params.matchId ? Number(params.matchId) : null;
  const isEditing = matchId !== null;

  const router = useRouter();
  const db = useSQLiteContext();

  const [result, setResult] = useState<MatchResult | null>(null);
  const [kills, setKills] = useState('0');
  const [deaths, setDeaths] = useState('0');
  const [assists, setAssists] = useState('0');
  const [lane, setLane] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>('ranked_solo');
  const [dateText, setDateText] = useState(isoToBr(todayIso()));
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const fieldY = useRef<Record<string, number>>({});

  /* Carrega a partida (edição) ou sugere rota/modo da última partida (novo). */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (matchId !== null) {
          const m = await getMatchById(db, matchId);
          if (cancelled) return;
          if (!m) {
            Alert.alert('Partida não encontrada', 'Ela pode ter sido excluída.');
            router.back();
            return;
          }
          setResult(m.result);
          setKills(String(m.kills));
          setDeaths(String(m.deaths));
          setAssists(String(m.assists));
          setLane(m.lane);
          setMode(m.mode);
          setDateText(isoToBr(m.playedAt));
          setNotes(m.notes ?? '');
        } else {
          const list = await getMatchesByChampion(db, championId);
          if (cancelled) return;
          if (list[0]) {
            setLane(list[0].lane);
            setMode(list[0].mode);
          }
        }
      } catch {
        if (!cancelled) {
          Alert.alert('Erro', 'Não foi possível carregar os dados.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [db, championId, matchId, router]);

  /* Dá espaço extra no fim da rolagem quando o teclado está aberto. */
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const clearError = (key: keyof Errors) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const rememberY = (key: string) => (e: LayoutChangeEvent) => {
    fieldY.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToField = (key: string) => {
    const y = fieldY.current[key];
    if (y === undefined) return;
    setTimeout(
      () => scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true }),
      150
    );
  };

  const toStat = (text: string) => {
    if (text.trim() === '') return NaN;
    return Number(text);
  };

  const validate = (): { errors: Errors; values: MatchValues | null } => {
    const errs: Errors = {};

    if (!result) errs.result = 'Escolha vitória ou derrota.';

    const k = toStat(kills);
    const d = toStat(deaths);
    const a = toStat(assists);
    const checkStat = (n: number, key: 'kills' | 'deaths' | 'assists') => {
      if (!Number.isInteger(n)) errs[key] = 'Informe um número.';
      else if (n < 0) errs[key] = 'Não pode ser negativo.';
      else if (n > MAX_STAT) errs[key] = `Máximo ${MAX_STAT}.`;
    };
    checkStat(k, 'kills');
    checkStat(d, 'deaths');
    checkStat(a, 'assists');

    const iso = brToIso(dateText);
    if (!iso) errs.date = 'Data inválida. Use DD/MM/AAAA.';
    else if (iso > todayIso()) errs.date = 'A data não pode ser no futuro.';

    if (!lane) errs.lane = 'Escolha a rota.';
    if (!mode) errs.mode = 'Escolha o modo de jogo.';

    if (Object.keys(errs).length > 0 || !result || !iso || !lane || !mode) {
      return { errors: errs, values: null };
    }

    return {
      errors: errs,
      values: {
        result,
        kills: k,
        deaths: d,
        assists: a,
        lane,
        mode,
        playedAt: iso,
        notes: notes.trim() === '' ? null : notes.trim(),
      },
    };
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const { errors: errs, values } = validate();
    setErrors(errs);
    if (!values) return;

    setSaving(true);
    try {
      if (matchId !== null) await updateMatch(db, matchId, values);
      else await insertMatch(db, championId, values);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Erro', 'Não foi possível salvar a partida. Tente novamente.');
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityLabel="Fechar"
          hitSlop={8}
        >
          <Ionicons name="close" size={26} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {isEditing ? 'Editar partida' : 'Registrar partida'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {championName}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 32 + keyboardHeight },
          ]}
        >
          {/* Resultado */}
          <Text style={styles.label}>Resultado</Text>
          <View style={styles.resultRow}>
            <ResultButton
              label="Vitória"
              color={colors.win}
              active={result === 'win'}
              onPress={() => {
                setResult('win');
                clearError('result');
              }}
            />
            <ResultButton
              label="Derrota"
              color={colors.loss}
              active={result === 'loss'}
              onPress={() => {
                setResult('loss');
                clearError('result');
              }}
            />
          </View>
          <FieldError message={errors.result} />

          {/* K / D / A */}
          <Text style={styles.label}>Kills / Mortes / Assistências</Text>
          <NumberField
            label="Kills"
            value={kills}
            onChange={(v) => {
              setKills(v);
              clearError('kills');
            }}
            error={errors.kills}
          />
          <NumberField
            label="Mortes"
            value={deaths}
            onChange={(v) => {
              setDeaths(v);
              clearError('deaths');
            }}
            error={errors.deaths}
          />
          <NumberField
            label="Assistências"
            value={assists}
            onChange={(v) => {
              setAssists(v);
              clearError('assists');
            }}
            error={errors.assists}
          />

          {/* Data */}
          <View onLayout={rememberY('date')}>
            <Text style={styles.label}>Data da partida</Text>
            <View style={styles.dateRow}>
              <TextInput
                value={dateText}
                onChangeText={(t) => {
                  setDateText(maskBrDate(t));
                  clearError('date');
                }}
                onFocus={() => scrollToField('date')}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                style={[
                  styles.dateInput,
                  errors.date ? styles.inputError : null,
                ]}
              />
              <SmallChip
                label="Hoje"
                onPress={() => {
                  setDateText(isoToBr(todayIso()));
                  clearError('date');
                }}
              />
              <SmallChip
                label="Ontem"
                onPress={() => {
                  setDateText(isoToBr(yesterdayIso()));
                  clearError('date');
                }}
              />
            </View>
            <FieldError message={errors.date} />
          </View>

          {/* Rota */}
          <Text style={styles.label}>Rota jogada</Text>
          <View style={styles.chipWrap}>
            {LANES.map((l) => (
              <Chip
                key={l.value}
                label={l.label}
                active={lane === l.value}
                onPress={() => {
                  setLane(l.value);
                  clearError('lane');
                }}
              />
            ))}
          </View>
          <FieldError message={errors.lane} />

          {/* Modo */}
          <Text style={styles.label}>Modo de jogo</Text>
          <View style={styles.chipWrap}>
            {MODES.map((m) => (
              <Chip
                key={m.value}
                label={m.label}
                active={mode === m.value}
                onPress={() => {
                  setMode(m.value);
                  clearError('mode');
                }}
              />
            ))}
          </View>
          <FieldError message={errors.mode} />

          {/* Observações */}
          <View onLayout={rememberY('notes')}>
            <Text style={styles.label}>Observações (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onFocus={() => scrollToField('notes')}
              placeholder="Ex.: build, matchup, o que deu certo..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MAX_NOTES}
              style={styles.notesInput}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {notes.length}/{MAX_NOTES}
            </Text>
          </View>

          {hasErrors ? (
            <Text style={styles.summaryError}>
              Corrija os campos destacados em vermelho.
            </Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || saving) && styles.saveButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.saveText}>
                {isEditing ? 'Salvar alterações' : 'Salvar partida'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ---------- Pedaços do formulário ---------- */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

function ResultButton({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.resultButton,
        { borderColor: color },
        active && { backgroundColor: color },
      ]}
    >
      <Text style={[styles.resultText, { color: active ? colors.bg : color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SmallChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.smallChip}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

function NumberField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const parsed = parseInt(value, 10);
  const current = Number.isNaN(parsed) ? 0 : parsed;

  return (
    <View>
      <View style={styles.numberRow}>
        <Text style={styles.numberLabel}>{label}</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => onChange(String(Math.max(0, current - 1)))}
            disabled={current <= 0}
            style={[styles.stepButton, current <= 0 && styles.stepDisabled]}
            accessibilityLabel={`Diminuir ${label}`}
          >
            <Ionicons name="remove" size={24} color={colors.gold} />
          </Pressable>
          <TextInput
            value={value}
            onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={[styles.numberInput, error ? styles.inputError : null]}
          />
          <Pressable
            onPress={() => onChange(String(Math.min(MAX_STAT, current + 1)))}
            disabled={current >= MAX_STAT}
            style={[styles.stepButton, current >= MAX_STAT && styles.stepDisabled]}
            accessibilityLabel={`Aumentar ${label}`}
          >
            <Ionicons name="add" size={24} color={colors.gold} />
          </Pressable>
        </View>
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { color: colors.goldLight, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 10 },
  label: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 2,
  },
  resultRow: { flexDirection: 'row', gap: 12 },
  resultButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  resultText: { fontSize: 17, fontWeight: '900' },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 8,
    height: 60,
  },
  numberLabel: { color: colors.goldLight, fontSize: 16, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.35 },
  numberInput: {
    width: 56,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.goldLight,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
  },
  inputError: { borderColor: colors.red },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallChip: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.gold, fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: colors.bg },
  notesInput: {
    minHeight: 100,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: { color: colors.red, fontSize: 12, marginTop: 4 },
  summaryError: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveButtonPressed: { opacity: 0.8 },
  saveText: { color: colors.bg, fontSize: 17, fontWeight: '900' },
  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
});
