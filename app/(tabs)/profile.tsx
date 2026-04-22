import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getCurrentPositionAsync, requestForegroundPermissionsAsync } from 'expo-location/build/Location';
import { LocationAccuracy } from 'expo-location/build/Location.types';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import React from 'react';
import { Image } from 'expo-image';
import {
    Alert,
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { GradientCtaButton, SurfaceCard, SurfaceSection } from '@/components/ui/Kinetic';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  createMerchant,
  getMyMerchant,
  updateMerchant,
  getUserPreferences,
  upsertUserPreferences,
  listTasteNotes,
  createTasteNote,
  deleteTasteNote,
  listFavoriteMerchants,
  removeFavoriteMerchant,
  listSummonHistory,
  listMyVideos,
  type Merchant,
  type UserProfile,
  type TasteNote as ApiTasteNote,
  type FavoriteMerchantRecord,
  type SummonHistoryRecord,
  type FeedVideo,
} from '@/lib/dataApi';
import VideoGridItem from '@/components/video/VideoGridItem';
import { Dimensions } from 'react-native';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#FF8C00', '#e95d4f', '#4a90d9', '#7c5cbf', '#2eaa6e', '#e07b39'];
function pickColor(str: string) { return AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length]; }

function formatSummonDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const BADGE_LEVELS = [
  { min: 0, label: 'Pelanggan Baru', icon: '⭐', color: '#b7a59a' },
  { min: 3, label: 'Pencinta UMKM', icon: '🌟', color: '#efc52b' },
  { min: 10, label: 'Sultan Keliling', icon: '👑', color: '#FF8C00' },
  { min: 25, label: 'Pahlawan UMKM', icon: '🏆', color: '#f95630' },
];

function getBadge(count: number) {
  let badge = BADGE_LEVELS[0];
  for (const level of BADGE_LEVELS) { if (count >= level.min) badge = level; }
  return badge;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfilSayaScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const auth = useAuthContext();
  const router = useRouter();

  // Merchant state
  const [merchant, setMerchant] = React.useState<Merchant | null>(null);
  const [merchantLoading, setMerchantLoading] = React.useState(false);
  const [merchantError, setMerchantError] = React.useState<string | null>(null);

  // User preferences (from DB)
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [radarActive, setRadarActiveState] = React.useState(false);
  const [radarRadius, setRadarRadiusState] = React.useState(500);
  const [pickupNote, setPickupNote] = React.useState('');
  const [editingPickup, setEditingPickup] = React.useState(false);
  const [pickupAddress, setPickupAddress] = React.useState('Lokasi utama belum diset');
  const [savingPrefs, setSavingPrefs] = React.useState(false);

  // Taste notes (from DB)
  const [tasteNotes, setTasteNotes] = React.useState<ApiTasteNote[]>([]);
  const [tasteLoading, setTasteLoading] = React.useState(false);
  const [newTaste, setNewTaste] = React.useState('');
  const [showAddTaste, setShowAddTaste] = React.useState(false);

  // Favorites (from DB)
  const [favorites, setFavorites] = React.useState<FavoriteMerchantRecord[]>([]);
  const [favLoading, setFavLoading] = React.useState(false);

  // Summon history (from DB)
  const [summonHistory, setSummonHistory] = React.useState<SummonHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // Video stats
  const [myVideos, setMyVideos] = React.useState<FeedVideo[]>([]);
  const [videoCount, setVideoCount] = React.useState(0);

  // Animations
  const radarAnim = React.useRef(new Animated.Value(0)).current;
  const badgePulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (radarActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(radarAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(radarAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      radarAnim.stopAnimation();
      radarAnim.setValue(0);
    }
  }, [radarActive]);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ─── Load all user data when auth changes ────────────────────────────────
  React.useEffect(() => {
    if (!auth.user) {
      setMerchant(null);
      setUserProfile(null);
      setTasteNotes([]);
      setFavorites([]);
      setSummonHistory([]);
      return;
    }
    let cancelled = false;
    const uid = auth.user.id;
    const jwt = auth.jwt;

    const fetchAll = async () => {
      try {
        const [m, pref, notes, favs, history] = await Promise.all([
          getMyMerchant(uid, jwt),
          getUserPreferences(uid, jwt),
          listTasteNotes(uid, jwt),
          listFavoriteMerchants(uid, jwt),
          listSummonHistory(uid, 10, jwt),
        ]);
        if (cancelled) return;
        setMerchant(m);
        setUserProfile(pref);
        setDisplayName(pref?.display_name || auth.user?.email?.split('@')[0] || 'User');
        setRadarActiveState(pref?.radar_active ?? false);
        setRadarRadiusState(pref?.radar_radius_meters ?? 500);
        setPickupNote(pref?.pickup_address ?? '');
        setTasteNotes(notes);
        setFavorites(favs);
        setSummonHistory(history);
        // If we want actual count, we might need a separate count query or just use the list length if small
        // For now, let's assume we fetch a few more to show count if it's < 5
        if (m) {
           const videos = await listMyVideos(m.id, 50, jwt);
           setMyVideos(videos);
           setVideoCount(videos.length);
        }
      } catch (err) {
        console.warn('Profile fetch error', err);
      }
    };

    fetchAll();

    return () => { cancelled = true; };
  }, [auth.jwt, auth.user]);

  // Re-fetch merchant specifically when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      if (auth.user) {
        getMyMerchant(auth.user.id, auth.jwt).then(m => {
          setMerchant(m);
        }).catch(() => {});
      }
    }, [auth.user, auth.jwt])
  );

  // Lazy-load history when accordion opens
  React.useEffect(() => {
    if (!showHistory || !auth.user || summonHistory.length > 0) return;
    setHistoryLoading(true);
    listSummonHistory(auth.user.id, 10, auth.jwt)
      .then((recs) => setSummonHistory(recs))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [showHistory]);

  async function handleToggleKeliling() {
    if (!auth.user || !merchant) return;
    setMerchantError(null);
    setMerchantLoading(true);
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) throw new Error('JWT belum tersedia. Silakan coba lagi.');
      const nextActive = !merchant.is_active;
      const patch: Record<string, unknown> = { is_active: nextActive, last_active_at: new Date().toISOString() };
      if (nextActive) {
        if (Platform.OS === 'web') throw new Error('Update lokasi belum didukung di web preview.');
        const perm = await requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') throw new Error('Izin lokasi ditolak. Aktifkan izin lokasi untuk mulai keliling.');
        const pos = await getCurrentPositionAsync({ accuracy: LocationAccuracy.Balanced });
        patch.last_lat = pos.coords.latitude;
        patch.last_lng = pos.coords.longitude;
      }
      const next = await updateMerchant(jwt, merchant.id, { ...(patch as any) });
      if (next) setMerchant(next);
    } catch (e) {
      setMerchantError(e instanceof Error ? e.message : 'Gagal update status');
    } finally {
      setMerchantLoading(false);
    }
  }

  // ─── Preference helpers ───────────────────────────────────────────────────
  async function savePrefs(patch: Parameters<typeof upsertUserPreferences>[2]) {
    if (!auth.user) return;
    setSavingPrefs(true);
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) return;
      const updated = await upsertUserPreferences(jwt, auth.user.id, patch);
      if (updated) setUserProfile(updated);
    } catch (e) {
      console.warn('savePrefs error', e);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function setRadarActive(value: boolean) {
    setRadarActiveState(value);
    await savePrefs({ radar_active: value, is_visible_on_map: value });
  }

  async function setRadarRadius(value: number) {
    setRadarRadiusState(value);
    await savePrefs({ radar_radius_meters: value });
  }

  async function handleSetPickupLocation() {
    const note = pickupNote.trim();
    setEditingPickup(false);
    if (note.length > 2) {
      setPickupAddress(note);
      await savePrefs({ pickup_note: note });
    }
    setPickupNote('');
  }

  async function handleAddTaste() {
    const label = newTaste.trim();
    if (label.length < 2 || !auth.user) return;
    setTasteLoading(true);
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) return;
      const note = await createTasteNote(jwt, auth.user.id, label);
      if (note) setTasteNotes(prev => [...prev, note]);
    } catch (e) {
      console.warn('handleAddTaste error', e);
    } finally {
      setTasteLoading(false);
    }
    setNewTaste('');
    setShowAddTaste(false);
  }

  async function handleRemoveTaste(id: string) {
    setTasteNotes(prev => prev.filter(t => t.id !== id)); // optimistic
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) return;
      await deleteTasteNote(jwt, id);
    } catch (e) {
      // Revert if failed
      listTasteNotes(auth.user!.id, auth.jwt).then(setTasteNotes).catch(() => {});
    }
  }

  async function handleRemoveFavorite(id: string) {
    const fav = favorites.find(f => f.id === id);
    if (!fav) return;
    
    setFavorites(prev => prev.filter(f => f.id !== id));
    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) return;
      if (typeof removeFavoriteMerchant !== 'undefined') {
        await removeFavoriteMerchant(jwt, fav.user_id, fav.merchant_id);
      }
    } catch (e) {
      console.warn('Remove favorite error', e);
      if (auth.user) {
        listFavoriteMerchants(auth.user.id, auth.jwt).then(setFavorites).catch(() => {});
      }
    }
  }

  const transactionCount = userProfile?.summon_count ?? summonHistory.filter(r => r.status === 'arrived').length;
  const badge = getBadge(transactionCount);
  const isUser = !!auth.user;
  const isMerchant = !!merchant;

  // Merchant Cover Image Logic
  const getCoverImageSource = () => {
    if (merchant) {
      if (merchant.cover_image) {
        return { uri: `data:image/jpeg;base64,${merchant.cover_image}` };
      }
      if (merchant.cover_url) {
        return { uri: merchant.cover_url };
      }
    }
    // Fallback default avatar for user or empty merchant
    return { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDNHTfocwvNsUYq-ffjnN4gfTfBW7mMBe7Vwy0ahXJdmsqYtzO-We5w3BjBHeqpZw04SSpPGWKFfm1fG67VnIH1fQs1eKs4PMsTiaT24TYO4v0UzetnQzYsyIjX2yYBCG6zM8Unj53H60lnCNUHfDADyuoxA-6ZxER00x4P79cikB6b_vBz3QzKijfyi4M4KGBPl3yiGdKCtOQcTGxnSJ_oxyLNf3PWQM9y3_ZDwkb4lRzbWHqrSamyD4GuJRp4Tra647kYGYFL9w' };
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <StatusBar style="auto" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <SurfaceSection style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatarWrap}>
              <Image
                source={getCoverImageSource()}
                style={[styles.avatar, { borderColor: colors.surface }]}
              />
              <View style={[styles.verified, { backgroundColor: colors.secondary }]}>
                <FontAwesome name="check" size={12} color="#231a14" />
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { color: colors.primary }]} numberOfLines={1}>
                {isMerchant ? merchant!.store_name : (displayName || auth.user?.email?.split('@')[0] || 'Profil Pengguna')}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                {isMerchant
                  ? (merchant!.description ?? (merchant!.category && merchant!.category.length > 0 ? `Kategori: ${merchant!.category.join(', ')}` : ''))
                  : 'Pelanggan Darling'}
              </Text>

              {/* Badge UMKM */}
              {isUser && !isMerchant && (
                <Animated.View style={[styles.badgeWrap, { transform: [{ scale: badgePulse }] }]}>
                  <View style={[styles.badgePill, { backgroundColor: badge.color + '22', borderColor: badge.color + '55' }]}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  <Text style={[styles.badgeSub, { color: colors.onSurfaceMuted }]}>
                    {transactionCount} panggilan selesai
                  </Text>
                </Animated.View>
              )}

              {isMerchant && (
                <View style={styles.chips}>
                  <Chip icon="star" label="4.5" />
                  <Chip icon="shopping-bag" label={merchant!.category && merchant!.category.length > 0 ? merchant!.category.join(', ') : 'Makanan'} />
                </View>
              )}
            </View>
          </View>

            {isMerchant ? (
              <View style={styles.heroActions}>
                <GradientCtaButton 
                  label="Dasbor Pedagang" 
                  icon={<FontAwesome name="dashboard" size={16} color="#fff5ed" />} 
                  onPress={() => router.push('/merchant/dashboard')}
                />
                <View style={styles.actionRowSmall}>
                  <Pressable 
                    onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant' } })} 
                    style={({ pressed }) => [
                      styles.secondaryBtnSmall, 
                      { backgroundColor: colors.surfaceContainerLowest, flex: 1, overflow: 'hidden' }, 
                      pressed && styles.pressed
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.primary + '15', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <FontAwesome name="video-camera" size={14} color={colors.primary} style={{ marginRight: 8 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.secondaryBtnTextSmall, { color: colors.primary }]}>Cerita Dagang</Text>
                      {videoCount > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.countBadgeText}>{videoCount}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push('/(tabs)/studio')} style={({ pressed }) => [styles.secondaryBtnSmall, { backgroundColor: colors.surfaceContainerLowest, flex: 1 }, pressed && styles.pressed]}>
                    <FontAwesome name="magic" size={14} color={colors.secondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.secondaryBtnTextSmall, { color: colors.primary }]}>Studio AI</Text>
                  </Pressable>
                </View>
              </View>
            ) : isUser ? (
              <View style={styles.heroActions}>
                <GradientCtaButton 
                  label="Mulai Berjualan" 
                  icon={<FontAwesome name="shopping-bag" size={16} color="#fff5ed" />} 
                  onPress={() => router.push('/merchant/register')}
                />
                <View style={styles.actionRowSmall}>
                  <Pressable 
                    onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant' } })} 
                    style={({ pressed }) => [
                      styles.secondaryBtnSmall, 
                      { backgroundColor: colors.surfaceContainerLowest, flex: 1, overflow: 'hidden' }, 
                      pressed && styles.pressed
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.primary + '15', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <FontAwesome name="video-camera" size={14} color={colors.primary} style={{ marginRight: 8 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.secondaryBtnTextSmall, { color: colors.primary }]}>Cerita Dagang</Text>
                      {videoCount > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.countBadgeText}>{videoCount}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                  <Pressable 
                    onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant' } })} 
                    style={({ pressed }) => [
                      styles.secondaryBtnSmall, 
                      { backgroundColor: colors.surfaceContainerLowest, flex: 1 }, 
                      pressed && styles.pressed
                    ]}
                  >
                    <FontAwesome name="magic" size={14} color={colors.secondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.secondaryBtnTextSmall, { color: colors.primary }]}>Studio AI</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

          <LinearGradient
            colors={['rgba(253, 139, 0, 0.12)', 'rgba(0,0,0,0)']}
            start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.9 }}
            style={styles.heroGlow}
          />
        </SurfaceSection>

        {/* ── Merchant Stats (hanya jika merchant) ── */}
        {isMerchant && (
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
                <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>Sorotan dari daganganmu</Text>
              </View>
              <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
                <View style={styles.seeAllRow}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua</Text>
                  <FontAwesome name="arrow-right" size={12} color={colors.primary} />
                </View>
              </Pressable>
            </View>

            <View style={styles.storyGrid}>
              {myVideos.map(v => (
                <VideoGridItem 
                  key={v.id} 
                  video={v} 
                  onPress={(video) => router.push({ pathname: '/(tabs)', params: { initialVideoId: video.id } })}
                  size={(Dimensions.get('window').width - 44) / 3}
                />
              ))}
              <Pressable 
                onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant' } })}
                style={({ pressed }) => [
                  styles.newStory, 
                  { 
                    backgroundColor: colors.surfaceContainerLow, 
                    width: (Dimensions.get('window').width - 44) / 3,
                    aspectRatio: 2/3 // Match VideoGridItem aspect ratio roughly
                  }, 
                  pressed && styles.pressed
                ]}
              >
                <View style={styles.newStoryInner}>
                  <FontAwesome name="plus-circle" size={24} color={colors.primary} />
                  <Text style={[styles.newStoryText, { color: colors.primary }]}>Buat Cerita</Text>
                </View>
              </Pressable>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            FITUR KHUSUS USER BIASA (NON-MERCHANT)
            ══════════════════════════════════════════════════════════════ */}
        {isUser && !isMerchant && (
          <>
            {/* ── Radar Switch + Radius ── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📡 Radar Pedagang</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>
                  Aktifkan agar pedagang favoritmu tahu kamu ada
                </Text>
              </View>
            </View>

            <SurfaceCard style={styles.radarCard}>
              {/* Status Row */}
              <View style={styles.radarTopRow}>
                <View style={styles.radarStatusLeft}>
                  <Animated.View
                    style={[
                      styles.radarDot,
                      {
                        backgroundColor: radarActive ? '#4ade80' : colors.outlineVariant,
                        opacity: radarActive
                          ? radarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] })
                          : 1,
                        transform: [{ scale: radarActive ? radarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.2] }) : 1 }],
                      },
                    ]}
                  />
                  <View>
                    <Text style={[styles.radarStatusText, { color: colors.text }]}>
                      {radarActive ? 'Radar Aktif' : 'Radar Nonaktif'}
                    </Text>
                    <Text style={[styles.radarStatusSub, { color: colors.onSurfaceMuted }]}>
                      {radarActive ? `Jangkauan ${radarRadius}m dari lokasi kamu` : 'Pedagang tidak bisa menemukanmu'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={radarActive}
                  onValueChange={setRadarActive}
                  trackColor={{ false: colors.outlineVariant, true: colors.primary + 'aa' }}
                  thumbColor={radarActive ? colors.primary : colors.surfaceContainerLowest}
                />
              </View>

              {/* Radius Slider */}
              {radarActive && (
                <View style={styles.radiusSection}>
                  <View style={styles.radiusRow}>
                    <Text style={[styles.radiusLabel, { color: colors.onSurfaceMuted }]}>Radius Notifikasi</Text>
                    <Text style={[styles.radiusValue, { color: colors.primary }]}>{radarRadius}m</Text>
                  </View>
                  <View style={styles.radiusTrack}>
                    {[200, 300, 500, 750, 1000].map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => setRadarRadius(r)}
                        style={({ pressed }) => [
                          styles.radiusOption,
                          { backgroundColor: radarRadius === r ? colors.primary : colors.surfaceContainerLow },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.radiusOptionText, { color: radarRadius === r ? '#fff5ed' : colors.onSurfaceMuted }]}>
                          {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </SurfaceCard>

            {/* ── Titik Jemput Utama ── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Titik Jemput Utama</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>
                  Detail lokasi presisi agar pedagang mudah menemukanmu
                </Text>
              </View>
            </View>

            <SurfaceCard style={styles.locationCard}>
              <View style={styles.locationRow}>
                <View style={[styles.locationIconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <FontAwesome name="map-marker" size={20} color={colors.primary} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationName, { color: colors.text }]}>Rumah Utama</Text>
                  <Text style={[styles.locationAddr, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                    {pickupAddress}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setEditingPickup(!editingPickup)}
                  style={({ pressed }) => [styles.locationEditBtn, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}
                >
                  <FontAwesome name={editingPickup ? 'times' : 'pencil'} size={13} color={colors.primary} />
                </Pressable>
              </View>

              {editingPickup && (
                <View style={styles.locationEditSection}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceMuted }]}>Catatan Detail Lokasi</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                    <TextInput
                      value={pickupNote}
                      onChangeText={setPickupNote}
                      placeholder="Contoh: Pagar besi hitam, sebelah warung Bu Ika"
                      placeholderTextColor={colors.outlineVariant}
                      style={[styles.input, { color: colors.text }]}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                  <Pressable
                    onPress={handleSetPickupLocation}
                    style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}
                  >
                    <Text style={styles.saveBtnText}>Simpan Catatan</Text>
                  </Pressable>
                </View>
              )}

              {/* Address Shortcuts */}
              <View style={styles.addressShortcuts}>
                {['Rumah', 'Kantor', 'Kost'].map((place, i) => {
                  const isMatch = pickupAddress.startsWith(place);
                  return (
                    <Pressable
                      key={place}
                      onPress={() => {
                        setEditingPickup(true);
                        setPickupNote(place + ' - ');
                      }}
                      style={({ pressed }) => [
                        styles.addressChip,
                        { backgroundColor: isMatch ? colors.primary + '22' : colors.surfaceContainerLow, borderColor: isMatch ? colors.primary + '55' : 'transparent' },
                        pressed && styles.pressed,
                      ]}
                    >
                      <FontAwesome name={i === 0 ? 'home' : i === 1 ? 'briefcase' : 'building'} size={11} color={isMatch ? colors.primary : colors.onSurfaceMuted} />
                      <Text style={[styles.addressChipText, { color: isMatch ? colors.primary : colors.onSurfaceMuted }]}>{place}</Text>
                    </Pressable>
                  );
                })}
                <Pressable style={({ pressed }) => [styles.addressChip, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}>
                  <FontAwesome name="plus" size={11} color={colors.onSurfaceMuted} />
                  <Text style={[styles.addressChipText, { color: colors.onSurfaceMuted }]}>Tambah</Text>
                </Pressable>
              </View>
            </SurfaceCard>

            {/* ── Catatan Selera Tetap ── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🍽️ Catatan Selera Tetap</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>
                  Otomatis muncul saat pedagang menerima panggilanmu
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddTaste(!showAddTaste)}
                style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary + '20' }, pressed && styles.pressed]}
              >
                <FontAwesome name={showAddTaste ? 'times' : 'plus'} size={12} color={colors.primary} />
              </Pressable>
            </View>

            <SurfaceCard style={styles.tasteCard}>
              {tasteNotes.length === 0 && !showAddTaste && (
                <Text style={[styles.emptyHint, { color: colors.outlineVariant }]}>
                  Belum ada catatan selera. Tambahkan preferensi pesananmu!
                </Text>
              )}
              <View style={styles.tasteChips}>
                {tasteNotes.map((note) => (
                  <View key={note.id} style={[styles.tastePill, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Text style={[styles.tastePillText, { color: colors.text }]}>{note.label}</Text>
                    <Pressable onPress={() => handleRemoveTaste(note.id)} hitSlop={8}>
                      <FontAwesome name="times" size={10} color={colors.onSurfaceMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>

              {showAddTaste && (
                <View style={styles.addTasteRow}>
                  <View style={[styles.inputWrap, { flex: 1, backgroundColor: colors.surfaceContainerLow, marginTop: 0 }]}>
                    <TextInput
                      value={newTaste}
                      onChangeText={setNewTaste}
                      placeholder="Contoh: Tanpa MSG"
                      placeholderTextColor={colors.outlineVariant}
                      style={[styles.input, { color: colors.text }]}
                      onSubmitEditing={handleAddTaste}
                    />
                  </View>
                  <Pressable
                    onPress={handleAddTaste}
                    style={({ pressed }) => [styles.addTasteBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}
                  >
                    <FontAwesome name="check" size={14} color="#fff5ed" />
                  </Pressable>
                </View>
              )}

              <Text style={[styles.tasteTip, { color: colors.outlineVariant }]}>
                💡 Tip: Pedagang akan membaca catatan ini saat kamu memanggil mereka.
              </Text>
            </SurfaceCard>

            {/* ── Pedagang Favorit (Langganan) ── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>❤️ Pedagang Langganan</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>
                  Pantau posisi real-time pedagang favoritmu
                </Text>
              </View>
              <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
                <View style={styles.seeAllRow}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>Semua</Text>
                  <FontAwesome name="arrow-right" size={12} color={colors.primary} />
                </View>
              </Pressable>
            </View>

            <View style={styles.favoriteList}>
              {favLoading && favorites.length === 0 && (
                <Text style={[styles.emptyHint, { color: colors.outlineVariant }]}>Memuat daftar langganan...</Text>
              )}
              {!favLoading && favorites.length === 0 && (
                <SurfaceCard style={{ padding: 16 }}>
                  <Text style={[styles.emptyHint, { color: colors.outlineVariant }]}>
                    Belum ada pedagang langganan. Temukan pedagang di tab Jelajahi dan tambahkan ke favorit!
                  </Text>
                </SurfaceCard>
              )}
              {favorites.map((fav) => (
                <FavoriteCard 
                  key={fav.id} 
                  record={fav} 
                  colors={colors} 
                  onRemove={handleRemoveFavorite}
                  onCall={(mId, name) => {
                    Alert.alert('Panggil Pedagang', `Panggil ${name} ke lokasimu?`, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Panggil', onPress: () => Alert.alert('Berkeliling', `Memanggil ${name}...`) }
                    ]);
                  }}
                 />
              ))}
            </View>

            {/* ── Riwayat Panggilan ── */}
            <Pressable
              onPress={() => setShowHistory(!showHistory)}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 Riwayat Panggilan</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceMuted }]}>
                    Pedagang yang pernah kamu panggil
                  </Text>
                </View>
                <View style={styles.seeAllRow}>
                  <FontAwesome name={showHistory ? 'chevron-up' : 'chevron-down'} size={12} color={colors.primary} />
                </View>
              </View>
            </Pressable>

            {showHistory && (
              <SurfaceCard style={styles.historyCard}>
                {historyLoading && summonHistory.length === 0 && (
                  <Text style={[styles.emptyHint, { color: colors.outlineVariant }]}>Memuat riwayat...</Text>
                )}
                {!historyLoading && summonHistory.length === 0 && (
                  <Text style={[styles.emptyHint, { color: colors.outlineVariant }]}>
                    Belum ada riwayat panggilan.
                  </Text>
                )}
                {summonHistory.map((rec, idx) => (
                  <View key={rec.id}>
                    <HistoryRow record={rec} colors={colors} />
                    {idx < summonHistory.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
                    )}
                  </View>
                ))}
              </SurfaceCard>
            )}



            {/* ── Loyalty Points ── */}
            <SurfaceCard style={styles.loyaltyCard}>
              <View style={styles.loyaltyRow}>
                <View>
                  <Text style={[styles.loyaltyLabel, { color: colors.onSurfaceMuted }]}>Poin Darling</Text>
                  <Text style={[styles.loyaltyPoints, { color: colors.primary }]}>
                    {transactionCount * 100}
                    <Text style={[styles.loyaltyUnit, { color: colors.onSurfaceMuted }]}> poin</Text>
                  </Text>
                  <Text style={[styles.loyaltySub, { color: colors.outlineVariant }]}>
                    Tukar dengan promo UMKM favoritmu!
                  </Text>
                </View>
                <View style={styles.loyaltyBadgeWrap}>
                  <Text style={styles.loyaltyEmoji}>🎁</Text>
                </View>
              </View>
              <View style={styles.loyaltyProgressBg}>
                <View style={[styles.loyaltyProgressFill, { backgroundColor: colors.primary, width: `${Math.min((transactionCount / 25) * 100, 100)}%` }]} />
              </View>
              <Text style={[styles.loyaltyHint, { color: colors.outlineVariant }]}>
                {25 - transactionCount > 0 ? `${25 - transactionCount} panggilan lagi untuk jadi Pahlawan UMKM 🏆` : 'Kamu sudah jadi Pahlawan UMKM! 🏆'}
              </Text>
            </SurfaceCard>
          </>
        )}

        {/* ── Auth Card ── */}
        {auth.user ? (
          <SurfaceCard style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Akun Aktif</Text>
            <Text style={[styles.authSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
              {auth.user.email}
            </Text>
            <View style={styles.authRow}>
              <Pressable
                onPress={auth.signOut}
                style={({ pressed }) => [styles.authBtn, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}
              >
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
                <Pressable style={({ pressed }) => [styles.authBtn, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}>
                  <Text style={[styles.authBtnText, { color: colors.primary }]}>Daftar</Text>
                </Pressable>
              </Link>
            </View>
          </SurfaceCard>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FavoriteCard({ record, colors, onRemove, onCall }: { record: FavoriteMerchantRecord; colors: typeof Colors.light; onRemove: (id: string) => void; onCall: (id: string, name: string) => void }) {
  const m = record.merchants;
  if (!m) return null;
  const initColor = pickColor(m.store_name);
  const isOnRoute = m.is_active;
  return (
    <Pressable style={({ pressed }) => [favStyles.card, { backgroundColor: colors.surfaceContainerLowest }, pressed && styles.pressed]}>
      <View style={[favStyles.avatar, { backgroundColor: initColor + '22' }]}>
        {m.avatar_url ? (
          <Image source={{ uri: m.avatar_url }} style={{ width: 44, height: 44, borderRadius: 14 }} />
        ) : (
          <Text style={[favStyles.avatarInitial, { color: initColor }]}>{m.store_name.charAt(0)}</Text>
        )}
      </View>
      <View style={favStyles.info}>
        <Text style={[favStyles.name, { color: colors.text }]} numberOfLines={1}>{m.store_name}</Text>
        <Text style={[favStyles.cat, { color: colors.onSurfaceMuted }]}>{m.category ?? 'Pedagang Keliling'}</Text>
      </View>
      <View style={favStyles.statusWrap}>
        <Pressable hitSlop={10} onPress={() => onRemove(record.id)} style={{ marginBottom: 4 }}>
          <FontAwesome name="heart" size={14} color={colors.primary} />
        </Pressable>
        {isOnRoute ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[favStyles.onRouteDot, { backgroundColor: '#4ade80' }]} />
            <Text style={[favStyles.statusLabel, { color: '#4ade80' }]}>Keliling</Text>
          </View>
        ) : (
          <Text style={[favStyles.statusLabel, { color: colors.outlineVariant }]}>Belum keliling</Text>
        )}
        {isOnRoute && (
          <Pressable style={[favStyles.callBtn, { backgroundColor: colors.primary }]} onPress={() => onCall(m.id, m.store_name)}>
            <FontAwesome name="bell" size={11} color="#fff5ed" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function HistoryRow({ record, colors }: { record: SummonHistoryRecord; colors: typeof Colors.light }) {
  const statusColor = record.status === 'arrived' ? '#4ade80' : record.status === 'cancelled' ? '#f95630' : colors.outlineVariant;
  const statusLabel = record.status === 'arrived' ? 'Selesai' : record.status === 'cancelled' ? 'Dibatalkan' : 'Menunggu';
  const durationStr = record.duration_seconds != null
    ? record.duration_seconds < 60
      ? `${record.duration_seconds} detik`
      : `${Math.round(record.duration_seconds / 60)} menit`
    : null;
  return (
    <View style={histStyles.row}>
      <View style={[histStyles.iconWrap, { backgroundColor: statusColor + '22' }]}>
        <FontAwesome
          name={record.status === 'arrived' ? 'check-circle' : record.status === 'cancelled' ? 'times-circle' : 'clock-o'}
          size={16}
          color={statusColor}
        />
      </View>
      <View style={histStyles.info}>
        <Text style={[histStyles.name, { color: colors.text }]}>{record.merchants?.store_name ?? 'Pedagang'}</Text>
        <Text style={[histStyles.meta, { color: colors.onSurfaceMuted }]}>
          {formatSummonDate(record.summoned_at)} · {record.merchants?.category ?? '-'}
          {durationStr ? ` · Tiba dalam ${durationStr}` : ''}
        </Text>
      </View>
      <View style={[histStyles.statusBadge, { backgroundColor: statusColor + '22' }]}>
        <Text style={[histStyles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

function Chip({ icon, label }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string }) {
  return (
    <View style={chipStyles.wrap}>
      <FontAwesome name={icon} size={12} color="#8c4a00" />
      <Text style={chipStyles.text}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ComponentProps<typeof FontAwesome>['name']; value: string; label: string; color: string }) {
  return (
    <SurfaceCard style={statStyles.card}>
      <FontAwesome name={icon} size={22} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </SurfaceCard>
  );
}

function StoryCard({ uri, views }: { uri: string; views: string }) {
  return (
    <Pressable style={({ pressed }) => [storyStyles.card, pressed && storyStyles.pressed]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={storyStyles.meta}>
        <FontAwesome name="play" size={12} color="#fff" />
        <Text style={storyStyles.views}>{views}</Text>
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  hero: { overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: -90, right: -90 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { width: 92, height: 92 },
  avatar: { width: 92, height: 92, borderRadius: 46, borderCurve: 'circular', borderWidth: 4 },
  verified: { position: 'absolute', width: 28, height: 28, borderRadius: 14, right: 6, bottom: 6, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  heroTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, letterSpacing: -0.44 },
  heroSubtitle: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, marginTop: 2, lineHeight: 18 },
  badgeWrap: { marginTop: 8, gap: 3 },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeIcon: { fontSize: 14 },
  badgeLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  badgeSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11 },
  chips: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroActions: { marginTop: 14, gap: 10 },
  actionRowSmall: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { borderRadius: 999, borderCurve: 'continuous', paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)' },
  secondaryBtnSmall: { flexDirection: 'row', borderRadius: 999, borderCurve: 'continuous', paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
  secondaryBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, letterSpacing: -0.14 },
  secondaryBtnTextSmall: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, letterSpacing: -0.12 },
  countBadge: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: '#fff5ed', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, letterSpacing: -0.18 },
  sectionSubtitle: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 2 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeAll: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 12 },
  storyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  newStory: { width: '48%', aspectRatio: 9 / 16, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderCurve: 'continuous' },
  newStoryInner: { alignItems: 'center', gap: 8 },
  newStoryText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },

  // Radar
  radarCard: { gap: 14 },
  radarTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radarStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  radarDot: { width: 12, height: 12, borderRadius: 6 },
  radarStatusText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  radarStatusSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 2 },
  radiusSection: { gap: 10 },
  radiusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radiusLabel: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12 },
  radiusValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  radiusTrack: { flexDirection: 'row', gap: 8 },
  radiusOption: { flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  radiusOptionText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 11 },

  // Location
  locationCard: { gap: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  locationInfo: { flex: 1 },
  locationName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  locationAddr: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 2, lineHeight: 16 },
  locationEditBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locationEditSection: { gap: 8 },
  addressShortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addressChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  addressChipText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 11 },

  // Taste notes
  tasteCard: { gap: 12 },
  tasteChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tastePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tastePillText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 12 },
  addBtn: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  addTasteRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addTasteBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyHint: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, fontStyle: 'italic' },
  tasteTip: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, lineHeight: 16 },

  // Favorites
  favoriteList: { gap: 10 },

  // History
  historyCard: { gap: 4 },
  divider: { height: 1, marginVertical: 10, opacity: 0.3 },

  // Upgrade banner
  upgradeCard: { overflow: 'hidden', gap: 14 },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(253,139,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  upgradeEmoji: { fontSize: 26 },
  upgradeText: { flex: 1 },
  upgradeTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, letterSpacing: -0.16 },
  upgradeSubtitle: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 3, lineHeight: 16 },
  upgradeCta: { borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(253, 139, 0, 0.3)' },
  upgradeCtaText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff5ed', letterSpacing: -0.14 },

  // Loyalty
  loyaltyCard: { gap: 10 },
  loyaltyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loyaltyLabel: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12 },
  loyaltyPoints: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, letterSpacing: -0.5 },
  loyaltyUnit: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14 },
  loyaltySub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, marginTop: 2 },
  loyaltyBadgeWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,214,171,0.4)', alignItems: 'center', justifyContent: 'center' },
  loyaltyEmoji: { fontSize: 28 },
  loyaltyProgressBg: { height: 8, backgroundColor: 'rgba(185,169,160,0.25)', borderRadius: 999, overflow: 'hidden' },
  loyaltyProgressFill: { height: 8, borderRadius: 999 },
  loyaltyHint: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11 },

  // Auth
  authCard: { gap: 10 },
  authTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, letterSpacing: -0.16 },
  authSubtitle: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, lineHeight: 16 },
  authRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  authBtn: { flex: 1, borderRadius: 999, borderCurve: 'continuous', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 214, 171, 0.5)' },
  authBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, letterSpacing: -0.13 },

  // Merchant
  merchantCard: { gap: 10 },
  merchantHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  merchantTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, letterSpacing: -0.16 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 11 },
  merchantError: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, lineHeight: 16 },
  merchantName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, letterSpacing: -0.18 },
  merchantDesc: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, lineHeight: 16 },
  merchantActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  merchantBtn: { flex: 1, borderRadius: 999, borderCurve: 'continuous', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  merchantBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, letterSpacing: -0.13 },

  // Inputs
  inputLabel: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 12, marginTop: 8 },
  inputWrap: { borderRadius: 16, borderCurve: 'continuous', paddingHorizontal: 14, paddingVertical: 10 },
  input: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, paddingVertical: 0 },
  saveBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#fff5ed' },
  createMerchantBtn: { borderRadius: 16, borderCurve: 'continuous', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, boxShadow: '0 4px 12px rgba(253, 139, 0, 0.25)' },
  createMerchantText: { color: '#fff5ed', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, letterSpacing: -0.14 },

  disabled: { opacity: 0.7 },
  pressed: { transform: [{ scale: 0.98 }] },
  smallAvatar: { width: 32, height: 32, borderRadius: 16 },
});

const chipStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,214,171,0.75)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderCurve: 'continuous' },
  text: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 12, color: '#231a14' },
});

const statStyles = StyleSheet.create({
  card: { width: '48%', gap: 10 },
  value: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: '#231a14', letterSpacing: -0.22 },
  label: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: 'rgba(35,26,20,0.68)' },
});

const storyStyles = StyleSheet.create({
  card: { width: '48%', aspectRatio: 9 / 16, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden' },
  pressed: { transform: [{ scale: 0.98 }] },
  meta: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  views: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 12, color: '#fff' },
});

const favStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderCurve: 'continuous' },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  info: { flex: 1 },
  name: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  cat: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 2 },
  statusWrap: { alignItems: 'flex-end', gap: 6 },
  onRouteDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 11 },
  callBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

const histStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
  meta: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 10 },
});
