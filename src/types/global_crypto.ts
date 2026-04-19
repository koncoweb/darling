export {};

declare global {
  // Ambient declaration to satisfy TypeScript when code references global Crypto (uppercase)
  var Crypto: any;
}
