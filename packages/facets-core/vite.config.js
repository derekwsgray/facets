import { resolve } from 'path';
import { defineConfig } from 'vite';
import litCss from 'vite-plugin-lit-css';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            include: ['src/**/*'],
            rollupTypes: true,
        }),
        litCss(),
    ],
    build: {
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'FacetsCore',
            // the proper extensions will be added

            fileName: 'index',
            formats: ['es', 'cjs', 'umd'],
        },
    },
});
