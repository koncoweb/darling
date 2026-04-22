import '../../lib/bootstrap';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { listFeedVideos, type FeedVideo } from '@/lib/dataApi';
import VideoFeedItem from '@/components/video/VideoFeedItem';

import { useLocalSearchParams } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BerandaScreen() {
  const { jwt } = useAuthContext();
  const { initialVideoId } = useLocalSearchParams<{ initialVideoId?: string }>();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const fetchVideos = useCallback(async () => {
    if (!jwt) return; // Wait for JWT if required by API
    try {
      setLoading(true);
      const data = await listFeedVideos(20, jwt);
      setVideos(data);
    } catch (error) {
      console.error('Error fetching feed videos:', error);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle initial scroll/reorder when videos are loaded and initialVideoId is present
  useEffect(() => {
    if (videos.length > 0 && initialVideoId) {
      const index = videos.findIndex(v => v.id === initialVideoId);
      if (index !== -1) {
        setActiveIndex(index);
        // We use a small delay to ensure FlatList is ready
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [videos, initialVideoId]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading && videos.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({ item, index }) => (
          <VideoFeedItem 
            video={item} 
            isActive={index === activeIndex} 
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        onRefresh={fetchVideos}
        refreshing={loading}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
