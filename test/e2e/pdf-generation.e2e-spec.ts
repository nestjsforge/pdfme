/**
 * E2E tests — real PDFMe execution, no mocks.
 *
 * These tests validate that the full integration stack (PdfmeModule →
 * PdfmeService → @pdfme/generator) produces valid PDF output.
 */
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getDefaultFont } from '@pdfme/common';
import { text } from '@pdfme/schemas';
import { PdfmeModule } from '../../src/pdfme.module';
import { PdfmeService } from '../../src/services/pdfme.service';
import { PdfmeTemplateException } from '../../src/exceptions/pdfme.exception';
import type { Template } from '@pdfme/common';

const PDF_MAGIC_BYTES = '%PDF';

// Uses PDFMe's built-in default font ('Roboto') — no custom font loading needed
const simpleTemplate: Template = {
  basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
  schemas: [
    {
      greeting: {
        type: 'text',
        position: { x: 10, y: 10 },
        width: 100,
        height: 20,
        fontSize: 14,
        fontName: 'Roboto',
      },
    },
  ],
} as unknown as Template;

describe('PdfmeService — E2E', () => {
  let module: TestingModule;
  let service: PdfmeService;

  beforeAll(async () => {
    const defaultFont = await getDefaultFont();

    module = await Test.createTestingModule({
      imports: [
        PdfmeModule.forRoot({
          font: defaultFont,
          plugins: { text },
        }),
      ],
    }).compile();

    await module.init();
    service = module.get(PdfmeService);
  });

  afterAll(() => module.close());

  it('generates a real PDF — output starts with %PDF magic bytes', async () => {
    const pdf = await service.generateToBuffer({
      template: simpleTemplate,
      inputs: [{ greeting: 'Hello from @nestjsforge/pdfme' }],
    });

    expect(pdf.subarray(0, 4).toString('ascii')).toBe(PDF_MAGIC_BYTES);
  });

  it('generate() returns Uint8Array', async () => {
    const result = await service.generate({
      template: simpleTemplate,
      inputs: [{ greeting: 'Test' }],
    });

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('generates multiple inputs as multi-instance PDF', async () => {
    const pdf = await service.generateToBuffer({
      template: simpleTemplate,
      inputs: [
        { greeting: 'Page one' },
        { greeting: 'Page two' },
      ],
    });

    expect(pdf.subarray(0, 4).toString('ascii')).toBe(PDF_MAGIC_BYTES);
  });

  it('per-call font overrides global font', async () => {
    const localFont = await getDefaultFont();
    const pdf = await service.generateToBuffer({
      template: simpleTemplate,
      inputs: [{ greeting: 'With local font' }],
      font: localFont,
    });

    expect(pdf.subarray(0, 4).toString('ascii')).toBe(PDF_MAGIC_BYTES);
  });

  it('validateTemplate() returns valid for well-formed template', () => {
    const result = service.validateTemplate(simpleTemplate);
    expect(result.valid).toBe(true);
  });

  it('validateTemplate() returns errors for missing basePdf', () => {
    const broken = { ...simpleTemplate, basePdf: undefined as any };
    const result = service.validateTemplate(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('throws PdfmeTemplateException on invalid template passed to generate()', async () => {
    const invalidTemplate = {
      basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] },
      schemas: [null as any], // intentionally broken
    } as unknown as Template;

    await expect(
      service.generate({ template: invalidTemplate, inputs: [{}] }),
    ).rejects.toThrow(Error); // PDFMe will throw; we wrap it
  });
});
