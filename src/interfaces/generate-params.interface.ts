import type { Font, Plugin, Schema, Template } from '@pdfme/common';

export interface GenerateParams {
  /**
   * PDFMe template containing basePdf and schemas.
   */
  template: Template;

  /**
   * Array of input records. Each element corresponds to one instance rendered
   * against the template schemas. The keys must match schema field names.
   */
  inputs: Record<string, string>[];

  /**
   * Additional fonts for this specific call.
   * Merged with global fonts; local entries take precedence.
   */
  font?: Font;

  /**
   * Additional plugins for this specific call.
   * Merged with global plugins; local entries take precedence.
   */
  plugins?: Record<string, Plugin<Schema>>;
}
