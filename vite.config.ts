import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let devLocatorInstalled = false;
try { require.resolve('babel-plugin-react-dev-locator'); devLocatorInstalled = true; } catch {}

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7553',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react({
      babel: {
        plugins: devLocatorInstalled ? ['react-dev-locator'] : [],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
