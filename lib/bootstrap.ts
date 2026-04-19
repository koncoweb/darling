// Central bootstrap to initialize runtime polyfills and other globals early
// Ensures Expo RN app loads necessary polyfills before app code executes
import './polyfills/crypto';

export {};
