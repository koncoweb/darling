import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type TopAppBarProps = {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  variant?: 'glass' | 'solid';
};

export function TopAppBar({ title, left, right, variant = 'glass' }: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {variant === 'glass' ? (
        <BlurView
          intensity={70}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[colors.surface, colors.surfaceContainerLow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <Text style={[styles.title, { color: colors.primary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

type IconButtonProps = {
  onPress?: () => void;
  children: React.ReactNode;
};

export function TopAppBarIconButton({ onPress, children }: IconButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton} hitSlop={10}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  row: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.18,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
