import { createInternalNeonAuth } from '@neondatabase/neon-js/auth';

export const neonAuthUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;

const internal =
  neonAuthUrl && neonAuthUrl.length > 0
    ? createInternalNeonAuth(neonAuthUrl, { allowAnonymous: true } as any)
    : null;

export const neonAuth: any = internal
  ? Object.assign(internal.adapter as any, { getJWTToken: internal.getJWTToken })
  : null;

export function requireNeonAuth() {
  if (!neonAuth) {
    throw new Error('Missing EXPO_PUBLIC_NEON_AUTH_URL');
  }
  return neonAuth as any;
}
