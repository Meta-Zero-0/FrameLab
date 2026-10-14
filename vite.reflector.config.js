import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({build:{outDir:'dist/reflector-lab',rollupOptions:{input:fileURLToPath(new URL('./reflector-lab.html',import.meta.url))}}});
