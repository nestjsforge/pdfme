// Module
export { PdfmeModule } from './pdfme.module';

// Service
export { PdfmeService } from './services/pdfme.service';

// Interfaces
export type { PdfmeLoggingOptions } from './interfaces/pdfme-logging-options.interface';
export type { PdfmeModuleOptions } from './interfaces/pdfme-module-options.interface';
export type { PdfmeOptionsFactory } from './interfaces/pdfme-options-factory.interface';
export type { PdfmeModuleAsyncOptions } from './interfaces/pdfme-module-async-options.interface';
export type { GenerateParams } from './interfaces/generate-params.interface';
export type { ValidationResult, ValidationError } from './interfaces/validation-result.interface';

// Exceptions
export {
  PdfmeErrorCode,
  PdfmeException,
  PdfmeConfigurationException,
  PdfmeTemplateException,
  PdfmeGenerationException,
  PdfmeFontException,
} from './exceptions/pdfme.exception';

// Decorators
export { InjectPdfmeOptions } from './decorators/inject-pdfme-options.decorator';

// Constants (for consumers that need direct token access)
export { PDFME_MODULE_OPTIONS } from './constants/pdfme.constants';

// Re-exports from PDFMe for consumer convenience — no need to install @pdfme/common directly
export type { Template, Schema, Font, Plugin } from '@pdfme/common';
