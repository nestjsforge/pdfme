import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@pdfme/common',
    '@pdfme/generator',
    '@pdfme/schemas',
    'reflect-metadata',
    'rxjs',
  ],
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
