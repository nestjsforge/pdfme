import type { Config } from 'jest';

/**
 * E2E tests use @swc/jest instead of ts-jest.
 * @pdfme and its entire dependency tree are ESM-only. @swc/jest handles
 * ESM→CJS transpilation transparently, including transitive deps, without
 * requiring an explicit allowlist.
 */
const config: Config = {
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j|mj)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          target: 'es2021',
          keepClassNames: true,
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  transformIgnorePatterns: [],
  testEnvironment: 'node',
  testTimeout: 60000,
};

export default config;
