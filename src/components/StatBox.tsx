import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  label: string;
  value: string;
  color?: string;
  /** Se informado, o cartão vira um botão (mostra uma setinha ao lado do rótulo). */
  onPress?: () => void;
  accessibilityHint?: string;
};

/** Cartão pequeno com um número grande e um rótulo embaixo. */
export function StatBox({
  label,
  value,
  color,
  onPress,
  accessibilityHint,
}: Props) {
  const content = (
    <>
      <Text
        style={[styles.value, color ? { color } : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {onPress ? (
          <Ionicons name="chevron-forward" size={14} color={colors.gold} />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.box}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.box,
        styles.boxPressable,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  boxPressable: { borderColor: colors.gold },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  value: { color: colors.goldLight, fontSize: 24, fontWeight: '900' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
