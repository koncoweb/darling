import React from 'react';
import { StyleSheet, Pressable, View, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getVideoThumbnail } from '@/lib/cloudinary';
import { FeedVideo } from '@/lib/dataApi';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const DEFAULT_SIZE = (width - 32) / COLUMN_COUNT; // Assuming 16px padding on each side

interface VideoGridItemProps {
  video: FeedVideo;
  onPress: (video: FeedVideo) => void;
  size?: number;
}

export default function VideoGridItem({ video, onPress, size = DEFAULT_SIZE }: VideoGridItemProps) {
  const thumbnailUrl = video.thumbnail_url || getVideoThumbnail(video.video_url);

  return (
    <Pressable 
      onPress={() => onPress(video)}
      style={[styles.container, { width: size, height: size * 1.5 }]}
    >
      <Image 
        source={{ uri: thumbnailUrl }} 
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.overlay}>
        <View style={styles.playIconContainer}>
          <MaterialCommunityIcons name="play" size={20} color="white" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  thumbnail: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  playIconContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 2,
  },
});
