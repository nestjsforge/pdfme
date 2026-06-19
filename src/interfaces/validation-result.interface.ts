import type { PdfmeErrorCode } from '../exceptions/pdfme.exception';

export interface ValidationError {
  /** JSONPath-style location of the offending field (e.g., 'schemas[0].name'). */
  path: string;
  message: string;
  code: PdfmeErrorCode;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
