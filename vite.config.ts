import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'

// One config serves all Vite pipelines: dev playground, Cypress CT (serve
// mode — lib/dts inert there) and the library build. Storybook strips the
// lib/dts pieces in .storybook/main.ts#viteFinal.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ tsconfigPath: './tsconfig.lib.json', bundleTypes: true }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
