import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),envDir:fileURLToPath(new URL('../..',import.meta.url)),base:'/rollermap/',plugins:[react()],build:{outDir:'../../dist/rollermap',emptyOutDir:false}})
