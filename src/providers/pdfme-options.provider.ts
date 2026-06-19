import type { Provider } from '@nestjs/common';
import { PDFME_MODULE_OPTIONS } from '../constants/pdfme.constants';
import type { PdfmeModuleAsyncOptions } from '../interfaces/pdfme-module-async-options.interface';
import type { PdfmeOptionsFactory } from '../interfaces/pdfme-options-factory.interface';
import { PdfmeConfigurationException } from '../exceptions/pdfme.exception';

export function createAsyncOptionsProvider(asyncOptions: PdfmeModuleAsyncOptions): Provider {
  if (asyncOptions.useFactory) {
    return {
      provide: PDFME_MODULE_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: asyncOptions.inject ?? [],
    };
  }

  const inject = asyncOptions.useClass ?? asyncOptions.useExisting;

  if (!inject) {
    throw new PdfmeConfigurationException(
      'PdfmeModule.forRootAsync() requires one of: useFactory, useClass, or useExisting.',
    );
  }

  return {
    provide: PDFME_MODULE_OPTIONS,
    useFactory: async (factory: PdfmeOptionsFactory) => factory.createPdfmeOptions(),
    inject: [inject],
  };
}
