/// <reference types="vite/client" />

declare global {
  interface Window {
    Buffer: typeof Buffer;
    global: Window;
  }
}

export {};
