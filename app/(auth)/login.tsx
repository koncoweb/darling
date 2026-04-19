import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { SurfaceCard } from '@/components/ui/Kinetic';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function LoginScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await auth.signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal masuk');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface, paddingTop: insets.top + 16 }]}>
      <View style={styles.container}>
        <SurfaceCard style={styles.card}>
          <LinearGradient
            colors={[colors.surfaceContainerLow, 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.decor}
          />

          <View style={styles.header}>
            <Text style={[styles.brand, { color: colors.primary }]}>Darling</Text>
            <Text style={[styles.desc, { color: colors.onSurfaceMuted }]}>
              Selamat datang kembali! Silakan masuk ke akun Anda.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="envelope" size={16} color={colors.outlineVariant} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email Anda"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <View style={styles.passwordHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Kata Sandi</Text>
              <Pressable>
                <Text style={[styles.forgot, { color: colors.primary }]}>Lupa Sandi?</Text>
              </Pressable>
            </View>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="lock" size={18} color={colors.outlineVariant} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan kata sandi"
                placeholderTextColor={colors.outlineVariant}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {errorMessage ? (
              <Text style={[styles.error, { color: colors.primary }]}>{errorMessage}</Text>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [pressed && styles.pressed, isSubmitting && styles.disabled]}>
              <LinearGradient
                colors={[colors.primary, 'rgba(255, 140, 0, 0.75)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submit}>
                <Text style={styles.submitText}>{isSubmitting ? 'Memproses...' : 'Masuk'}</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.surfaceContainerLow }]} />
              <Text style={[styles.dividerText, { color: colors.onSurfaceMuted }]}>atau masuk dengan</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.surfaceContainerLow }]} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.social,
                { backgroundColor: colors.surfaceContainerLow },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.socialText, { color: colors.text }]}>Google</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.social,
                { backgroundColor: colors.surfaceContainerLow },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.socialText, { color: colors.text }]}>Facebook</Text>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: colors.onSurfaceMuted }]}>Belum punya akun?</Text>
              <Link href="/(auth)/register" asChild>
                <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
                  <Text style={[styles.signupLink, { color: colors.primary }]}>Daftar sekarang</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </SurfaceCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 18,
    overflow: 'hidden',
  },
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
  },
  brand: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 36,
    letterSpacing: -0.72,
  },
  desc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  form: {
    gap: 12,
  },
  label: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
  },
  inputWrap: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    paddingVertical: 0,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  forgot: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 11,
  },
  submit: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#fff5ed',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  divider: {
    marginTop: 6,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11,
  },
  social: {
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialText: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 13,
  },
  signupRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  signupText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
  },
  signupLink: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  error: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
