/**
 * PDFMe v6 does not expose typed errors. We infer error category from the
 * message string. This list is tested against PDFMe 6.1.x error output —
 * update when upgrading PDFMe majors.
 */
const TEMPLATE_ERROR_PATTERNS = [
  /template/i,
  /schema/i,
  /basepdf/i,
  /field.*not.*found/i,
] as const;

export function isTemplateError(error: Error): boolean {
  return TEMPLATE_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
}
