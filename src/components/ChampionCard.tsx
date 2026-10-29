import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Champion, portraitUrl } from '../services/champions';
import { Grade } from '../services/grade';
import { colors } from '../theme/colors';
import { GradeBadge } from './GradeBadge';

type Props = {
  champion: Champion;
  version: string;
  width: number;
  isFavorite: boolean;
  grade?: Grade;
  onPress: (champion: Champion) => void;
  onToggleFavorite: (champion: Champion) => void;
};

function ChampionCardBase({
  champion,
  version,
  width,
  isFavorite,
  grade,
  onPress,
  onToggleFavorite,
}: Props) {
  return (
    <Pressable
      onPress={() => onPress(champion)}
      style={({ pressed }) => [
        styles.card,
        { width },
        isFavorite && styles.cardFavorite,
        pressed && styles.pressed,
      ]}
    >
      <View style={{ width: width - 2, height: width - 2 }}>
        <Image
          source={{ uri: portraitUrl(version, champion.id) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,14,19,0.95)']}
          style={styles.gradient}
        />
        <Text style={styles.name} numberOfLines={1}>
          {champion.name}
        </Text>

        <Pressable
          onPress={() => onToggleFavorite(champion)}
          hitSlop={8}
          style={styles.star}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={18}
            color={isFavorite ? colors.gold : colors.goldLight}
          />
        </Pressable>

        {grade ? (
          <View style={styles.gradeSlot} pointerEvents="none">
            <GradeBadge grade={grade} size="small" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ChampionCard = memo(ChampionCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardFavorite: { borderColor: colors.gold },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  name: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 5,
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Nota fica à esquerda da estrela
  gradeSlot: {
    position: 'absolute',
    top: 5,
    right: 38,
  },
  star: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(10,14,19,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
