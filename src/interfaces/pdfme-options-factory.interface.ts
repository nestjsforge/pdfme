import type { PdfmeModuleOptions } from './pdfme-module-options.interface';

export interface PdfmeOptionsFactory {
  createPdfmeOptions(): Promise<PdfmeModuleOptions> | PdfmeModuleOptions;
}
