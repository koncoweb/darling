import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createMerchant } from '@/lib/dataApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { uploadToCloudinary } from '@/lib/cloudinary';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer Bank', 'e-Wallet'];
const MERCHANT_CATEGORIES = [
  'Bakso & Mie Ayam', 'Nasi Goreng & Mie Balap', 'Sate & Gule', 'Gorengan & Jajanan', 
  'Martabak Manis & Telur', 'Minuman Dingin & Es', 'Kopi & Wedang', 
  'Sembako & Sayur', 'Buah Segar', 'Jasa Keliling', 'Lainnya'
];

const RADIUS_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
  { label: '5km', value: 5000 },
];

export default function RegisterMerchantScreen() {
  const router = useRouter();
  const auth = useAuthContext();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [storeName, setStoreName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null); // Local URI
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [operationArea, setOperationArea] = useState('');
  
  // Location States
  const [baseCoords, setBaseCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [radius, setRadius] = useState(1000); // meters
  const [isLocating, setIsLocating] = useState(false);
  
  const handleImageState = (uri: string, base64: string | null) => {
    setCoverImage(uri);
    setCoverImageBase64(base64 || null);
  };
  
  const [payments, setPayments] = useState<string[]>(['Tunai']); // default

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePayment = (method: string) => {
    setPayments((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const currentProgress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step === 1 && storeName.trim().length < 3) {
      setError('Nama usaha minimal 3 karakter.');
      return;
    }
    setError(null);
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const requestCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Izin lokasi diperlukan untuk menentukan titik mangkal.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setBaseCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (e) {
      setError('Gagal mendapatkan lokasi saat ini.');
    } finally {
      setIsLocating(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Gagal memproses gambar dari galeri.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Izin kamera diperlukan untuk mengambil foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (err) {
      setError('Gagal mengakses kamera: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    }
  };

  const handleSubmit = async () => {
    if (!auth.user) return;
    setLoading(true);
    setError(null);

    try {
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) throw new Error('JWT tidak ditemukan. Silakan login kembali.');

      let finalCoverUrl = coverUrl.trim() || null;

      // 1. If we have a local image, upload to Cloudinary
      if (coverImage) {
        try {
          const cloudinaryRes = await uploadToCloudinary(coverImage, 'image');
          finalCoverUrl = cloudinaryRes.secure_url;
        } catch (uploadErr) {
          console.error('Cloudinary upload err:', uploadErr);
          throw new Error('Gagal mengunggah foto cover ke server media.');
        }
      }

      // 2. Create merchant record in Neon DB
      const created = await createMerchant(jwt, {
        owner_user_id: auth.user.id,
        store_name: storeName.trim(),
        category: categories.length > 0 ? categories : null,
        description: description.trim() || null,
        cover_image: null, // We use cover_url now
        cover_url: finalCoverUrl,
        whatsapp_number: whatsapp.trim() || null,
        accepted_payments: payments.length > 0 ? payments : null,
        base_location: baseLocation.trim() || null,
        operation_area: operationArea.trim() || null,
        // @ts-ignore - added via DDL
        base_lat: baseCoords?.latitude ?? null,
        base_lng: baseCoords?.longitude ?? null,
        operation_radius_meters: radius,
      });

      if (!created) throw new Error('Gagal menyimpan profil pedagang.');
      
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({pressed}) => [styles.backBtn, pressed && styles.pressed]}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Daftar Pedagang</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.progressBg, { backgroundColor: colors.surfaceContainerLow }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${currentProgress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error && (
          <View style={[styles.errorBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>1. Identitas Usaha</Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceMuted }]}>
              Beri nama yang mudah diingat pelanggan.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Nama Usaha/Gerobak *</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <TextInput
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Contoh: Bakso Pak Kumis"
                placeholderTextColor={colors.outlineVariant}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Kategori</Text>
            <Pressable 
              onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)} 
              style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <Text 
                style={[styles.input, { color: categories.length ? colors.text : colors.outlineVariant, flex: 1 }]}
                numberOfLines={1}
              >
                {categories.length > 0 ? categories.join(', ') : 'Pilih kategori (bisa lebih dari satu)...'}
              </Text>
              <FontAwesome name={categoryDropdownOpen ? "chevron-up" : "chevron-down"} color={colors.outlineVariant} size={14} />
            </Pressable>

            {categoryDropdownOpen && (
              <View style={[styles.dropdownContainer, { borderColor: colors.surfaceContainerLow, backgroundColor: colors.background }]}>
                {MERCHANT_CATEGORIES.map((cat, index) => {
                  const isActive = categories.includes(cat);
                  const isLast = index === MERCHANT_CATEGORIES.length - 1;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        setCategories(prev => 
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        );
                      }}
                      style={({pressed}) => [
                        styles.dropdownItem, 
                        { borderBottomColor: colors.surfaceContainerLow }, 
                        isLast && { borderBottomWidth: 0 },
                        pressed && { backgroundColor: colors.surfaceContainerLow }
                      ]}
                    >
                      <Text style={[styles.dropdownText, { color: isActive ? colors.primary : colors.text }]}>
                        {cat}
                      </Text>
                      {isActive && <FontAwesome name="check-circle" color={colors.primary} size={18} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>2. Tampilan & Detail</Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceMuted }]}>
              Buat jualanmu memikat dengan deskripsi dan foto cover.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Deskripsi (Menu, Keunggulan)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Contoh: Sedia bakso urat dan telur. Halal 100%!"
                placeholderTextColor={colors.outlineVariant}
                style={[styles.textArea, { color: colors.text }]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Foto Cover Toko</Text>
            <Text style={[styles.hint, { color: colors.onSurfaceMuted, marginBottom: 12 }]}>
              Foto ini akan muncul sebagai background utama profil jualanmu di aplikasi. Pastikan gambarnya menarik dan terlihat jelas!
            </Text>
            <View style={[styles.imagePickerArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
              {coverImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: coverImage }} style={styles.previewImage} />
                  <Pressable 
                    onPress={() => { setCoverImage(null); setCoverImageBase64(null); }} 
                    style={[styles.removeImageBtn, { backgroundColor: '#ef4444' }]}
                  >
                    <FontAwesome name="trash" size={14} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <FontAwesome name="image" size={32} color={colors.outlineVariant} style={{ marginBottom: 12 }} />
                  <Text style={[styles.imagePickerHint, { color: colors.onSurfaceMuted }]}>
                    Pilih foto gerobak atau menu andalanmu
                  </Text>
                  <View style={styles.imagePickerBtns}>
                    <Pressable 
                      onPress={takePhoto} 
                      style={({pressed}) => [styles.pickerBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}
                    >
                      <FontAwesome name="camera" size={14} color="#fff" />
                      <Text style={styles.pickerBtnText}>Kamera</Text>
                    </Pressable>
                    <Pressable 
                      onPress={pickImage} 
                      style={({pressed}) => [styles.pickerBtn, { backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.primary }, pressed && styles.pressed]}
                    >
                      <FontAwesome name="image" size={14} color={colors.primary} />
                      <Text style={[styles.pickerBtnText, { color: colors.primary }]}>Galeri</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <View style={{ marginTop: 24 }}>
              <Text style={[styles.label, { color: colors.text }]}>Punya URL Foto? (Opsional)</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                <TextInput
                  value={coverUrl}
                  onChangeText={setCoverUrl}
                  placeholder="https://contoh.com/foto.jpg"
                  placeholderTextColor={colors.outlineVariant}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>
            <Text style={[styles.hint, { color: colors.outlineVariant }]}>Kosongkan jika menggunakan fitur ambil foto di atas.</Text>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>3. Rute & Kontak</Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceMuted }]}>
              Bantu pelanggan menemukan dan menghubungimu.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Nomor WhatsApp (Opsional)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <TextInput
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="Contoh: 081234567890"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="phone-pad"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Base/Lokasi Mangkal</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <TextInput
                value={baseLocation}
                onChangeText={setBaseLocation}
                placeholder="Contoh: Alun-alun Kota"
                placeholderTextColor={colors.outlineVariant}
                style={[styles.input, { color: colors.text, flex: 1 }]}
              />
              <Pressable 
                onPress={requestCurrentLocation}
                disabled={isLocating}
                style={({pressed}) => [
                  styles.locationIconBtn, 
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <FontAwesome name="map-marker" color="#fff" size={16} />
              </Pressable>
            </View>

            {baseCoords && (
              <View style={[styles.miniMapContainer, { borderColor: colors.surfaceContainerLow }]}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.miniMap}
                  initialRegion={{
                    ...baseCoords,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                  }}
                  onPress={(e) => setBaseCoords(e.nativeEvent.coordinate)}
                >
                  <Marker 
                    coordinate={baseCoords} 
                    draggable 
                    onDragEnd={(e) => setBaseCoords(e.nativeEvent.coordinate)}
                    pinColor={colors.primary}
                  />
                  <Circle 
                    center={baseCoords}
                    radius={radius}
                    fillColor={colors.primary + '22'}
                    strokeColor={colors.primary}
                    strokeWidth={1}
                  />
                </MapView>
                <View style={styles.mapHint}>
                  <Text style={styles.mapHintText}>Geser marker atau ketuk peta untuk ubah lokasi</Text>
                </View>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Radius Area Keliling</Text>
            <View style={styles.paymentContainer}>
              {RADIUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setRadius(opt.value)}
                  style={[
                    styles.paymentChip,
                    { backgroundColor: radius === opt.value ? colors.primary + '22' : colors.surfaceContainerLow },
                    radius === opt.value && { borderColor: colors.primary, borderWidth: 1 }
                  ]}
                >
                  <Text style={[styles.paymentText, { color: radius === opt.value ? colors.primary : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Nama Area (Opsional)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <TextInput
                value={operationArea}
                onChangeText={setOperationArea}
                placeholder="Contool: Perumahan Indah - Jl. Mawar"
                placeholderTextColor={colors.outlineVariant}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Metode Pembayaran</Text>
            <View style={styles.paymentContainer}>
              {PAYMENT_METHODS.map((method) => {
                const isActive = payments.includes(method);
                return (
                  <Pressable
                    key={method}
                    onPress={() => togglePayment(method)}
                    style={[
                      styles.paymentChip,
                      { backgroundColor: isActive ? colors.primary + '22' : colors.surfaceContainerLow },
                      isActive && { borderColor: colors.primary, borderWidth: 1 }
                    ]}
                  >
                    <Text style={[styles.paymentText, { color: isActive ? colors.primary : colors.text }]}>
                      {method}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 20, borderTopColor: colors.surfaceContainerLow }]}>
        <View style={styles.footerRow}>
          {step > 1 ? (
            <Pressable onPress={handlePrev} style={({pressed}) => [styles.footerBtnOutline, { borderColor: colors.outlineVariant }, pressed && styles.pressed]}>
              <Text style={[styles.footerBtnText, { color: colors.text }]}>Kembali</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < totalSteps ? (
            <Pressable onPress={handleNext} style={({pressed}) => [styles.footerBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
              <Text style={[styles.footerBtnText, { color: '#fff5ed' }]}>Lanjut</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleSubmit} disabled={loading} style={({pressed}) => [styles.footerBtn, { backgroundColor: colors.primary }, pressed && styles.pressed, loading && styles.disabled]}>
              <Text style={[styles.footerBtnText, { color: '#fff5ed' }]}>{loading ? 'Memproses...' : 'Selesaikan'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 },
  progressBg: { height: 4, width: '100%' },
  progressFill: { height: '100%', borderRadius: 2 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  stepContainer: { gap: 4 },
  stepTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, letterSpacing: -0.5 },
  stepSubtitle: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, marginBottom: 20 },
  
  label: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, marginTop: 12, marginBottom: 6 },
  inputWrap: { borderRadius: 12, borderCurve: 'continuous', paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, padding: 0 },
  textArea: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, padding: 0, minHeight: 60 },
  hint: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, marginTop: 4 },

  dropdownContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 14,
  },

  paymentContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  paymentChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'transparent' },
  paymentText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 13 },

  footer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  footerRow: { flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  footerBtnOutline: { flex: 1, paddingVertical: 14, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  footerBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#b91c1c', fontFamily: 'BeVietnamPro_500Medium', fontSize: 13 },

  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.6 },

  imagePickerArea: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 180,
    overflow: 'hidden',
    marginTop: 4,
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imagePickerHint: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  imagePickerBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pickerBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  previewContainer: {
    width: '100%',
    height: 180,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  locationIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
  },
  miniMap: {
    flex: 1,
  },
  mapHint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  mapHintText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
});
