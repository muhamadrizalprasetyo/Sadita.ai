import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(projectDirectory, 'src/admin-playground'),
            react: resolve(projectDirectory, 'node_modules/react'),
            'react-dom': resolve(projectDirectory, 'node_modules/react-dom'),
            'lucide-react': resolve(projectDirectory, 'node_modules/lucide-react'),
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5174,
        fs: {
            allow: [resolve(projectDirectory, '..')],
        },
        watch: {
            ignored: ['**/.chrome-profile/**', '**/.edge-profile/**'],
        },
    },
});
