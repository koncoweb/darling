/**
 * Web stub for react-native-maps.
 * react-native-maps is a native-only package and cannot run on web.
 * This stub prevents Metro from crashing when bundling for web.
 *
 * The Explore screen should handle the web case gracefully by checking Platform.OS.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapPlaceholder = ({ style, children, ...props }) => (
  <View style={[styles.placeholder, style]}>
    <Text style={styles.text}>🗺️ Map unavailable on web</Text>
    {children}
  </View>
);

const Marker = ({ children }) => children ?? null;
const Callout = ({ children }) => children ?? null;
const CalloutSubview = ({ children }) => children ?? null;
const Circle = () => null;
const Polygon = () => null;
const Polyline = () => null;
const Overlay = () => null;
const Heatmap = () => null;
const Geojson = () => null;

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e8e8',
  },
  text: {
    fontSize: 16,
    color: '#555',
  },
});

export default MapPlaceholder;
export {
  Marker,
  Callout,
  CalloutSubview,
  Circle,
  Polygon,
  Polyline,
  Overlay,
  Heatmap,
  Geojson,
};

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;
export const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
};
export const LocalTile = () => null;
export const UrlTile = () => null;
export const WMSTile = () => null;
