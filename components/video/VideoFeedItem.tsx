import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedVideo } from '@/lib/dataApi';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface VideoFeedItemProps {
  video: FeedVideo;
  isActive: boolean;
}

export default function VideoFeedItem({ video, isActive }: VideoFeedItemProps) {
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom padding for the floating tab bar (height is 92)
  const TAB_BAR_HEIGHT = 92;
  // Increase padding to ensure content is safely above the floating tab bar
  const bottomPadding = Math.max(insets.bottom, 20) + TAB_BAR_HEIGHT + 24; 


  const player = useVideoPlayer(video.video_url, (player) => {
    player.loop = true;
    player.muted = isMuted;
    if (isActive) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    player.muted = nextMuted;
  };

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      <Pressable style={styles.muteOverlay} onPress={toggleMute}>
        <MaterialCommunityIcons 
          name={isMuted ? "volume-off" : "volume-high"} 
          size={24} 
          color="white" 
        />
      </Pressable>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={[styles.bottomOverlay, { paddingBottom: bottomPadding }]}
      >
        <View style={styles.content}>
          <View style={styles.merchantRow}>
            <Image
              source={{ uri: video.merchants?.avatar_url || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
              contentFit="cover"
            />
            <Text style={styles.merchantName}>
              {video.merchants?.store_name || 'Pedagang Darling'}
            </Text>
          </View>
          
          <Text style={styles.caption} numberOfLines={3}>
            {video.caption}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  muteOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 100,
  },
  content: {
    gap: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  merchantName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'BeVietnamPro_400Regular',
  },
});
