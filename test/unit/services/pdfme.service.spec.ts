import { Logger } from '@nestjs/common';
import { PdfmeService } from '../../../src/services/pdfme.service';
import {
  PdfmeGenerationException,
  PdfmeTemplateException,
} from '../../../src/exceptions/pdfme.exception';
import type { GenerateParams } from '../../../src/interfaces/generate-params.interface';
import type { Template } from '@pdfme/common';

// Mock the entire @pdfme/generator module
jest.mock('@pdfme/generator', () => ({
  generate: jest.fn(),
}));

// Import AFTER mock to get the mocked version
import { generate } from '@pdfme/generator';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;

const makeTemplate = (overrides: Partial<Template> = {}): Template =>
  ({
    basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] },
    schemas: [{ field1: { type: 'text', position: { x: 0, y: 0 }, width: 50, height: 10 } }],
    ...overrides,
  }) as unknown as Template;

const baseParams: GenerateParams = {
  template: makeTemplate(),
  inputs: [{ field1: 'hello' }],
};

describe('PdfmeService', () => {
  let service: PdfmeService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    service = new PdfmeService({});
    service.onModuleInit();
    mockGenerate.mockResolvedValue(new Uint8Array([37, 80, 68, 70])); // %PDF
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockGenerate.mockReset();
  });

  describe('onModuleInit', () => {
    it('sets globalFont and globalPlugins from options', () => {
      const font = { Arial: { data: new Uint8Array([1]), fallback: true } };
      const svc = new PdfmeService({ font });
      svc.onModuleInit();
      expect(svc.getRegisteredFonts()).toEqual(font);
    });

    it('defaults to empty collections when options have no font/plugins', () => {
      const svc = new PdfmeService({});
      svc.onModuleInit();
      expect(svc.getRegisteredFonts()).toEqual({});
      expect(svc.getRegisteredPlugins()).toEqual({});
    });
  });

  describe('generate()', () => {
    it('delegates to @pdfme/generator generate()', async () => {
      await service.generate(baseParams);
      expect(mockGenerate).toHaveBeenCalledTimes(1);
    });

    it('returns Uint8Array from PDFMe', async () => {
      const result = await service.generate(baseParams);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('passes template and inputs to PDFMe', async () => {
      await service.generate(baseParams);
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          template: baseParams.template,
          inputs: baseParams.inputs,
        }),
      );
    });

    it('merges global plugins with local — local takes precedence', async () => {
      const globalPlugin = { id: 'global' } as any;
      const localPlugin = { id: 'local' } as any;

      const svc = new PdfmeService({ plugins: { text: globalPlugin } });
      svc.onModuleInit();

      await svc.generate({ ...baseParams, plugins: { text: localPlugin } });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({ plugins: { text: localPlugin } }),
      );
    });

    it('omits options.font when no fonts are registered', async () => {
      await service.generate(baseParams);
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({ options: undefined }),
      );
    });

    it('includes options.font when fonts are registered', async () => {
      const font = { Arial: { data: new Uint8Array([1]), fallback: true } };
      const svc = new PdfmeService({ font });
      svc.onModuleInit();

      await svc.generate(baseParams);

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({ options: { font } }),
      );
    });

    it('throws PdfmeTemplateException when PDFMe throws a template-related error', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('Invalid template structure'));
      await expect(service.generate(baseParams)).rejects.toBeInstanceOf(
        PdfmeTemplateException,
      );
    });

    it('throws PdfmeGenerationException for non-template errors', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('Out of memory'));
      await expect(service.generate(baseParams)).rejects.toBeInstanceOf(
        PdfmeGenerationException,
      );
    });

    it('throws PdfmeGenerationException when PDFMe throws a non-Error', async () => {
      mockGenerate.mockRejectedValueOnce('string error');
      await expect(service.generate(baseParams)).rejects.toBeInstanceOf(
        PdfmeGenerationException,
      );
    });
  });

  describe('generateToBuffer()', () => {
    it('returns a Buffer', async () => {
      const result = await service.generateToBuffer(baseParams);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('Buffer contains same bytes as Uint8Array', async () => {
      const uint8 = new Uint8Array([37, 80, 68, 70]);
      mockGenerate.mockResolvedValueOnce(uint8);
      const buffer = await service.generateToBuffer(baseParams);
      expect(Array.from(buffer)).toEqual(Array.from(uint8));
    });
  });

  describe('validateTemplate()', () => {
    it('returns valid: true for a well-formed template', () => {
      const result = service.validateTemplate(makeTemplate());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when basePdf is missing', () => {
      const template = makeTemplate({ basePdf: undefined as any });
      const result = service.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'basePdf')).toBe(true);
    });

    it('returns error when schemas is empty', () => {
      const template = makeTemplate({ schemas: [] });
      const result = service.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'schemas')).toBe(true);
    });

    it('flags schema field missing type', () => {
      const schemas = [Object.assign(Object.create(null), {
        badField: { position: { x: 0, y: 0 }, width: 10, height: 10 },
      })] as any;
      const template = makeTemplate({ schemas });
      const result = service.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('badField'))).toBe(true);
    });

    it('flags unregistered plugin type when global plugins are set', () => {
      const svc = new PdfmeService({
        plugins: { text: {} as any },
      });
      svc.onModuleInit();

      const schemas = [Object.assign(Object.create(null), {
        field: { type: 'unknownPlugin', position: { x: 0, y: 0 }, width: 10, height: 10 },
      })] as any;
      const template = makeTemplate({ schemas });
      const result = svc.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('field'))).toBe(true);
    });

    it('does not flag unregistered type when no global plugins are registered', () => {
      const schemas = [Object.assign(Object.create(null), {
        field: { type: 'anyPlugin', position: { x: 0, y: 0 }, width: 10, height: 10 },
      })] as any;
      const template = makeTemplate({ schemas });
      // service has no plugins — validation skips plugin-type check
      const result = service.validateTemplate(template);
      expect(result.valid).toBe(true);
    });
  });

  describe('getRegisteredPlugins()', () => {
    it('returns shallow copy — mutations do not affect internal state', () => {
      const plugin = {} as any;
      const svc = new PdfmeService({ plugins: { text: plugin } });
      svc.onModuleInit();

      const copy = svc.getRegisteredPlugins();
      copy['injected'] = {} as any;

      expect(svc.getRegisteredPlugins()).not.toHaveProperty('injected');
    });
  });

  describe('getRegisteredFonts()', () => {
    it('returns shallow copy — mutations do not affect internal state', () => {
      const font = { Arial: { data: new Uint8Array([1]), fallback: true } };
      const svc = new PdfmeService({ font });
      svc.onModuleInit();

      const copy = svc.getRegisteredFonts();
      copy['Injected'] = { data: new Uint8Array([2]), fallback: false };

      expect(svc.getRegisteredFonts()).not.toHaveProperty('Injected');
    });
  });
});
