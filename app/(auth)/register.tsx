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

export default function RegisterScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuthContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await auth.signUpWithEmail(name.trim() || 'User', email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal daftar');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface, paddingTop: insets.top + 16 }]}>
      <View style={styles.container}>
        <SurfaceCard style={styles.card}>
          <View style={styles.header}>
            <Text style={[styles.brand, { color: colors.primary }]}>Darling</Text>
            <Text style={[styles.desc, { color: colors.onSurfaceMuted }]}>
              Buat akun baru untuk mulai jelajah makanan keliling.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Nama</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="user" size={16} color={colors.outlineVariant} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nama kamu"
                placeholderTextColor={colors.outlineVariant}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="envelope" size={16} color={colors.outlineVariant} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email kamu"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Kata Sandi</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="lock" size={18} color={colors.outlineVariant} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Buat kata sandi"
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
                <Text style={styles.submitText}>{isSubmitting ? 'Memproses...' : 'Daftar'}</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: colors.onSurfaceMuted }]}>Sudah punya akun?</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
                  <Text style={[styles.signupLink, { color: colors.primary }]}>Masuk</Text>
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
