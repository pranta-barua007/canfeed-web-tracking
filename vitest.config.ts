/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.ts'],
        globals: true,
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        // Mirroring official example structure but keeping centralized path
        include: ['src/__tests__/features/**/*.{test,spec}.{ts,tsx}'],
    },
});
