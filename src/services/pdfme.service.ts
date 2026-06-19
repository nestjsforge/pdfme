import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { generate } from '@pdfme/generator';
import type { Font, Plugin, Schema, Template } from '@pdfme/common';
import { PDFME_MODULE_OPTIONS } from '../constants/pdfme.constants';
import type { PdfmeModuleOptions } from '../interfaces/pdfme-module-options.interface';
import type { GenerateParams } from '../interfaces/generate-params.interface';
import type { ValidationResult } from '../interfaces/validation-result.interface';
import {
  PdfmeErrorCode,
  PdfmeGenerationException,
  PdfmeTemplateException,
} from '../exceptions/pdfme.exception';
import { mergeFonts, mergePlugins, isTemplateError } from '../utils';

@Injectable()
export class PdfmeService implements OnModuleInit {
  private readonly logger = new Logger(PdfmeService.name);

  private globalFont: Font = {};
  private globalPlugins: Record<string, Plugin<Schema>> = {};

  constructor(
    @Inject(PDFME_MODULE_OPTIONS)
    private readonly options: PdfmeModuleOptions,
  ) {}

  onModuleInit(): void {
    this.globalFont = this.options.font ?? {};
    this.globalPlugins = this.options.plugins ?? {};

    if (this.options.logging?.logInit !== false) {
      this.logger.log(
        `Initialized — fonts: ${Object.keys(this.globalFont).length}, ` +
          `plugins: ${Object.keys(this.globalPlugins).length}`,
      );
    }

    if (this.options.debug && Object.keys(this.globalPlugins).length === 0) {
      this.logger.warn(
        'No plugins registered globally. Templates requiring typed schemas (text, image, etc.) ' +
          'will fail unless plugins are passed per generate() call.',
      );
    }
  }

  /**
   * Generate a PDF from a PDFMe template and input records.
   * Returns a Uint8Array — use generateToBuffer() if you need a Node.js Buffer.
   *
   * Global fonts and plugins are merged with per-call overrides;
   * per-call values take precedence.
   */
  async generate(params: GenerateParams): Promise<Uint8Array> {
    const mergedFont = mergeFonts(this.globalFont, params.font);
    const mergedPlugins = mergePlugins(this.globalPlugins, params.plugins);

    if (this.options.logging?.logGenerate) {
      this.logger.debug(
        `generate() — inputs: ${params.inputs.length}, ` +
          `schemas: ${params.template.schemas.length}`,
      );
    }

    try {
      return await generate({
        template: params.template,
        inputs: params.inputs,
        options: Object.keys(mergedFont).length > 0 ? { font: mergedFont } : undefined,
        plugins: Object.keys(mergedPlugins).length > 0 ? mergedPlugins : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`PDF generation failed: ${message}`, stack);

      if (error instanceof Error && isTemplateError(error)) {
        throw new PdfmeTemplateException(
          `Invalid template or schema: ${message}`,
          error,
        );
      }

      throw new PdfmeGenerationException(
        `PDF generation failed: ${message}`,
        error,
      );
    }
  }

  /**
   * Convenience wrapper — returns a Node.js Buffer instead of Uint8Array.
   * Buffer.from(Uint8Array) is zero-copy in Node.js.
   */
  async generateToBuffer(params: GenerateParams): Promise<Buffer> {
    const uint8Array = await this.generate(params);
    return Buffer.from(uint8Array);
  }

  /**
   * Validate a template structure without generating a PDF.
   * Returns a ValidationResult — does not throw.
   * Use this in validation pipes or preview endpoints.
   */
  validateTemplate(template: Template): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    if (!template.basePdf) {
      errors.push({
        path: 'basePdf',
        message: 'basePdf is required',
        code: PdfmeErrorCode.TEMPLATE_INVALID,
      });
    }

    if (!Array.isArray(template.schemas) || template.schemas.length === 0) {
      errors.push({
        path: 'schemas',
        message: 'schemas must be a non-empty array',
        code: PdfmeErrorCode.TEMPLATE_INVALID,
      });
    } else {
      template.schemas.forEach((pageSchemas, pageIndex) => {
        Object.entries(pageSchemas).forEach(([fieldName, schema]) => {
          if (!schema.type) {
            errors.push({
              path: `schemas[${pageIndex}].${fieldName}.type`,
              message: `Schema field '${fieldName}' is missing required property 'type'`,
              code: PdfmeErrorCode.TEMPLATE_INVALID,
            });
          }

          const registeredTypes = Object.keys(this.globalPlugins);
          if (
            schema.type &&
            registeredTypes.length > 0 &&
            !registeredTypes.includes(schema.type)
          ) {
            errors.push({
              path: `schemas[${pageIndex}].${fieldName}.type`,
              message: `Schema type '${schema.type}' has no registered plugin`,
              code: PdfmeErrorCode.PLUGIN_NOT_REGISTERED,
            });
          }
        });
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Returns a shallow copy of globally registered plugins.
   * Useful for introspection and admin endpoints.
   */
  getRegisteredPlugins(): Record<string, Plugin<Schema>> {
    return { ...this.globalPlugins };
  }

  /**
   * Returns a shallow copy of globally registered fonts.
   * Useful for validating that a required font is available before generate().
   */
  getRegisteredFonts(): Font {
    return { ...this.globalFont };
  }
}
