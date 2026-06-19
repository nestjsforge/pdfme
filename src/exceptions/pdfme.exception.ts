export enum PdfmeErrorCode {
  CONFIGURATION_INVALID = 'PDFME_CONFIGURATION_INVALID',
  TEMPLATE_INVALID      = 'PDFME_TEMPLATE_INVALID',
  GENERATION_FAILED     = 'PDFME_GENERATION_FAILED',
  FONT_NOT_FOUND        = 'PDFME_FONT_NOT_FOUND',
  PLUGIN_NOT_REGISTERED = 'PDFME_PLUGIN_NOT_REGISTERED',
}

export class PdfmeException extends Error {
  constructor(
    message: string,
    public readonly code: PdfmeErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class PdfmeConfigurationException extends PdfmeException {
  constructor(message: string, cause?: unknown) {
    super(message, PdfmeErrorCode.CONFIGURATION_INVALID, cause);
  }
}

export class PdfmeTemplateException extends PdfmeException {
  constructor(message: string, cause?: unknown) {
    super(message, PdfmeErrorCode.TEMPLATE_INVALID, cause);
  }
}

export class PdfmeGenerationException extends PdfmeException {
  constructor(message: string, cause?: unknown) {
    super(message, PdfmeErrorCode.GENERATION_FAILED, cause);
  }
}

export class PdfmeFontException extends PdfmeException {
  constructor(message: string, cause?: unknown) {
    super(message, PdfmeErrorCode.FONT_NOT_FOUND, cause);
  }
}
