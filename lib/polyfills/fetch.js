// Fix specific specifically for React Native (Expo Go iOS/Android)
// GoTrue (Neon Auth uses GoTrue) restricts requests that define an absolute callback URL
// but lack an Origin header (React Native fetch doesn't send Origin).
if (typeof global !== 'undefined' && global.fetch) {
  const originalFetch = global.fetch;

  global.fetch = async (...args) => {
    let url = args[0];
    let options = args[1] || {};

    const urlString = typeof url === 'string' ? url : url?.url || '';

    if (urlString.includes('neonauth')) {
      // console.log('[FETCH] Intercepting request to', urlString);
      
      const newHeaders = new Headers();
      
      let method = options.method;
      let body = options.body;
      let credentials = options.credentials;
      let cache = options.cache;
      let mode = options.mode;

      // Copy existing headers from Request object if url is a Request
      if (typeof url === 'object' && url !== null) {
        if (url.headers) {
          url.headers.forEach((value, key) => newHeaders.append(key, value));
        }
        if (!method && url.method) method = url.method;
        if (!body && url.body) body = url.body;
        // In React Native's fetch, some properties like body might just be stored securely,
        // but we copy what we can.
        if (!credentials && url.credentials) credentials = url.credentials;
        if (!cache && url.cache) cache = url.cache;
        if (!mode && url.mode) mode = url.mode;
      }
      
      // Copy from options.headers
      if (options.headers) {
        if (typeof options.headers.forEach === 'function') {
          options.headers.forEach((value, key) => newHeaders.append(key, value));
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([key, value]) => newHeaders.append(key, value));
        } else {
          for (const [key, value] of Object.entries(options.headers)) {
            newHeaders.append(key, value);
          }
        }
      }

      // Explicitly delete any existing origin/referer to avoid duplicate header conflicts
      newHeaders.delete('origin');
      newHeaders.delete('referer');

      // Add our forced headers
      newHeaders.append('origin', 'https://darling.app');
      newHeaders.append('referer', 'https://darling.app/');
      newHeaders.append('expo-origin', 'https://darling.app');

      // Convert Headers to plain object to bypass any RN network quirks
      const plainHeaders = {};
      newHeaders.forEach((value, key) => {
        plainHeaders[key] = value;
      });

      options = {
        ...options,
        method: method || 'GET',
        headers: plainHeaders,
      };
      
      if (body) options.body = body;
      if (credentials) options.credentials = credentials;
      if (cache) options.cache = cache;
      if (mode) options.mode = mode;
      
      if (typeof url === 'object') {
        url = urlString;
      }
      
      args[0] = url;
      args[1] = options;
    }

    return originalFetch.apply(this, args);
  };
}
