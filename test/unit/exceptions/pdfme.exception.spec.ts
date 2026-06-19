import {
  PdfmeErrorCode,
  PdfmeException,
  PdfmeConfigurationException,
  PdfmeTemplateException,
  PdfmeGenerationException,
  PdfmeFontException,
} from '../../../src/exceptions/pdfme.exception';

describe('PdfmeException hierarchy', () => {
  it('PdfmeConfigurationException extends PdfmeException', () => {
    const err = new PdfmeConfigurationException('bad config');
    expect(err).toBeInstanceOf(PdfmeException);
    expect(err.code).toBe(PdfmeErrorCode.CONFIGURATION_INVALID);
    expect(err.name).toBe('PdfmeConfigurationException');
    expect(err.message).toBe('bad config');
  });

  it('PdfmeTemplateException has correct code', () => {
    const err = new PdfmeTemplateException('bad template');
    expect(err.code).toBe(PdfmeErrorCode.TEMPLATE_INVALID);
  });

  it('PdfmeGenerationException has correct code', () => {
    const err = new PdfmeGenerationException('generation failed');
    expect(err.code).toBe(PdfmeErrorCode.GENERATION_FAILED);
  });

  it('PdfmeFontException has correct code', () => {
    const err = new PdfmeFontException('font missing');
    expect(err.code).toBe(PdfmeErrorCode.FONT_NOT_FOUND);
  });

  it('preserves cause stack when cause is an Error', () => {
    const cause = new Error('root cause');
    const err = new PdfmeGenerationException('wrapper', cause);
    expect(err.stack).toContain('Caused by:');
    expect(err.cause).toBe(cause);
  });

  it('accepts non-Error cause without throwing', () => {
    const err = new PdfmeGenerationException('wrapper', 'string cause');
    expect(err.cause).toBe('string cause');
    expect(err.stack).not.toContain('Caused by:');
  });
});
