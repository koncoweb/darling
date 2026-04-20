import { createInternalNeonAuth } from '@neondatabase/neon-js/auth';

export const neonAuthUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;

// React Native strips the Origin header automatically.
// We inject it at the adapter-init level so it flows through
// better-auth's customFetchImpl pipeline (not global.fetch).
const TRUSTED_ORIGIN = 'https://darling.app';

const internal =
  neonAuthUrl && neonAuthUrl.length > 0
    ? createInternalNeonAuth(neonAuthUrl, {
        allowAnonymous: true,
        fetchOptions: {
          headers: {
            origin: TRUSTED_ORIGIN,
            referer: `${TRUSTED_ORIGIN}/`,
            'x-expo-origin': TRUSTED_ORIGIN,
          },
          onRequest: (ctx: any) => {
            // Ensure headers are always present regardless of request type
            if (ctx.headers) {
              ctx.headers.set('origin', TRUSTED_ORIGIN);
              ctx.headers.set('referer', `${TRUSTED_ORIGIN}/`);
              ctx.headers.set('x-expo-origin', TRUSTED_ORIGIN);
            }
            return ctx;
          },
        },
      } as any)
    : null;

export const neonAuth: any = internal ? internal.adapter : null;

export function requireNeonAuth() {
  if (!neonAuth) {
    throw new Error('Missing EXPO_PUBLIC_NEON_AUTH_URL');
  }
  return neonAuth as any;
}

export function requireGetJWTToken() {
  if (!internal) {
    throw new Error('Missing EXPO_PUBLIC_NEON_AUTH_URL');
  }
  return internal.getJWTToken;
}
