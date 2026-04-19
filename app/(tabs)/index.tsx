import '../../lib/bootstrap';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { GradientCtaButton, RingAvatar } from '@/components/ui/Kinetic';
import { TopAppBar, TopAppBarIconButton } from '@/components/ui/TopAppBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { listFeedVideos, type FeedVideo } from '@/lib/dataApi';

const demo = {
  vendorName: 'The Sizzling Wok',
  distance: '0.8 km',
  caption:
    'Secret sauce goes on! Watch how we make our signature Pad Kra Pao with extra crispy pork belly.',
  backgroundUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCJFcnldU_KpsG6abPeltgP_m-2XDgDQ5USetTJRXzqQtGgDh2wRZrjepcuXjEeFa8TpIxn-jCartJWpWy03g7JRX9iedOSSVI2o1QrqS0sT2Twire9xFWdaXZlXhoon2VQP3gwo0cDjHbi1nQWq30nWoS-uxz40FbdYwQ5KPw5bl-tQVfG30gsEZPC1oWQVUzIBnLK4H3VmcOeiIQFkMvnztMZOV-tLGnk6_6RltMvsaJ29ReSV6lwtTqtcn5kkeHQVtQqEys_chlz',
  avatarUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuARR-c2bGdda2pRp8_6EAPdG4BzvqQt9z2gC1svYo5hti9uyH5M6lq4Qaca6l8b5qRbGXa0PxEalEyWL3mwn-1aPvKCpd0AIG6dPU9FFSUEmhNLGpCKiKy8aUd0YTM2HbdBi1b91kwLD5UCwcPZBBqGMDa-9jDFPz_VxAJoN5o5AO-35Ddc1rQmE-zf_YRkAwWtfBtbWfg3baWS0q3kC3h9TSXaJJ0duWScJvuk6xG6Rfdh6uV4YoVSkwhE-0GTLnK1f_aEGAhBlRds',
};

export default function BerandaScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const auth = useAuthContext();
  const [remote, setRemote] = React.useState<FeedVideo | null>(null);

  React.useEffect(() => {
    if (!auth.jwt) return;
    let cancelled = false;
    listFeedVideos(1, auth.jwt)
      .then((items) => {
        if (cancelled) return;
        setRemote(items[0] ?? null);
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, [auth.jwt]);

  const vendorName = remote?.merchants?.store_name ?? demo.vendorName;
  const avatarUri = remote?.merchants?.avatar_url ?? demo.avatarUri;
  const caption = remote?.caption ?? demo.caption;
  const backgroundUri = remote?.thumbnail_url ?? remote?.video_url ?? demo.backgroundUri;
  const isActive = remote?.merchants?.is_active ?? true;

  return (
    <View style={[styles.screen, { backgroundColor: '#190b00' }]}>
      <StatusBar style="light" />

      <View style={styles.media}>
        <Image source={{ uri: backgroundUri }} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(25, 11, 0, 0.15)' }]} />
        <LinearGradient
          colors={['rgba(25, 11, 0, 0.95)', 'rgba(25, 11, 0, 0.35)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.overlay, { paddingBottom: 96 + insets.bottom }]}>
          <View style={styles.left}>
            <View style={styles.vendorRow}>
              <RingAvatar uri={avatarUri} active={isActive} />
              <View style={styles.vendorMeta}>
                <Text style={styles.vendorName}>{vendorName}</Text>
                <View style={styles.vendorDistanceRow}>
                  <FontAwesome name="map-marker" size={12} color="rgba(255,245,237,0.85)" />
                  <Text style={styles.vendorDistance}>{demo.distance}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.caption} numberOfLines={3}>
              {caption}
            </Text>

            <GradientCtaButton
              label="View Menu"
              icon={<FontAwesome name="cutlery" size={16} color="#fff5ed" />}
            />
          </View>

          <View style={styles.right}>
            <ActionButton icon="heart" label="12.4K" />
            <ActionButton icon="comment" label="342" />
            <ActionButton icon="share" label="Share" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  media: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
  left: {
    flex: 1,
    paddingRight: 56,
    gap: 12,
  },
  right: {
    width: 56,
    alignItems: 'center',
    gap: 16,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vendorMeta: {
    flex: 1,
  },
  vendorName: {
    color: '#fff5ed',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.18,
  },
  vendorDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  vendorDistance: {
    color: 'rgba(255,245,237,0.85)',
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
  },
  caption: {
    color: '#fff5ed',
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  topAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

function ActionButton({ icon, label }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string }) {
  return (
    <Pressable style={({ pressed }) => [actionStyles.container, pressed && actionStyles.pressed]}>
      <View style={actionStyles.iconWrap}>
        <FontAwesome name={icon} size={22} color="#fff5ed" />
      </View>
      <Text style={actionStyles.label}>{label}</Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff5ed',
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 11,
  },
});
