import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getCurrentPositionAsync, requestForegroundPermissionsAsync } from 'expo-location/build/Location';
import { LocationAccuracy } from 'expo-location/build/Location.types';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image } from 'expo-image';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { GradientCtaButton, SurfaceCard, SurfaceSection } from '@/components/ui/Kinetic';
import { TopAppBar, TopAppBarIconButton } from '@/components/ui/TopAppBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createMerchant, getMyMerchant, updateMerchant, type Merchant } from '@/lib/dataApi';

export default function ProfilSayaScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const auth = useAuthContext();
  const router = useRouter();
  const [merchant, setMerchant] = React.useState<Merchant | null>(null);
  const [merchantLoading, setMerchantLoading] = React.useState(false);
  const [storeName, setStoreName] = React.useState('');
  const [storeDesc, setStoreDesc] = React.useState('');
  const [storeCategory, setStoreCategory] = React.useState('');
  const [merchantError, setMerchantError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.user) {
      setMerchant(null);
      return;
    }
    let cancelled = false;
    setMerchantLoading(true);
    setMerchantError(null);
    getMyMerchant(auth.user.id, auth.jwt)
      .then((m) => {
        if (cancelled) return;
        setMerchant(m);
        if (m) {
          setStoreName(m.store_name);
          setStoreDesc(m.description ?? '');
          setStoreCategory(m.category ?? '');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setMerchantError(e instanceof Error ? e.message : 'Gagal memuat data pedagang');
      })
      .finally(() => {
        if (cancelled) return;
        setMerchantLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.jwt, auth.user]);

  async function handleCreateMerchant() {
    if (!auth.user) return;
    setMerchantError(null);
    setMerchantLoading(true);
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) throw new Error('JWT belum tersedia. Silakan coba lagi.');
      const created = await createMerchant(jwt, {
        owner_user_id: auth.user.id,
        store_name: storeName.trim(),
        description: storeDesc.trim().length ? storeDesc.trim() : null,
        category: storeCategory.trim().length ? storeCategory.trim().toLowerCase() : 'other',
      });
      if (!created) throw new Error('Gagal membuat akun pedagang');
      setMerchant(created);
    } catch (e) {
      setMerchantError(e instanceof Error ? e.message : 'Gagal membuat akun pedagang');
    } finally {
      setMerchantLoading(false);
    }
  }

  async function handleToggleKeliling() {
    if (!auth.user || !merchant) return;
    setMerchantError(null);
    setMerchantLoading(true);
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) throw new Error('JWT belum tersedia. Silakan coba lagi.');

      const nextActive = !merchant.is_active;
      const patch: Record<string, unknown> = {
        is_active: nextActive,
        last_active_at: new Date().toISOString(),
      };

      if (nextActive) {
        if (Platform.OS === 'web') {
          throw new Error('Update lokasi belum didukung di web preview.');
        }
        const perm = await requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          throw new Error('Izin lokasi ditolak. Aktifkan izin lokasi untuk mulai keliling.');
        }
        const pos = await getCurrentPositionAsync({
          accuracy: LocationAccuracy.Balanced,
        });
        patch.last_lat = pos.coords.latitude;
        patch.last_lng = pos.coords.longitude;
      }

      const next = await updateMerchant(jwt, merchant.id, {
        ...(patch as any),
      });
      if (next) setMerchant(next);
    } catch (e) {
      setMerchantError(e instanceof Error ? e.message : 'Gagal update status');
    } finally {
      setMerchantLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <StatusBar style="auto" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 96 + insets.bottom },
        ]}>
        <SurfaceSection style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDNHTfocwvNsUYq-ffjnN4gfTfBW7mMBe7Vwy0ahXJdmsqYtzO-We5w3BjBHeqpZw04SSpPGWKFfm1fG67VnIH1fQs1eKs4PMsTiaT24TYO4v0UzetnQzYsyIjX2yYBCG6zM8Unj53H60lnCNUHfDADyuoxA-6ZxER00x4P79cikB6b_vBz3QzKijfyi4M4KGBPl3yiGdKCtOQcTGxnSJ_oxyLNf3PWQM9y3_ZDwkb4lRzbWHqrSamyD4GuJRp4Tra647kYGYFL9w',
                }}
                style={[styles.avatar, { borderColor: colors.surface }]}
              />
              <View style={[styles.verified, { backgroundColor: colors.secondary }]}>
                <FontAwesome name="check" size={12} color={colors.background} />
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { color: colors.primary }]} numberOfLines={1}>
                {merchant?.store_name ?? auth.user?.email?.split('@')[0] ?? 'Profil Pengguna'}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                {merchant?.description ?? (merchant?.category ? `Kategori: ${merchant.category}` : 'Mari bereksplorasi rasa hari ini')}
              </Text>
              {merchant ? (
                <View style={styles.chips}>
                  <Chip icon="star" label="4.5" />
                  <Chip icon="shopping-bag" label={merchant.category ?? 'Makanan'} />
                </View>
              ) : null}
            </View>
          </View>

          {merchant ? (
            <View style={styles.heroActions}>
              <Pressable onPress={() => router.push('/edit-menu')} style={({ pressed }) => [pressed && styles.pressed]}>
                <GradientCtaButton
                  label="Edit Menu"
                  icon={<FontAwesome name="edit" size={16} color="#fff5ed" />}
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { backgroundColor: colors.surfaceContainerLowest },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Analitik (Segera)</Text>
              </Pressable>
            </View>
          ) : null}

          <LinearGradient
            colors={['rgba(253, 139, 0, 0.12)', 'rgba(0,0,0,0)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 0.9 }}
            style={styles.heroGlow}
          />
        </SurfaceSection>

        {merchant ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard icon="line-chart" value="14%" label="Pertumbuhan" color={colors.secondary} />
              <StatCard icon="eye" value="1.2k" label="Dilihat" color={colors.primary} />
              <StatCard icon="heart" value="120" label="Favorit" color="#efc52b" />
              <StatCard icon="fire" value="Top 5%" label="Area Ini" color="#f95630" />
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Cerita Jualan Hari Ini</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>
                  Sorotan dari daganganmu
                </Text>
              </View>
              <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
                <View style={styles.seeAllRow}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua</Text>
                  <FontAwesome name="arrow-right" size={12} color={colors.primary} />
                </View>
              </Pressable>
            </View>

            <View style={styles.storyGrid}>
              <StoryCard
                uri="https://lh3.googleusercontent.com/aida-public/AB6AXuAg-_zuGHqtomkf4pngDXUini3huXEYjNxenr62Al4Qmc9UCnnHknfJwluE2t-PM2uh0AI844iQc3IqnrwSvEyeh9AKdZc5Sb02MYT6Nl89LHf-FBZCsbR3gxyGqsZOhETMRA6jK-fC8-BRAHwk-1KTHcbpjYrlZzPDnYsx5yznQ2nQuc78MXONOiyoHEzv96qUfOaq5bTyyFiS7nupZkwAFHgxgM29h4DsNWhGmpd8_k9ZjnntomeJj_Fs2mzhM7UL8faRY0YEAzEx"
                views="214"
              />
              <StoryCard
                uri="https://lh3.googleusercontent.com/aida-public/AB6AXuD7WJ5WO7z4lZ6X9iNr-ZqUkymXag4L14R5_PlJ9vnk_bAPP0gVkYVZ9K_8svfI3sB-rTvowMB2PS4RzthrWGZcRFVdxr3NiDCjRFNDCJNNFC16U4-xGjMx8NMgl_UiaPGcYlutDbZSpv2hdVw0yA7Cf3ZsF0--ym9HSThuw6u3f3zBLFxRMyEUiYT_lcAgVmIFwiPzL3knEQmu0QodWG9LRkkNrYrx4FgMM6gIftjvMsBRwtYVAhTpzPr25HhtNREtHj4E-r2585x8"
                views="89"
              />
              <StoryCard
                uri="https://lh3.googleusercontent.com/aida-public/AB6AXuDEfoqQVIraWhSv7bqJp22fhsy_4zsax4PSneOFXgzpElLJIEDjXad5jHWM07cS5ZrPUuERav5pNztk97V-8Eq22PQ4Xs2xB_3h0tCsEZCbDThP4T7DxazUkKVNmMNUC9xaFTCBD3WCcyOLxwZt8AWsJaUNwgBBx8-6oHdvL6vNyAdF2vBpe0HzftBs8nHFnvBcTx9kiafOIs6qfJagZ7DMfr2-XECucwkzKFrjj2ztrtbv6coXioJDiMeSTR8LYQRpIRjCXqHCY3Q-"
                views="150"
              />
              <SurfaceCard style={styles.newStory}>
                <View style={styles.newStoryInner}>
                  <FontAwesome name="plus-circle" size={34} color={colors.onSurfaceMuted} />
                  <Text style={[styles.newStoryText, { color: colors.onSurfaceMuted }]}>Buat Cerita</Text>
                </View>
              </SurfaceCard>
            </View>
          </>
        ) : null}

        {auth.user ? (
          <SurfaceCard style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Akun Aktif</Text>
            <Text style={[styles.authSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
              {auth.user.email}
            </Text>
            <View style={styles.authRow}>
              <Pressable
                onPress={auth.signOut}
                style={({ pressed }) => [
                  styles.authBtn,
                  { backgroundColor: colors.surfaceContainerLow },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.authBtnText, { color: colors.primary }]}>Keluar</Text>
              </Pressable>
            </View>
          </SurfaceCard>
        ) : (
          <SurfaceCard style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Masuk untuk mulai jualan</Text>
            <Text style={[styles.authSubtitle, { color: colors.onSurfaceMuted }]}>
              Login/daftar untuk mengaktifkan fitur pedagang, unggah video, dan update lokasi.
            </Text>
            <View style={styles.authRow}>
              <Link href="/(auth)/login" asChild>
                <Pressable style={({ pressed }) => [styles.authBtn, pressed && styles.pressed]}>
                  <Text style={[styles.authBtnText, { color: colors.primary }]}>Masuk</Text>
                </Pressable>
              </Link>
              <Link href="/(auth)/register" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.authBtn,
                    { backgroundColor: colors.surfaceContainerLow },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.authBtnText, { color: colors.primary }]}>Daftar</Text>
                </Pressable>
              </Link>
            </View>
          </SurfaceCard>
        )}

        {auth.user ? (
          <SurfaceCard style={styles.merchantCard}>
            <View style={styles.merchantHeader}>
              <Text style={[styles.merchantTitle, { color: colors.text }]}>Akun Pedagang</Text>
              {merchant ? (
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: merchant.is_active ? colors.secondary : colors.surfaceContainerLow },
                  ]}>
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {merchant.is_active ? 'Aktif Keliling' : 'Nonaktif'}
                  </Text>
                </View>
              ) : null}
            </View>

            {merchantError ? (
              <Text style={[styles.merchantError, { color: colors.primary }]}>{merchantError}</Text>
            ) : null}

            {merchant ? (
              <>
                <Text style={[styles.merchantName, { color: colors.primary }]} numberOfLines={1}>
                  {merchant.store_name}
                </Text>
                <Text style={[styles.merchantDesc, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                  {merchant.category ? `Kategori: ${merchant.category}` : ''} 
                  {merchant.description ? ` • ${merchant.description}` : ''}
                </Text>
                <View style={styles.merchantActions}>
                  <Pressable
                    onPress={() => router.push('/edit-menu')}
                    style={({ pressed }) => [
                      styles.merchantBtn,
                      { backgroundColor: colors.surfaceContainerLow },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.merchantBtnText, { color: colors.primary }]}>
                      Edit Menu
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleToggleKeliling}
                    disabled={merchantLoading}
                    style={({ pressed }) => [
                      styles.merchantBtn,
                      { backgroundColor: colors.surfaceContainerLow },
                      pressed && styles.pressed,
                      merchantLoading && styles.disabled,
                    ]}>
                    <Text style={[styles.merchantBtnText, { color: colors.primary }]}>
                      {merchant.is_active ? 'Berhenti' : 'Mulai Keliling'}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.merchantDesc, { color: colors.onSurfaceMuted }]}>
                  Daftarkan akun pedagang untuk upload video dan tampil di peta.
                </Text>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Gerobak / Toko</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                  <TextInput
                    value={storeName}
                    onChangeText={setStoreName}
                    placeholder="Contoh: Kopi Keliling Pak Kumis"
                    placeholderTextColor={colors.outlineVariant}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Deskripsi</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                  <TextInput
                    value={storeDesc}
                    onChangeText={setStoreDesc}
                    placeholder="Contoh: kopi susu gula aren, roti bakar"
                    placeholderTextColor={colors.outlineVariant}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Kategori Jualan</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                  <TextInput
                    value={storeCategory}
                    onChangeText={setStoreCategory}
                    placeholder="kopi, bakso, sate, atau lainnya"
                    placeholderTextColor={colors.outlineVariant}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <Pressable
                  onPress={handleCreateMerchant}
                  disabled={merchantLoading || storeName.trim().length < 3}
                  style={({ pressed }) => [pressed && styles.pressed, (merchantLoading || storeName.trim().length < 3) && styles.disabled]}>
                  <View style={[styles.createMerchantBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.createMerchantText}>
                      {merchantLoading ? 'Memproses...' : 'Daftar Jadi Pedagang'}
                    </Text>
                  </View>
                </Pressable>
              </>
            )}
          </SurfaceCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  hero: {
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -90,
    right: -90,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 92,
    height: 92,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderCurve: 'circular',
    borderWidth: 4,
  },
  verified: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    right: 6,
    bottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    letterSpacing: -0.48,
  },
  heroSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  chips: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroActions: {
    marginTop: 14,
    gap: 10,
  },
  secondaryBtn: {
    borderRadius: 999,
    borderCurve: 'continuous',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
  },
  secondaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.18,
  },
  sectionSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAll: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
  },
  storyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  newStory: {
    width: '48%',
    aspectRatio: 9 / 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  newStoryInner: {
    alignItems: 'center',
    gap: 8,
  },
  newStoryText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  authCard: {
    gap: 10,
  },
  authTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    letterSpacing: -0.16,
  },
  authSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  authRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  authBtn: {
    flex: 1,
    borderRadius: 999,
    borderCurve: 'continuous',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 214, 171, 0.5)',
  },
  authBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    letterSpacing: -0.13,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  merchantCard: {
    gap: 10,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  merchantTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    letterSpacing: -0.16,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 11,
  },
  merchantError: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  merchantName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.18,
  },
  merchantDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  merchantActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  merchantBtn: {
    flex: 1,
    borderRadius: 999,
    borderCurve: 'continuous',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    letterSpacing: -0.13,
  },
  inputLabel: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
    marginTop: 8,
  },
  inputWrap: {
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    paddingVertical: 0,
  },
  createMerchantBtn: {
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    boxShadow: '0 4px 12px rgba(253, 139, 0, 0.25)',
  },
  createMerchantText: {
    color: '#fff5ed',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});

function Chip({ icon, label }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string }) {
  return (
    <View style={chipStyles.wrap}>
      <FontAwesome name={icon} size={12} color="#8c4a00" />
      <Text style={chipStyles.text}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,214,171,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderCurve: 'continuous',
  },
  text: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
    color: '#231a14',
  },
});

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  value: string;
  label: string;
  color: string;
}) {
  return (
    <SurfaceCard style={statStyles.card}>
      <FontAwesome name={icon} size={22} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </SurfaceCard>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: '48%',
    gap: 10,
  },
  value: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    color: '#231a14',
    letterSpacing: -0.22,
  },
  label: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    color: 'rgba(35,26,20,0.68)',
  },
});

function StoryCard({ uri, views }: { uri: string; views: string }) {
  return (
    <Pressable style={({ pressed }) => [storyStyles.card, pressed && storyStyles.pressed]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={storyStyles.meta}>
        <FontAwesome name="play" size={12} color="#fff" />
        <Text style={storyStyles.views}>{views}</Text>
      </View>
    </Pressable>
  );
}

const storyStyles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 9 / 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  meta: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  views: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
    color: '#fff',
  },
});
