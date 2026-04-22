// Fix specific specifically for React Native (Expo Go iOS/Android)
// GoTrue (Neon Auth uses GoTrue) restricts requests that define an absolute callback URL
// but lack an Origin header (React Native fetch doesn't send Origin).
// NOTE: We no longer use a global interceptor here as it interferes with standard fetch behavior.
// Headers are now handled directly in the Neon Auth client configuration (lib/neonAuth.ts).
if (typeof global !== 'undefined' && global.fetch) {
  // Polyfill is now empty to avoid conflicts with standard fetch Response objects.
}

