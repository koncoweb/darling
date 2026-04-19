import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { GradientCtaButton, RingAvatar } from '@/components/ui/Kinetic';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { listActiveMerchants, type Merchant } from '@/lib/dataApi';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#263c3f" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  }
];

const INITIAL_REGION: Region = {
  latitude: -6.2232, // Jakarta Selatan area
  longitude: 106.8123,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

// Fixed TypeScript type for mock data
type MerchantPin = Partial<Merchant> & { latitude: number; longitude: number; id: string; store_name: string };

const MOCK_MAP_MERCHANTS: MerchantPin[] = [
  {
    id: 'demo-1',
    store_name: 'Sate Ayam Madura',
    is_active: true,
    avatar_url: null,
    description: 'Sate ayam bumbu kacang spesial khas Madura',
    latitude: -6.2252,
    longitude: 106.8103,
  },
  {
    id: 'demo-2',
    store_name: 'Kopi Keliling',
    is_active: true,
    avatar_url: null,
    description: 'Kopi susu gula aren & robusta murni',
    latitude: -6.2192,
    longitude: 106.8203,
  },
  {
    id: 'demo-3',
    store_name: 'Martabak Manis',
    is_active: true,
    avatar_url: null,
    description: 'Martabak telor & manis dengan berbagai topping',
    latitude: -6.2302,
    longitude: 106.8153,
  },
];

export default function JelajahScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const auth = useAuthContext();
  const mapRef = React.useRef<MapView>(null);
  
  const [merchants, setMerchants] = React.useState<MerchantPin[]>([]);
  const [selected, setSelected] = React.useState<MerchantPin | null>(null);
  const [userLocation, setUserLocation] = React.useState<Location.LocationObject | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  // Precision Location Tracking
  const requestLocation = async (isInitial = false) => {
    try {
      if (isInitial) setIsLocating(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      
      setUserLocation(location);
      
      if (isInitial || !isInitial) {
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    } catch (err) {
      console.error('Location error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  React.useEffect(() => {
    setMerchants(MOCK_MAP_MERCHANTS);
    setSelected(MOCK_MAP_MERCHANTS[0]);
    requestLocation(true);
  }, []);

  const onMarkerPress = (m: MerchantPin) => {
    setSelected(m);
    mapRef.current?.animateToRegion({
      latitude: m.latitude - 0.0015, // Adjusted offset for high zoom
      longitude: m.longitude,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    }, 500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <StatusBar style="dark" />

      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          customMapStyle={theme === 'dark' ? darkMapStyle : []}
          onPress={() => setSelected(null)}
          showsUserLocation={true}
          showsMyLocationButton={false} // We implement custom native-ui button
        >
          {MOCK_MAP_MERCHANTS.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              onPress={() => onMarkerPress(m)}
              tracksViewChanges={false}
            >
              <Pin 
                label={m.store_name} 
                color={selected?.id === m.id ? colors.primary : colors.secondary} 
                active={selected?.id === m.id}
                style={{ top: 0, left: 0 }}
              />
            </Marker>
          ))}
        </MapView>

        <LinearGradient
          colors={[colors.surface + 'B0', 'transparent', colors.surface + 'A0']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.sideControls}>
          <Pressable 
            onPress={() => requestLocation(false)} 
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: pressed ? colors.surfaceVariant : colors.surface },
              { borderColor: colors.outlineVariant + '40' }
            ]}
          >
            <BlurView intensity={60} tint={theme} style={StyleSheet.absoluteFill} />
            <FontAwesome 
              name={isLocating ? "spinner" : "location-arrow"} 
              size={20} 
              color={colors.primary} 
            />
          </Pressable>
        </View>

        <View style={[styles.searchWrap, { paddingTop: insets.top + 12 }]}>
          <BlurView
            intensity={100} // Increased for less transparency
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={[
              styles.searchBar, 
              { borderColor: colors.outlineVariant + '40', backgroundColor: colors.surface + 'E6' } // Added solid alpha
            ]}>
            <FontAwesome name="search" size={16} color={colors.primary} />
            <TextInput
              placeholder="Find nearby vendors, food types..."
              placeholderTextColor={colors.onSurfaceMuted + '80'}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <Pressable style={[styles.filterBtn, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="sliders" size={16} color={colors.primary} />
            </Pressable>
          </BlurView>
        </View>

        <View style={[styles.bottomSheetWrap, { paddingBottom: 10 + Math.max(insets.bottom, 20) }]}>
          <BlurView 
            intensity={100} // Solid-like feel
            tint={theme === 'dark' ? 'dark' : 'light'} 
            style={[styles.bottomSheetCard, { backgroundColor: colors.surface + 'F0' }]}
          >
            <View style={styles.bottomSheetHandle} />
            <View style={styles.cardMainContent}>
              <RingAvatar
                uri={
                  selected?.avatar_url ??
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuC5SxmlkWAB92gMCjKca3s_HMV6azj53uYOsaNDDUC7XgUkfZ2tovhLYl5e5rEw3TmWdfcLbfcggZRt-23pTZjCz0pUvXdkl4R365o0sGnViypRZWdLvflkxljB7YnSR2wG1j1kEHi6G_zcJ7lkhL5J9kFuE4J22ecgP1zvN8E-1KOKtTRx54kfLeVi4h9eu_EmhHIw1jtTCq3G_8Wvp3IOLzj5Vez0gX0KqIPJp9rIMoMzUDoRJzb4TtP1phr4qKzXWVINit5E6sD9'
                }
                size={72}
                active={selected?.is_active}
              />

              <View style={styles.cardDetails}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {selected?.store_name ?? 'Pedagang Terdekat'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.secondary + '20' }]}>
                    <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
                      {selected?.is_active ? 'Buka' : 'Tutup'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.cardSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                  {selected?.description ?? 'Lihat detail pedagang & menu unggulan'}
                </Text>

                <View style={styles.metaRow}>
                  <Meta icon="clock-o" label="~5 mins" color={colors.primary} textColor={colors.text} />
                  <Meta icon="map-marker" label="200m" color={colors.primary} textColor={colors.text} />
                </View>
              </View>
            </View>

            <View style={styles.ctaRow}>
              <View style={styles.ctaFlex}>
                <GradientCtaButton
                  label="Panggil Pedagang"
                  onPress={() => {}}
                  icon={<FontAwesome name="bell" size={16} color="#fff" />}
                />
              </View>
              <Pressable
                style={[
                  styles.menuBtn,
                  { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant + '20' },
                ]}>
                <Text style={[styles.menuBtnText, { color: colors.primary }]}>Menu</Text>
              </Pressable>
            </View>
          </BlurView>
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
    paddingHorizontal: 20,
    zIndex: 15,
  },
  searchBar: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    paddingVertical: 8,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 92 + 16, // Height of bottom tab bar + margin
    zIndex: 18,
  },
  bottomSheetCard: {
    borderRadius: 32,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    marginTop: 2,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  ctaRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaFlex: {
    flex: 1,
  },
  menuBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    bottom: 240, // Positioned above the merchant card
    zIndex: 20,
    gap: 12,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
  onPress,
}: {
  label: string;
  color: string;
  active?: boolean;
  style: any;
  onPress?: () => void;
}) {
  return (
    <View style={[pinStyles.wrap, style]}>
      <View 
        style={[
          pinStyles.dot, 
          { backgroundColor: '#fff', borderColor: color }, 
          active && pinStyles.dotActive
        ]}
      >
        <FontAwesome 
          name={active ? "cutlery" : "shopping-basket"} 
          size={active ? 14 : 12} 
          color={color} 
        />
        {active ? <View style={[pinStyles.ping, { borderColor: color }]} /> : null}
      </View>
      <View style={[pinStyles.labelWrap, active && pinStyles.labelWrapActive]}>
        <Text style={pinStyles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 4,
  },
  ping: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    opacity: 0.4,
  },
  labelWrap: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  labelWrapActive: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.1)',
    elevation: 2,
  },
  label: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 10,
    color: '#1a1a1a',
  },
});
