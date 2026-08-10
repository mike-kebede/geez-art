// Ambient declarations for Vite asset imports TypeScript can't see on its own.
// Vite emits the imported file as a hashed asset and gives back its URL string.

declare module '*.woff2' {
  const src: string;
  export default src;
}
