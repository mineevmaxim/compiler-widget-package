import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import dts from "vite-plugin-dts"

export default defineConfig({
  plugins: [
    react(),
    svgr({svgrOptions: {exportType: 'default'}}),
    dts({
      insertTypesEntry: true,
      rollupTypes: true
    })
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {}  // Просто пустой объект для поддержки
    }
  },
  build: {
    lib: {
      entry: './src/index.tsx',
      name: 'CompilerWidget',
      fileName: 'index',
      formats: ['es']
    },
    cssCodeSplit: false,  // Один CSS файл
    rollupOptions: {
      external: ['react', 'react-dom', '@xyflow/react', '@monaco-editor/react', 'axios'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@xyflow/react': 'ReactFlow',
          '@monaco-editor/react': 'MonacoEditor'
        },
        // 🔥 КЛЮЧЕВОЕ: принудительно именуем CSS как index.css
        assetFileNames: ({ name }) => {
          if (name?.endsWith('.css')) {
            return 'index.css'
          }
          return '[name].[ext]'
        }
      }
    }
  }
})
