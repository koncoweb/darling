import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { SurfaceCard, SurfaceSection } from '@/components/ui/Kinetic';
import { TopAppBar, TopAppBarIconButton } from '@/components/ui/TopAppBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createVideo, getMyMerchant, type Merchant } from '@/lib/dataApi';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function StudioScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const auth = useAuthContext();
  const params = useLocalSearchParams<{ mode?: string; initialCaption?: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = React.useState<Merchant | null>(null);
  const [videoUri, setVideoUri] = React.useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = React.useState('');
  const [caption, setCaption] = React.useState(params.initialCaption || '');
  const [status, setStatus] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const player = useVideoPlayer(videoUri || '', (player) => {
    player.loop = true;
    if (videoUri) player.play();
  });

  React.useEffect(() => {
    if (!auth.user) {
      setMerchant(null);
      return;
    }
    let cancelled = false;
    getMyMerchant(auth.user.id, auth.jwt)
      .then((m) => {
        if (cancelled) return;
        setMerchant(m);
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, [auth.jwt, auth.user]);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izin kamera diperlukan untuk merekam video.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  async function handleCreateVideo() {
    if (!merchant || !videoUri) {
      console.warn('[Studio] Missing merchant or videoUri:', { merchant: !!merchant, video: !!videoUri });
      return;
    }
    setStatus(null);
    setIsSubmitting(true);
    try {
      console.log('[Studio] Starting upload flow for merchant:', merchant.store_name, `(${merchant.id})`);
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) {
        console.error('[Studio] No JWT available');
        throw new Error('JWT belum tersedia. Silakan coba lagi.');
      }
      
      // Diagnostic: Check JWT Role
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        console.log('[Studio] JWT Diagnostic - Role:', payload.role, 'Sub:', payload.sub);
      } catch (e) {
        console.warn('[Studio] Could not decode JWT for diagnostics');
      }
      
      console.log('[Studio] JWT obtained, starting Cloudinary upload...');

      // 1. Upload to Cloudinary
      setIsProcessing(true);
      setStatus('Uploading to Cloudinary...');
      
      const cloudinaryRes = await uploadToCloudinary(videoUri, 'video');
      console.log('[Studio] Cloudinary upload success:', cloudinaryRes.secure_url);
      
      setIsProcessing(false);
      setStatus('Saving to database...');

      // 2. Save URL to Neon DB
      console.log('[Studio] Saving video metadata to Neon DB...');
      const created = await createVideo(jwt, {
        merchant_id: merchant.id,
        video_url: cloudinaryRes.secure_url,
        thumbnail_url: thumbUrl.trim().length ? thumbUrl.trim() : null,
        caption: caption.trim().length ? caption.trim() : null,
      });

      if (!created) {
        console.error('[Studio] createVideo returned null');
        throw new Error('Gagal publish video ke database');
      }
      
      Alert.alert('Sukses', 'Video Anda telah berhasil di-publish!');
      
      setVideoUri(null);
      setThumbUrl('');
      setCaption('');
      setStatus(null);

      // Auto-navigate back to dashboard if in merchant mode
      if (params.mode === 'merchant') {
        setTimeout(() => {
          router.push('/merchant/dashboard');
        }, 1500);
      }
    } catch (e: any) {
      console.error('Upload flow error:', e);
      let errorMsg = 'Gagal publish';
      if (e.message?.includes('42501') || e.message?.includes('RLS')) {
        errorMsg = 'Error Izin (RLS): Anda tidak memiliki akses ke merchant ini atau sesi kadaluarsa.';
      } else if (e.message) {
        errorMsg = e.message;
      }
      setStatus(errorMsg);
      Alert.alert('Gagal Publish', errorMsg);
    } finally {
      setIsSubmitting(false);
      setIsProcessing(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <StatusBar style="auto" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 140 + insets.bottom },
        ]}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: colors.text }]}>Studio AI</Text>
          <Text style={[styles.p, { color: colors.onSurfaceMuted }]}>
            {params.mode === 'merchant' 
              ? 'Promosikan menu andalanmu dengan bantuan AI.' 
              : 'Craft your street food story.'}
          </Text>
        </View>

        {!auth.user ? (
          <SurfaceCard style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Masuk untuk upload</Text>
            <Text style={[styles.authSubtitle, { color: colors.onSurfaceMuted }]}>
              Login/daftar untuk mengunggah video dan membuat caption.
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
        ) : merchant ? (
          <SurfaceCard style={styles.publishCard}>
            <Text style={[styles.publishTitle, { color: colors.text }]}>Publish Video</Text>
            <Text style={[styles.publishSubtitle, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
              {merchant.store_name}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Video Content</Text>
            {videoUri ? (
              <View style={styles.previewContainer}>
                <VideoView 
                  player={player} 
                  style={styles.previewVideo} 
                  allowsFullscreen 
                  allowsPictureInPicture 
                />
                <Pressable onPress={() => setVideoUri(null)} style={styles.removeVideoBtn}>
                  <FontAwesome name="times-circle" size={24} color="#ff4444" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.pickerRow}>
                <Pressable 
                  onPress={pickVideo}
                  style={[styles.videoPicker, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, flex: 1 }]}>
                  <FontAwesome name="cloud-upload" size={32} color={colors.primary} />
                  <Text style={[styles.videoPickerText, { color: colors.onSurfaceMuted }]}>Pilih Galeri</Text>
                  <Text style={[styles.videoPickerSubtext, { color: colors.onSurfaceMuted }]}>Maks 10MB</Text>
                </Pressable>
                <Pressable 
                  onPress={recordVideo}
                  style={[styles.videoPicker, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, flex: 1 }]}>
                  <FontAwesome name="camera" size={32} color={colors.secondary} />
                  <Text style={[styles.videoPickerText, { color: colors.onSurfaceMuted }]}>Rekam Video</Text>
                  <Text style={[styles.videoPickerSubtext, { color: colors.onSurfaceMuted }]}>Gunakan AI</Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: colors.text }]}>Thumbnail URL (opsional)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <TextInput
                value={thumbUrl}
                onChangeText={setThumbUrl}
                placeholder="https://..."
                placeholderTextColor={colors.outlineVariant}
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Caption (opsional)</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Tulis caption..."
                placeholderTextColor={colors.outlineVariant}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {status ? <Text style={[styles.status, { color: colors.primary }]}>{status}</Text> : null}

            <Pressable
              onPress={handleCreateVideo}
              disabled={isSubmitting || !videoUri}
              style={({ pressed }) => [pressed && styles.pressed, (isSubmitting || !videoUri) && styles.disabled]}>
              <LinearGradient
                colors={[colors.primary, 'rgba(255, 140, 0, 0.75)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.publishNowBtn}>
                <Text style={styles.publishNowText}>
                  {isProcessing ? 'Mengonversi...' : isSubmitting ? 'Memproses...' : 'Publish ke Feed'}
                </Text>
                {isProcessing || isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <FontAwesome name="send" size={18} color="#fff5ed" />
                )}
              </LinearGradient>
            </Pressable>
          </SurfaceCard>
        ) : (
          <SurfaceCard style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Belum terdaftar sebagai pedagang</Text>
            <Text style={[styles.authSubtitle, { color: colors.onSurfaceMuted }]}>
              Buat akun pedagang dulu di tab Profil agar bisa upload video.
            </Text>
          </SurfaceCard>
        )}

        <View style={styles.grid}>
          <SurfaceSection style={styles.heroCard}>
            <Pressable style={({ pressed }) => [styles.heroPress, pressed && styles.pressed]}>
              <View style={[styles.heroIconWrap, { backgroundColor: colors.surfaceContainerLowest }]}>
                <FontAwesome name="video-camera" size={30} color={colors.primary} />
              </View>
              <View style={styles.heroText}>
                <Text style={[styles.heroTitle, { color: colors.primary }]}>Upload Video</Text>
                <Text style={[styles.heroSubtitle, { color: colors.onSurfaceMuted }]}>
                  Tap to select from camera roll
                </Text>
              </View>
            </Pressable>
          </SurfaceSection>

          <SurfaceCard style={styles.miniCard}>
            <LinearGradient
              colors={['rgba(255, 211, 58, 0.25)', 'rgba(0,0,0,0)']}
              start={{ x: 0.4, y: 0.2 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniGlow}
            />
            <View style={[styles.miniIconWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="magic" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.miniTitle, { color: colors.text }]}>AI Auto-Edit</Text>
            <Text style={[styles.miniSubtitle, { color: colors.onSurfaceMuted }]}>Magic cuts & color</Text>
          </SurfaceCard>

          <SurfaceCard style={styles.miniCard}>
            <LinearGradient
              colors={['rgba(153, 248, 153, 0.35)', 'rgba(0,0,0,0)']}
              start={{ x: 0.4, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.miniGlow}
            />
            <View style={[styles.miniIconWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <FontAwesome name="music" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.miniTitle, { color: colors.text }]}>Add Music</Text>
            <Text style={[styles.miniSubtitle, { color: colors.onSurfaceMuted }]}>
              Trending local beats
            </Text>
          </SurfaceCard>
        </View>

        <View style={styles.draftsHeader}>
          <Text style={[styles.draftsTitle, { color: colors.text }]}>Recent Drafts</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.draftsRow}>
          <Pressable style={({ pressed }) => [styles.draftCard, pressed && styles.pressed]}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB30hqjhB1vOfWcut9PTz4r1dSd5z-lee_vaeI9he-AV4ARN2e1s2P80tpztXCaXbxGgYMMngUGoN6ZE5axX_aAnGNKhn1OO_qikssxW7jE_JlRk9MZKqCsmWBHZTj8MuHg1MAnHNPHPwSmxQE7tD6xLbRO5tq5ss14pI4K94z7fjcV2m6xxHYxpX0rbRO1lfvlYrU2W8DYZlQrOvy60emaM3a8t3kodhlHYIlYnkBLCdYUgXf4hBtSCUNklxVOyYRvQxCimSC4dZZY',
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.draftMeta}>
              <Text style={styles.draftName} numberOfLines={1}>
                Spicy Noodles
              </Text>
              <Text style={styles.draftDur}>0:45</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.draftAdd,
              { borderColor: colors.outlineVariant },
              pressed && styles.pressed,
            ]}>
            <FontAwesome name="plus" size={24} color={colors.outlineVariant} />
          </Pressable>
        </ScrollView>
      </ScrollView>

      <View style={[styles.publishWrap, { paddingBottom: 96 + insets.bottom }]}>
        <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
          <LinearGradient
            colors={[colors.primary, 'rgba(255, 140, 0, 0.75)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishBtn}>
            <Text style={styles.publishText}>Publish Masterpiece</Text>
            <FontAwesome name="send" size={18} color="#fff5ed" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  authCard: {
    marginBottom: 14,
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
  videoPicker: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  videoPickerText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  videoPickerSubtext: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11,
  },
  previewContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  previewVideo: {
    flex: 1,
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  authRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  authBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 214, 171, 0.5)',
  },
  authBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    letterSpacing: -0.13,
  },
  publishCard: {
    marginBottom: 14,
    gap: 10,
  },
  publishTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.18,
  },
  publishSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    lineHeight: 16,
    marginTop: -4,
  },
  inputLabel: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
    marginTop: 6,
  },
  inputWrap: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    paddingVertical: 0,
  },
  status: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  publishNowBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  publishNowText: {
    color: '#fff5ed',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  header: {
    marginBottom: 16,
  },
  h1: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 36,
    letterSpacing: -0.72,
  },
  p: {
    fontFamily: 'BeVietnamPro_400Regular',
    marginTop: 6,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroCard: {
    width: '100%',
    padding: 0,
    overflow: 'hidden',
  },
  heroPress: {
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
  },
  heroIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(69,40,0,1)',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroText: {
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    letterSpacing: -0.16,
  },
  heroSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11,
    marginTop: 4,
  },
  miniCard: {
    width: '48%',
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
  },
  miniGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -40,
    top: -40,
  },
  miniIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  miniSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11,
  },
  draftsHeader: {
    marginTop: 18,
    paddingHorizontal: 2,
  },
  draftsTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  draftsRow: {
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  draftCard: {
    width: 128,
    height: 168,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  draftMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  draftName: {
    color: '#fff',
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
  },
  draftDur: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  draftAdd: {
    width: 128,
    height: 168,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  publishBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: 'rgba(140,74,0,1)',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  publishText: {
    color: '#fff5ed',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    letterSpacing: -0.16,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
