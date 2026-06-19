import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PdfmeService } from './services/pdfme.service';
import { PDFME_MODULE_OPTIONS } from './constants/pdfme.constants';
import { createAsyncOptionsProvider } from './providers/pdfme-options.provider';
import type { PdfmeModuleOptions } from './interfaces/pdfme-module-options.interface';
import type { PdfmeModuleAsyncOptions } from './interfaces/pdfme-module-async-options.interface';

@Module({})
export class PdfmeModule {
  /**
   * Register PdfmeModule with synchronous configuration.
   * Use when all options (fonts, plugins) are available at module load time.
   *
   * @example
   * PdfmeModule.forRoot({ font: { myFont: { data: fontBuffer, fallback: true } } })
   */
  static forRoot(options: PdfmeModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: PDFME_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: PdfmeModule,
      providers: [optionsProvider, PdfmeService],
      exports: [PdfmeService],
    };
  }

  /**
   * Register PdfmeModule with asynchronous configuration.
   * Supports useFactory, useClass, and useExisting patterns.
   *
   * @example
   * PdfmeModule.forRootAsync({
   *   imports: [ConfigModule],
   *   useFactory: async (config: ConfigService) => ({
   *     font: await loadFonts(config.get('FONTS_DIR')),
   *   }),
   *   inject: [ConfigService],
   * })
   */
  static forRootAsync(asyncOptions: PdfmeModuleAsyncOptions): DynamicModule {
    const optionsProvider = createAsyncOptionsProvider(asyncOptions);

    const classProvider: Provider[] = asyncOptions.useClass
      ? [{ provide: asyncOptions.useClass, useClass: asyncOptions.useClass }]
      : [];

    return {
      module: PdfmeModule,
      imports: asyncOptions.imports ?? [],
      providers: [
        optionsProvider,
        ...classProvider,
        ...(asyncOptions.extraProviders ?? []),
        PdfmeService,
      ],
      exports: [PdfmeService],
    };
  }
}
