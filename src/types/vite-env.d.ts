/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
/// <reference types="vite-plugin-monkey/global" />
/// <reference types="vite-plugin-monkey/style" />

export {};

declare global {
  interface Window {
    __devtoolsPatchActive?: boolean;
    notify?: (message: string, type?: "info" | "success" | "error") => void;
  }
}
