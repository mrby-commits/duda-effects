import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 打包成單一 IIFE 檔（dist/effects.js），可直接用 <script> 載入，不需要模組系統。
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.jsx',
      name: 'DudaEffects',
      formats: ['iife'],
      fileName: () => 'effects.js',
    },
    rollupOptions: {
      output: { assetFileNames: 'effects.[ext]' },
    },
  },
});
