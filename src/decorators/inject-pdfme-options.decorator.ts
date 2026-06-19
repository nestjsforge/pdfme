import { Inject } from '@nestjs/common';
import { PDFME_MODULE_OPTIONS } from '../constants/pdfme.constants';

/**
 * Shorthand for @Inject(PDFME_MODULE_OPTIONS).
 * Use in classes that need to access the raw module configuration.
 */
export const InjectPdfmeOptions = (): ParameterDecorator => Inject(PDFME_MODULE_OPTIONS);
