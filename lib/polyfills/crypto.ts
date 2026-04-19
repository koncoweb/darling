import * as ExpoCrypto from 'expo-crypto';

/**
 * Polyfill for the Web Crypto API in React Native/Expo environments.
 * This ensures that libraries depending on `global.crypto` (like auth or database clients)
 * function correctly in Expo Go and native builds.
 */
const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : window) as any;

// Helper to safely get crypto methods from expo-crypto
const getRandomValues = ExpoCrypto.getRandomValues;
const randomUUID = ExpoCrypto.randomUUID;

if (!globalScope.crypto) {
  try {
    globalScope.crypto = {
      getRandomValues,
      randomUUID,
    };
  } catch (e) {
    console.warn('Failed to polyfill global.crypto:', e);
  }
} else {
  // If crypto already exists, ensure missing methods are attached
  if (typeof globalScope.crypto.getRandomValues !== 'function') {
    globalScope.crypto.getRandomValues = getRandomValues;
  }
  if (typeof globalScope.crypto.randomUUID !== 'function') {
    globalScope.crypto.randomUUID = randomUUID;
  }
}

// Polyfill uppercase Crypto global if needed by some libraries (like older versions of 'jose')
if (!globalScope.Crypto) {
  try {
    globalScope.Crypto = function() {};
    globalScope.Crypto.prototype.getRandomValues = getRandomValues;
    globalScope.Crypto.prototype.randomUUID = randomUUID;
    // Static methods as well
    (globalScope as any).Crypto.getRandomValues = getRandomValues;
    (globalScope as any).Crypto.randomUUID = randomUUID;
  } catch (e) {
    // Fallback to plain object if constructor matching fails
    globalScope.Crypto = {
      getRandomValues,
      randomUUID,
    };
  }
}

// Bridge to window for web-like environments
if (typeof window !== 'undefined') {
  try {
    (window as any).crypto = (window as any).crypto || globalScope.crypto;
  } catch {}
}

