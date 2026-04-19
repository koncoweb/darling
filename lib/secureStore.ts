import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function getSecureItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
