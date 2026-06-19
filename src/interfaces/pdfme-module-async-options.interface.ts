import type { ModuleMetadata, Provider, Type } from '@nestjs/common';
import type { PdfmeModuleOptions } from './pdfme-module-options.interface';
import type { PdfmeOptionsFactory } from './pdfme-options-factory.interface';

export interface PdfmeModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Instantiate the given class to resolve module options.
   * The class is registered inside this dynamic module's scope — not shared
   * with the rest of the application. Use `useExisting` to reuse a provider
   * already registered in an imported module.
   */
  useClass?: Type<PdfmeOptionsFactory>;

  /**
   * Reuse an already-registered provider that implements PdfmeOptionsFactory.
   * The provider must be exported from one of the modules listed in `imports`.
   */
  useExisting?: Type<PdfmeOptionsFactory>;

  /**
   * A factory function (optionally async) that receives injected dependencies
   * and returns PdfmeModuleOptions.
   */
  useFactory?: (...args: any[]) => Promise<PdfmeModuleOptions> | PdfmeModuleOptions;

  /**
   * Tokens to inject into `useFactory` or `useClass` constructor.
   */
  inject?: any[];

  /**
   * Additional providers scoped to this dynamic module.
   * Useful for providing helper services needed by `useFactory` that are not
   * worth exporting to the broader application.
   */
  extraProviders?: Provider[];
}
