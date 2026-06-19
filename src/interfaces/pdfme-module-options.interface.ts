import type { Font, Plugin, Schema } from '@pdfme/common';
import type { PdfmeLoggingOptions } from './pdfme-logging-options.interface';

export interface PdfmeModuleOptions {
  /**
   * Global font map available to all generate() calls.
   * At least one font should have `fallback: true`.
   * Fonts are expensive to load — prefer forRootAsync with useFactory
   * for async sources (S3, database, filesystem).
   *
   * @see https://pdfme.com/docs/fonts
   */
  font?: Font;

  /**
   * Global plugins registered for all templates.
   * Per-call plugins (passed in GenerateParams) are merged on top;
   * local plugins take precedence over global ones.
   *
   * @see https://pdfme.com/docs/custom-plugins
   */
  plugins?: Record<string, Plugin<Schema>>;

  /**
   * Control library logging behavior.
   * Does not affect application-level logging — use your app's LogLevel for that.
   */
  logging?: PdfmeLoggingOptions;

  /**
   * Enable extra template and schema validation on each generate() call.
   * Useful during development; avoid in production due to performance overhead.
   * @default false
   */
  debug?: boolean;
}
