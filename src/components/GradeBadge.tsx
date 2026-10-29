import { StyleSheet, Text, View } from 'react-native';
import { Grade, gradeColor } from '../services/grade';

type Size = 'small' | 'large';

type Props = {
  grade: Grade;
  size?: Size;
};

const SIZES = {
  small: { box: 28, font: 15, fontND: 10, border: 1.5, radius: 8 },
  large: { box: 76, font: 44, fontND: 26, border: 3, radius: 18 },
};

/** Selo com a nota (S, A, B, C, D ou ND). */
export function GradeBadge({ grade, size = 'small' }: Props) {
  const color = gradeColor(grade);
  const s = SIZES[size];
  const isND = grade === 'ND';

  return (
    <View
      style={[
        styles.badge,
        {
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          borderWidth: s.border,
          borderColor: color,
          opacity: isND ? 0.7 : 1,
        },
        grade === 'S' && size === 'large' ? styles.glow : null,
      ]}
      accessibilityLabel={`Nota ${grade}`}
    >
      <Text
        style={{
          color,
          fontSize: isND ? s.fontND : s.font,
          fontWeight: '900',
        }}
        allowFontScaling={false}
      >
        {grade}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(10,14,19,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowColor: '#F0C14B',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
