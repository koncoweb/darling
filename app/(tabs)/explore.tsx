import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientCtaButton, SurfaceCard } from '@/components/ui/Kinetic';
import { TopAppBar, TopAppBarIconButton } from '@/components/ui/TopAppBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function JelajahScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopAppBar
        title="Darling"
        left={
          <TopAppBarIconButton>
            <FontAwesome name="bars" size={20} color={colors.primary} />
          </TopAppBarIconButton>
        }
        right={
          <TopAppBarIconButton>
            <View style={[styles.smallAvatar, { backgroundColor: colors.surfaceContainerLow }]} />
          </TopAppBarIconButton>
        }
      />

      <View style={styles.mapArea}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8JnpXHjhyxIvyJBPEFsaU3vuBtMXxNK2QoXFgpvLmcuFSMHHQ4ydtBfl1faps__0OeBk6XqYLDisc-7V60bRnulz5Ie8B_6oEDXTfOwjwsr4G-itGSLrUvT0B6teVNoiWt2K4pSK12kyPrEjFTB3wB1HJ2Lry5wqH8qwwkepaz8M68VD6CS3K2qOiwNJOlQAG2nOZ0FMy3UGNlNNU4fcsiGUdRyfNaSjSzm8jOL4vIzdeQto9vSu5DDvwQzywCD0cERKs24j9pDht',
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(255,245,237,0.6)', 'rgba(0,0,0,0)', 'rgba(255,245,237,0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <Pin
          label="Sate Ayam Madura"
          style={{ top: Math.round(height * 0.32), left: Math.round(width * 0.25) }}
          color={colors.secondary}
        />
        <Pin
          label="Kopi Keliling"
          style={{ top: Math.round(height * 0.46), left: Math.round(width * 0.64) }}
          color={colors.primary}
          active
        />
        <Pin
          label="Martabak Manis"
          style={{ top: Math.round(height * 0.62), left: Math.round(width * 0.72) }}
          color={colors.secondary}
        />

        <View style={[styles.searchWrap, { paddingTop: insets.top + 12 }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow }]}>
            <FontAwesome name="search" size={16} color={colors.onSurfaceMuted} />
            <TextInput
              placeholder="Find nearby vendors, food types..."
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <Pressable style={[styles.filterBtn, { backgroundColor: colors.surface }]}>
              <FontAwesome name="sliders" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.bottomSheetWrap, { paddingBottom: 96 + insets.bottom }]}>
          <SurfaceCard style={styles.bottomSheetCard}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5SxmlkWAB92gMCjKca3s_HMV6azj53uYOsaNDDUC7XgUkfZ2tovhLYl5e5rEw3TmWdfcLbfcggZRt-23pTZjCz0pUvXdkl4R365o0sGnViypRZWdLvflkxljB7YnSR2wG1j1kEHi6G_zcJ7lkhL5J9kFuE4J22ecgP1zvN8E-1KOKtTRx54kfLeVi4h9eu_EmhHIw1jtTCq3G_8Wvp3IOLzj5Vez0gX0KqIPJp9rIMoMzUDoRJzb4TtP1phr4qKzXWVINit5E6sD9',
              }}
              style={[styles.floatingImage, { borderColor: colors.surfaceContainerLowest }]}
              resizeMode="cover"
            />

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  Kopi Keliling Pak Kumis
                </Text>
                <View style={[styles.ratingChip, { backgroundColor: colors.surfaceContainerLow }]}>
                  <FontAwesome name="star" size={12} color={colors.primary} />
                  <Text style={[styles.ratingText, { color: colors.text }]}>4.8</Text>
                </View>
              </View>

              <Text style={[styles.cardSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                Traditional Iced Coffee & Snacks
              </Text>

              <View style={styles.metaRow}>
                <Meta icon="male" label="3 mins (200m)" color={colors.secondary} textColor={colors.text} />
                <Meta
                  icon="fire"
                  label="Hot Now"
                  color={colors.secondary}
                  textColor={colors.text}
                />
              </View>

              <View style={styles.ctaRow}>
                <View style={styles.ctaFlex}>
                  <GradientCtaButton label="View Menu" />
                </View>
                <Pressable
                  style={[
                    styles.circleBtn,
                    { backgroundColor: colors.secondary, shadowColor: colors.secondary },
                  ]}>
                  <FontAwesome name="location-arrow" size={18} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>
            </View>
          </SurfaceCard>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
  },
  searchWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 15,
    alignItems: 'center',
  },
  searchBar: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 18,
  },
  bottomSheetCard: {
    paddingTop: 18,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 176,
    overflow: 'visible',
  },
  floatingImage: {
    position: 'absolute',
    left: -10,
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 18,
    borderWidth: 4,
  },
  cardContent: {
    marginLeft: 110,
    paddingLeft: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    letterSpacing: -0.16,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratingText: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
  },
  cardSubtitle: {
    marginTop: 6,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 12,
  },
  ctaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaFlex: {
    flex: 1,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

function Meta({
  icon,
  label,
  color,
  textColor,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={metaStyles.row}>
      <FontAwesome name={icon} size={14} color={color} />
      <Text style={[metaStyles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
  },
});

function Pin({
  label,
  color,
  active = false,
  style,
}: {
  label: string;
  color: string;
  active?: boolean;
  style: { top: number; left: number };
}) {
  return (
    <View style={[pinStyles.wrap, style]}>
      <View style={[pinStyles.dot, { backgroundColor: color }, active && pinStyles.dotActive]}>
        {active ? <View style={[pinStyles.ping, { borderColor: color }]} /> : null}
      </View>
      <View style={pinStyles.labelWrap}>
        <Text style={pinStyles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,1)',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  dotActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  ping: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    opacity: 0.35,
  },
  labelWrap: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 160,
  },
  label: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 11,
    color: '#231a14',
  },
});
