import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export function SurfaceSection({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  return (
    <View style={[styles.section, { backgroundColor: colors.surfaceContainerLow }, style]}>
      {children}
    </View>
  );
}

export function SurfaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }, style]}>
      {children}
    </View>
  );
}

export function GradientCtaButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={[colors.primary, 'rgba(255, 140, 0, 0.75)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cta}>
        <View style={styles.ctaRow}>
          {icon}
          <Text style={styles.ctaLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function RingAvatar({
  uri,
  size = 48,
  active = false,
}: {
  uri: string;
  size?: number;
  active?: boolean;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const ringSize = size + 6;

  return (
    <View
      style={[
        styles.ring,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderColor: colors.primary,
        },
      ]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
      {active ? (
        <View
          style={[
            styles.activeDot,
            { backgroundColor: colors.primary, borderColor: colors.background },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 20,
    padding: 14,
  },
  card: {
    borderRadius: 18,
    padding: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  cta: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: 'rgba(69, 40, 0, 1)',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaLabel: {
    color: '#fff5ed',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  ring: {
    borderWidth: 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    right: 0,
    bottom: 0,
  },
});
