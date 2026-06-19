import { isTemplateError } from '../../../src/utils/classify-error.util';

describe('isTemplateError', () => {
  it.each([
    ['Invalid template provided'],
    ['schema validation failed'],
    ['basePdf is missing'],
    ['field "name" not found in schema'],
    ['TEMPLATE is not valid'],
    ['Schema[0] is invalid'],
  ])('returns true for message: %s', (message) => {
    expect(isTemplateError(new Error(message))).toBe(true);
  });

  it.each([
    ['Out of memory'],
    ['Cannot read property of undefined'],
    ['Network timeout'],
    ['font data is corrupt'],
  ])('returns false for message: %s', (message) => {
    expect(isTemplateError(new Error(message))).toBe(false);
  });
});
