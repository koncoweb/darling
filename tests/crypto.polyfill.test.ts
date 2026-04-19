// Basic runtime assertions to ensure polyfill exposes both surfaces
import '../lib/polyfills/crypto';

describe('Crypto polyfill surface', () => {
  test('globalThis.crypto exists with getRandomValues', () => {
    const c: any = (globalThis as any).crypto;
    expect(c).toBeDefined();
    expect(typeof c.getRandomValues).toBe('function');
  });

  test('globalThis.Crypto exists with getRandomValues', () => {
    const C: any = (globalThis as any).Crypto;
    expect(C).toBeDefined();
    expect(typeof C.getRandomValues).toBe('function');
  });
});
