import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { PdfmeModule } from '../../src/pdfme.module';
import { PdfmeService } from '../../src/services/pdfme.service';
import { PDFME_MODULE_OPTIONS } from '../../src/constants/pdfme.constants';
import type { PdfmeModuleOptions } from '../../src/interfaces/pdfme-module-options.interface';
import type { PdfmeOptionsFactory } from '../../src/interfaces/pdfme-options-factory.interface';
import { PdfmeConfigurationException } from '../../src/exceptions/pdfme.exception';
import { createAsyncOptionsProvider } from '../../src/providers/pdfme-options.provider';

jest.mock('@pdfme/generator', () => ({ generate: jest.fn() }));

// ---------------------------------------------------------------------------
// Factory class for useClass / useExisting tests
// ---------------------------------------------------------------------------
@Injectable()
class TestPdfmeConfigService implements PdfmeOptionsFactory {
  createPdfmeOptions(): PdfmeModuleOptions {
    return { debug: true };
  }
}

// ---------------------------------------------------------------------------
// forRoot
// ---------------------------------------------------------------------------
describe('PdfmeModule.forRoot()', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PdfmeModule.forRoot({ debug: false })],
    }).compile();
  });

  afterEach(() => module.close());

  it('provides PdfmeService', () => {
    const service = module.get(PdfmeService);
    expect(service).toBeInstanceOf(PdfmeService);
  });

  it('injects correct options', () => {
    const options = module.get<PdfmeModuleOptions>(PDFME_MODULE_OPTIONS);
    expect(options).toEqual({ debug: false });
  });

  it('works with no options (defaults)', async () => {
    const emptyModule = await Test.createTestingModule({
      imports: [PdfmeModule.forRoot()],
    }).compile();

    const service = emptyModule.get(PdfmeService);
    expect(service).toBeInstanceOf(PdfmeService);
    await emptyModule.close();
  });
});

// ---------------------------------------------------------------------------
// forRootAsync — useFactory
// ---------------------------------------------------------------------------
describe('PdfmeModule.forRootAsync() — useFactory', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        PdfmeModule.forRootAsync({
          useFactory: (): PdfmeModuleOptions => ({ debug: true }),
        }),
      ],
    }).compile();
  });

  afterEach(() => module.close());

  it('provides PdfmeService', () => {
    expect(module.get(PdfmeService)).toBeInstanceOf(PdfmeService);
  });

  it('resolves options from factory', () => {
    const options = module.get<PdfmeModuleOptions>(PDFME_MODULE_OPTIONS);
    expect(options.debug).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// forRootAsync — async useFactory
// ---------------------------------------------------------------------------
describe('PdfmeModule.forRootAsync() — async useFactory', () => {
  it('resolves async factory', async () => {
    const module = await Test.createTestingModule({
      imports: [
        PdfmeModule.forRootAsync({
          useFactory: async (): Promise<PdfmeModuleOptions> => {
            await Promise.resolve(); // simulates async work (e.g., S3 font load)
            return { debug: false };
          },
        }),
      ],
    }).compile();

    const options = module.get<PdfmeModuleOptions>(PDFME_MODULE_OPTIONS);
    expect(options.debug).toBe(false);
    await module.close();
  });
});

// ---------------------------------------------------------------------------
// forRootAsync — useClass
// ---------------------------------------------------------------------------
describe('PdfmeModule.forRootAsync() — useClass', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PdfmeModule.forRootAsync({ useClass: TestPdfmeConfigService })],
    }).compile();
  });

  afterEach(() => module.close());

  it('provides PdfmeService', () => {
    expect(module.get(PdfmeService)).toBeInstanceOf(PdfmeService);
  });

  it('resolves options via class factory', () => {
    const options = module.get<PdfmeModuleOptions>(PDFME_MODULE_OPTIONS);
    expect(options.debug).toBe(true);
  });

  it('registers the class as a scoped provider', () => {
    // TestPdfmeConfigService must be resolvable inside the module
    const factory = module.get(TestPdfmeConfigService);
    expect(factory).toBeInstanceOf(TestPdfmeConfigService);
  });
});

// ---------------------------------------------------------------------------
// forRootAsync — useExisting
// ---------------------------------------------------------------------------
describe('PdfmeModule.forRootAsync() — useExisting', () => {
  it('reuses an already-registered provider', async () => {
    const module = await Test.createTestingModule({
      imports: [
        PdfmeModule.forRootAsync({
          useExisting: TestPdfmeConfigService,
          extraProviders: [TestPdfmeConfigService],
        }),
      ],
    }).compile();

    const options = module.get<PdfmeModuleOptions>(PDFME_MODULE_OPTIONS);
    expect(options.debug).toBe(true);
    await module.close();
  });
});

// ---------------------------------------------------------------------------
// createAsyncOptionsProvider — guard
// ---------------------------------------------------------------------------
describe('createAsyncOptionsProvider()', () => {
  it('throws PdfmeConfigurationException when no strategy is provided', () => {
    expect(() => createAsyncOptionsProvider({})).toThrow(PdfmeConfigurationException);
  });
});
