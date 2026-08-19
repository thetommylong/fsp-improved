import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import monkey from 'vite-plugin-monkey';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    monkey({
      entry: 'src/index.ts',
      userscript: {
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.fpt.edu.vn/*'],
        'run-at': 'document-start',
        grant: [
          "GM_setValue",
          "GM_getValue",
          "GM_deleteValue",
          "GM_xmlhttpRequest",
          "unsafeWindow",
          "GM_addElement"
        ]
      },
    }),
  ],
  server: {
    // hmr: {
    //   protocol: "wss",
    //   host: 'localhost',
    // },
    hmr: false,
  }
});
