import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          height: 92,
          paddingTop: 12,
          paddingBottom: 28,
          paddingHorizontal: 12,
          borderTopLeftRadius: 48,
          borderTopRightRadius: 48,
          overflow: 'hidden',
          shadowColor: 'rgba(69, 40, 0, 1)',
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -10 },
          elevation: 20,
        },
        tabBarBackground: () =>
          Platform.OS === 'web' ? null : (
            <BlurView
              intensity={70}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={{ flex: 1 }}
            />
          ),
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <TabBarIcon name="play-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Jelajah',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-marker" color={color} />,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Studio AI',
          tabBarIcon: ({ color }) => <TabBarIcon name="magic" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil Saya',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
