import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { SurfaceCard, SurfaceSection } from '@/components/ui/Kinetic';
import { TopAppBar, TopAppBarIconButton } from '@/components/ui/TopAppBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
    getMyMerchant,
    updateMerchant,
    listSummonHistory,
    listMyVideos,
    updateSummonStatus,
    type Merchant,
    type SummonHistoryRecord,
    type FeedVideo,
} from '@/lib/dataApi';

export default function MerchantDashboardScreen() {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const auth = useAuthContext();
    const router = useRouter();

    const [merchant, setMerchant] = React.useState<Merchant | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [summons, setSummons] = React.useState<SummonHistoryRecord[]>([]);
    const [myVideos, setMyVideos] = React.useState<FeedVideo[]>([]);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = async () => {
        if (!auth.user) return;
        try {
            const [m, history] = await Promise.all([
                getMyMerchant(auth.user.id, auth.jwt),
                listSummonHistory(auth.user.id, 5, auth.jwt)
            ]);
            setMerchant(m);
            if (m) {
                const videos = await listMyVideos(m.id, 6, auth.jwt);
                setMyVideos(videos);
            }
            setSummons(history);
        } catch (e) {
            console.warn('Failed to load dashboard data', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, [auth.user]);

    const handleToggleActive = async () => {
        if (!merchant) return;
        try {
            const nextStatus = !merchant.is_active;
            const updated = await updateMerchant(auth.jwt, merchant.id, { is_active: nextStatus });
            if (updated) setMerchant(updated);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateSummonStatus = async (summonId: string, status: 'arrived' | 'cancelled') => {
        try {
            const updated = await updateSummonStatus(auth.jwt, summonId, status);
            if (updated) {
                setSummons(prev => prev.filter(s => s.id !== summonId));
            }
        } catch (e) {
            console.error('Failed to update summon status', e);
        }
    };

    if (loading) {
        return (
            <View style={[styles.screen, { backgroundColor: colors.surface, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <StatusBar style="auto" />
            <TopAppBar
                title="Dasbor Pedagang"
                left={<TopAppBarIconButton icon="arrow-left" onPress={() => router.back()} />}
            />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[colors.primary]} />
                }
            >
                {/* ── Status Banner ── */}
                <SurfaceSection style={styles.statusBanner}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusIndicator, { backgroundColor: merchant?.is_active ? '#4ade80' : colors.outlineVariant }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusTitle, { color: colors.text }]}>
                                {merchant?.is_active ? 'Sedang Keliling' : 'Istirahat'}
                            </Text>
                            <Text style={[styles.statusSub, { color: colors.onSurfaceMuted }]}>
                                {merchant?.is_active ? 'Pelanggan bisa memanggilmu' : 'Aktifkan status untuk jualan'}
                            </Text>
                        </View>
                        <Pressable 
                            onPress={handleToggleActive}
                            style={({ pressed }) => [
                                styles.toggleBtn, 
                                { backgroundColor: merchant?.is_active ? colors.outlineVariant : colors.primary },
                                pressed && styles.pressed
                            ]}
                        >
                            <Text style={[styles.toggleBtnText, { color: merchant?.is_active ? colors.text : '#fff5ed' }]}>
                                {merchant?.is_active ? 'Matikan' : 'Aktifkan'}
                            </Text>
                        </Pressable>
                    </View>
                </SurfaceSection>

                {/* ── Business Stats ── */}
                <View style={styles.statsGrid}>
                    <StatBox label="Poin Ludes" value="420k" icon="money" color={colors.secondary} />
                    <StatBox label="Pengunjung" value="1.2k" icon="eye" color={colors.primary} />
                    <StatBox label="Rating" value="4.8" icon="star" color="#efc52b" />
                    <StatBox label="Calls" value="28" icon="bell" color="#f95630" />
                </View>

                {/* ── Quick Actions ── */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Manajemen Warung</Text>
                <View style={styles.actionGrid}>
                    <ActionCard 
                        title="Edit Menu" 
                        icon="book" 
                        onPress={() => router.push('/edit-menu')} 
                        colors={colors} 
                    />
                    <ActionCard 
                        title="Profile Warung" 
                        icon="shopping-basket" 
                        onPress={() => {}} 
                        colors={colors} 
                    />
                </View>

                {/* ── Merchant Studio ── */}
                <View style={styles.studioHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Studio Kreatif</Text>
                    <Pressable onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant' } })}>
                        <Text style={[styles.seeMore, { color: colors.primary }]}>Buka Studio AI</Text>
                    </Pressable>
                </View>

                {/* Smart Prompt Cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptScroll}>
                    <Pressable 
                        onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant', initialCaption: 'Beli 2 Gratis 1 untuk semua menu hari ini! 🍜' } })}
                        style={({ pressed }) => [styles.promptCard, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}
                    >
                        <FontAwesome name="gift" size={16} color={colors.primary} />
                        <Text style={[styles.promptText, { color: colors.text }]}>Promo Beli 2 Gratis 1</Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant', initialCaption: 'Menu baru sudah tersedia! Yuk mampir sekarang ke lokasi saya. 📍' } })}
                        style={({ pressed }) => [styles.promptCard, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}
                    >
                        <FontAwesome name="map-marker" size={16} color={colors.secondary} />
                        <Text style={[styles.promptText, { color: colors.text }]}>Update Lokasi Baru</Text>
                    </Pressable>
                </ScrollView>

                {/* My Stories Feed */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>Cerita Anda</Text>
                {myVideos.length === 0 ? (
                    <SurfaceCard style={styles.emptyStudioCard}>
                        <FontAwesome name="image" size={32} color={colors.outlineVariant} />
                        <Text style={[styles.emptyStudioText, { color: colors.onSurfaceMuted }]}>
                            Belum ada cerita. Mulai promosikan warungmu!
                        </Text>
                        <Pressable 
                            style={[styles.createStoryBtn, { backgroundColor: colors.primary }]}
                            onPress={() => router.push({ pathname: '/(tabs)/studio', params: { mode: 'merchant' } })}
                        >
                            <Text style={styles.createStoryText}>Mulai Buat</Text>
                        </Pressable>
                    </SurfaceCard>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoScroll}>
                        {myVideos.map(v => (
                            <View key={v.id} style={styles.videoItem}>
                                <View style={[styles.videoThumb, { backgroundColor: colors.surfaceContainerHigh }]}>
                                    {v.thumbnail_url ? (
                                        <Text style={{ fontSize: 10 }}>[Thumbnail]</Text>
                                    ) : (
                                        <FontAwesome name="play-circle" size={24} color={colors.outlineVariant} />
                                    )}
                                </View>
                                <Text style={[styles.videoCaption, { color: colors.text }]} numberOfLines={1}>
                                    {v.caption || 'Tanpa caption'}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* ── Live Calls ── */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Panggilan Aktif</Text>
                {summons.length === 0 ? (
                    <SurfaceCard style={styles.emptyCard}>
                        <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
                            Belum ada panggilan masuk hari ini.
                        </Text>
                    </SurfaceCard>
                ) : (
                    summons.map((s) => (
                        <SurfaceCard key={s.id} style={styles.summonCard}>
                            <FontAwesome name="map-marker" size={24} color={colors.primary} />
                            <View style={{ flex: 1, paddingLeft: 16 }}>
                                <Text style={[styles.summonName, { color: colors.text }]}>Pelanggan #{s.id.slice(0, 4)}</Text>
                                <Text style={[styles.summonMeta, { color: colors.onSurfaceMuted }]}>Berjarak ~300m dari lokasimu</Text>
                            </View>
                            <Pressable 
                                style={({ pressed }) => [styles.acceptBtn, { backgroundColor: colors.secondary }, pressed && styles.pressed]}
                                onPress={() => handleUpdateSummonStatus(s.id, 'arrived')}
                            >
                                <Text style={styles.acceptText}>Tiba</Text>
                            </Pressable>
                        </SurfaceCard>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

function StatBox({ label, value, icon, color }: any) {
    return (
        <SurfaceCard style={styles.statBox}>
            <FontAwesome name={icon} size={20} color={color} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </SurfaceCard>
    );
}

function ActionCard({ title, icon, onPress, colors }: any) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.surfaceContainerLow }, pressed && styles.pressed]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <FontAwesome name={icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    content: { padding: 16, gap: 16 },
    statusBanner: { paddingVertical: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    statusIndicator: { width: 12, height: 12, borderRadius: 6 },
    statusTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 },
    statusSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 2 },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    toggleBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statBox: { width: '48%', gap: 6, padding: 16 },
    statValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, letterSpacing: -0.2 },
    statLabel: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, opacity: 0.7 },
    sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginTop: 8 },
    actionGrid: { flexDirection: 'row', gap: 12 },
    actionCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', gap: 10 },
    actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
    studioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    seeMore: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 13 },
    studioCard: { overflow: 'hidden' },
    studioGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
    studioContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    studioTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 },
    studioSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 4, lineHeight: 18 },
    summonCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    summonName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
    summonMeta: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, marginTop: 2 },
    acceptBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    acceptText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#231a14' },
    emptyCard: { padding: 24, alignItems: 'center' },
    emptyText: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, fontStyle: 'italic' },
    pressed: { transform: [{ scale: 0.98 }] },
    promptScroll: { gap: 10, paddingVertical: 8 },
    promptCard: { 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderRadius: 14, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    promptText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 13 },
    videoScroll: { gap: 12, paddingVertical: 10 },
    videoItem: { width: 120, gap: 6 },
    videoThumb: { 
        width: 120, 
        height: 160, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden'
    },
    videoCaption: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, paddingHorizontal: 4 },
    emptyStudioCard: { padding: 32, alignItems: 'center', gap: 12 },
    emptyStudioText: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, textAlign: 'center', opacity: 0.7 },
    createStoryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
    createStoryText: { color: '#fff5ed', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
});
