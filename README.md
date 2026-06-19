<div align="center">
  <h1>@nestjsforge/pdfme</h1>
  <p>NestJS integration for <a href="https://pdfme.com">PDFMe</a> — generate and validate PDF templates as injectable services.</p>

![nestjsforge](https://i.imgur.com/mViyZWm.png)

  <p>
    <a href="https://www.npmjs.com/package/@nestjsforge/pdfme">
      <img src="https://img.shields.io/npm/v/@nestjsforge/pdfme.svg" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/@nestjsforge/pdfme">
      <img src="https://img.shields.io/npm/l/@nestjsforge/pdfme.svg" alt="license" />
    </a>
    <a href="https://www.npmjs.com/package/@nestjsforge/pdfme">
      <img src="https://img.shields.io/npm/dm/@nestjsforge/pdfme.svg" alt="downloads" />
    </a>
  </p>
</div>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [forRoot — Synchronous](#forroot--synchronous)
  - [forRootAsync — useFactory](#forrootasync--usefactory)
  - [forRootAsync — useClass](#forrootasync--useclass)
  - [forRootAsync — useExisting](#forrootasync--useexisting)
- [PdfmeService API](#pdfmeservice-api)
  - [generate()](#generate)
  - [generateToBuffer()](#generatetobuffer)
  - [validateTemplate()](#validatetemplate)
  - [getRegisteredPlugins()](#getregisteredplugins)
  - [getRegisteredFonts()](#getregisteredfonts)
- [Working with Fonts](#working-with-fonts)
- [Working with Plugins](#working-with-plugins)
- [Serving a PDF via HTTP](#serving-a-pdf-via-http)
- [Error Handling](#error-handling)
- [Configuration Reference](#configuration-reference)
- [Compatibility](#compatibility)
- [Testing Your Application](#testing-your-application)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Native NestJS DI** — inject `PdfmeService` anywhere in your application
- **`forRoot` / `forRootAsync`** — full support for `useFactory`, `useClass`, and `useExisting`
- **Global + per-call options** — register fonts and plugins globally, override per call
- **Typed exceptions** — `PdfmeTemplateException`, `PdfmeGenerationException`, and more
- **Zero boilerplate** — re-exports PDFMe types so you don't need to install `@pdfme/common` directly
- **Dual CJS/ESM build** — works in any Node.js module system

---

## Installation

```bash
npm install @nestjsforge/pdfme @pdfme/common @pdfme/generator
```

If you plan to use the built-in schema plugins (text, image, table, etc.):

```bash
npm install @pdfme/schemas
```

---

## Quick Start

### 1. Register the module

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { PdfmeModule } from "@nestjsforge/pdfme";
import { text, image } from "@pdfme/schemas";
import { readFileSync } from "fs";

@Module({
  imports: [
    PdfmeModule.forRoot({
      font: {
        Roboto: {
          data: readFileSync("./assets/fonts/Roboto-Regular.ttf"),
          fallback: true,
        },
      },
      plugins: { text, image },
    }),
  ],
})
export class AppModule {}
```

### 2. Inject the service

```typescript
// invoice.service.ts
import { Injectable } from "@nestjs/common";
import { PdfmeService } from "@nestjsforge/pdfme";
import type { Template } from "@nestjsforge/pdfme";

const invoiceTemplate: Template = {
  /* your template */
};

@Injectable()
export class InvoiceService {
  constructor(private readonly pdfme: PdfmeService) {}

  async generateInvoice(data: InvoiceData): Promise<Buffer> {
    return this.pdfme.generateToBuffer({
      template: invoiceTemplate,
      inputs: [
        {
          invoiceNumber: data.number,
          customerName: data.customer,
          total: String(data.total),
        },
      ],
    });
  }
}
```

### 3. Serve it from a controller

```typescript
// invoice.controller.ts
import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { InvoiceService } from "./invoice.service";

@Controller("invoices")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(":id/pdf")
  async download(@Param("id") id: string, @Res() res: Response) {
    const pdf = await this.invoiceService.generateInvoice(id);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
      "Content-Length": pdf.length,
    });

    res.send(pdf);
  }
}
```

---

## Configuration

### `forRoot` — Synchronous

Use `forRoot` when all options are available at module load time (e.g., fonts loaded from disk synchronously).

```typescript
PdfmeModule.forRoot({
  font: {
    Roboto: {
      data: readFileSync("./assets/fonts/Roboto-Regular.ttf"),
      fallback: true,
    },
  },
  plugins: { text, image },
  debug: false,
});
```

> **Note:** If you need to load fonts from a remote source (S3, database, external API), use `forRootAsync` instead — it supports async factories.

---

### `forRootAsync` — `useFactory`

The most common async pattern. The factory function can be async and receives injected dependencies.

```typescript
import { ConfigModule, ConfigService } from "@nestjs/config";
import { readFile } from "fs/promises";

PdfmeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (config: ConfigService) => {
    const fontPath = config.get<string>("FONT_PATH");
    return {
      font: {
        Roboto: {
          data: await readFile(fontPath),
          fallback: true,
        },
      },
      plugins: { text, image },
    };
  },
  inject: [ConfigService],
});
```

---

### `forRootAsync` — `useClass`

Use `useClass` when the configuration logic is complex enough to deserve its own class.
The class is instantiated inside the module's scope and is **not** shared with the rest of the application.

```typescript
// pdfme-config.service.ts
import { Injectable } from "@nestjs/common";
import { PdfmeOptionsFactory, PdfmeModuleOptions } from "@nestjsforge/pdfme";

@Injectable()
export class PdfmeConfigService implements PdfmeOptionsFactory {
  constructor(private readonly fontRepository: FontRepository) {}

  async createPdfmeOptions(): Promise<PdfmeModuleOptions> {
    const fonts = await this.fontRepository.findAll();
    return {
      font: buildFontMap(fonts),
      plugins: { text, image },
    };
  }
}

// app.module.ts
PdfmeModule.forRootAsync({
  useClass: PdfmeConfigService,
});
```

---

### `forRootAsync` — `useExisting`

Use `useExisting` when a class implementing `PdfmeOptionsFactory` is **already registered** in an imported module and you want to reuse its existing instance.

```typescript
// shared-config.module.ts
@Module({
  providers: [SharedPdfmeConfigService],
  exports: [SharedPdfmeConfigService],
})
export class SharedConfigModule {}

// app.module.ts
PdfmeModule.forRootAsync({
  imports: [SharedConfigModule],
  useExisting: SharedPdfmeConfigService,
});
```

> **`useClass` vs `useExisting`:** `useClass` creates a new instance scoped to `PdfmeModule`. `useExisting` reuses the instance already managed by the NestJS container — useful when your config service has its own dependencies you don't want duplicated.

---

## `PdfmeService` API

### `generate()`

```typescript
generate(params: GenerateParams): Promise<Uint8Array>
```

Generates a PDF and returns a `Uint8Array` (the raw output from PDFMe).

Global fonts and plugins registered in `forRoot` / `forRootAsync` are merged with any per-call overrides. **Per-call values take precedence over global ones.**

```typescript
const pdf = await this.pdfme.generate({
  template: myTemplate,
  inputs: [{ title: "Annual Report 2025", author: "Acme Corp" }],
});
```

---

### `generateToBuffer()`

```typescript
generateToBuffer(params: GenerateParams): Promise<Buffer>
```

Convenience wrapper that returns a Node.js `Buffer` instead of `Uint8Array`. Internally calls `generate()` — the conversion is zero-copy in Node.js.

Use this when you need to pass the result to APIs that expect a `Buffer` (e.g., `res.send()`, AWS SDK `PutObjectCommand`, Multer uploads).

```typescript
const buffer = await this.pdfme.generateToBuffer({
  template: reportTemplate,
  inputs: [{ quarter: "Q4", revenue: "$1.2M" }],
});

await s3Client.send(
  new PutObjectCommand({
    Bucket: "my-bucket",
    Key: `reports/q4-${year}.pdf`,
    Body: buffer,
    ContentType: "application/pdf",
  }),
);
```

---

### `validateTemplate()`

```typescript
validateTemplate(template: Template): ValidationResult
```

Validates a template's structure **without generating a PDF**. Returns a `ValidationResult` — never throws.

Use this in validation pipes, preview endpoints, or template upload flows.

```typescript
const result = this.pdfme.validateTemplate(uploadedTemplate);

if (!result.valid) {
  throw new BadRequestException({
    message: "Invalid template",
    errors: result.errors,
  });
}
```

**`ValidationResult` shape:**

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string; // e.g. 'schemas[0].title.type'
  message: string;
  code: PdfmeErrorCode;
}
```

**What is validated:**

- `basePdf` is present
- `schemas` is a non-empty array
- Each schema field has a `type` property
- If global plugins are registered, each schema `type` matches a registered plugin

> **Note:** `validateTemplate()` does not guarantee that `generate()` will succeed. It catches structural issues early, but runtime errors from PDFMe (e.g., font mismatches) are only detected during actual generation.

---

### `getRegisteredPlugins()`

```typescript
getRegisteredPlugins(): Record<string, Plugin<Schema>>
```

Returns a shallow copy of the globally registered plugins. Mutations to the returned object do not affect the internal state.

```typescript
const plugins = this.pdfme.getRegisteredPlugins();
console.log(Object.keys(plugins)); // ['text', 'image', 'qrCode']
```

---

### `getRegisteredFonts()`

```typescript
getRegisteredFonts(): Font
```

Returns a shallow copy of the globally registered font map.

```typescript
const fonts = this.pdfme.getRegisteredFonts();
const hasRoboto = "Roboto" in fonts;
```

---

## Working with Fonts

PDFMe requires at least one font with `fallback: true` to be registered when your templates reference font names.

### Loading from filesystem

```typescript
import { readFileSync } from "fs";

PdfmeModule.forRoot({
  font: {
    Roboto: {
      data: readFileSync("./assets/fonts/Roboto-Regular.ttf"),
      fallback: true,
    },
    RobotoBold: {
      data: readFileSync("./assets/fonts/Roboto-Bold.ttf"),
      fallback: false,
    },
  },
});
```

### Loading from S3 (async)

```typescript
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

PdfmeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (config: ConfigService) => {
    const s3 = new S3Client({ region: config.get("AWS_REGION") });
    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: config.get("ASSETS_BUCKET"),
        Key: "fonts/Roboto-Regular.ttf",
      }),
    );

    return {
      font: {
        Roboto: {
          data: await Body.transformToByteArray(),
          fallback: true,
        },
      },
    };
  },
  inject: [ConfigService],
});
```

### Using PDFMe's default font

For quick prototyping you can use PDFMe's built-in `Roboto` font without loading anything from disk:

```typescript
import { getDefaultFont } from "@pdfme/common";

PdfmeModule.forRootAsync({
  useFactory: async () => ({
    font: await getDefaultFont(),
    plugins: { text },
  }),
});
```

### Per-call font override

Fonts passed in `GenerateParams` are merged with global fonts. The per-call font takes precedence.

```typescript
await this.pdfme.generate({
  template: arabicTemplate,
  inputs: [{ content: "مرحبا" }],
  font: {
    Amiri: {
      data: await readFile("./assets/fonts/Amiri-Regular.ttf"),
      fallback: true,
    },
  },
});
```

---

## Working with Plugins

Plugins define how each schema field type is rendered in the PDF. Register them globally in `forRoot` / `forRootAsync`, or pass them per call.

### Registering built-in plugins

```typescript
import { text, image, tableBeta } from "@pdfme/schemas";

PdfmeModule.forRoot({
  plugins: { text, image, table: tableBeta },
});
```

### Registering a custom plugin

```typescript
import type { Plugin } from "@nestjsforge/pdfme";

interface QrCodeSchema {
  type: "qrCode";
  content: string;
  size: number;
}

const qrCodePlugin: Plugin<QrCodeSchema> = {
  pdf: async ({ schema, pdfDoc, pdfLib, page }) => {
    // render QR code into the PDF page
  },
  propPanel: {
    schema: {
      /* JSON schema for the designer panel */
    },
    defaultSchema: { type: "qrCode", content: "", size: 30 /* ... */ },
  },
  icon: "<svg>...</svg>",
};

PdfmeModule.forRoot({
  plugins: { text, image, qrCode: qrCodePlugin },
});
```

### Per-call plugin override

```typescript
await this.pdfme.generate({
  template: specialTemplate,
  inputs: [{ field: "value" }],
  plugins: {
    customField: specialPlugin, // added only for this call
  },
});
```

---

## Serving a PDF via HTTP

The library returns raw bytes — the HTTP layer is your application's responsibility.

### NestJS + Express

```typescript
@Get('report.pdf')
async downloadReport(@Res() res: Response) {
  const pdf = await this.reportService.generate();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="report.pdf"',
  });

  res.send(pdf);
}
```

### NestJS + Fastify

```typescript
@Get('report.pdf')
async downloadReport(@Res() reply: FastifyReply) {
  const pdf = await this.reportService.generate();

  reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', 'attachment; filename="report.pdf"')
    .send(pdf);
}
```

### Inline PDF (open in browser)

```typescript
res.set({
  "Content-Type": "application/pdf",
  "Content-Disposition": 'inline; filename="report.pdf"', // inline, not attachment
});
```

---

## Error Handling

The library wraps all PDFMe errors into typed exceptions so you can handle them precisely in your application.

### Exception hierarchy

```
PdfmeException                    ← base, never thrown directly
├── PdfmeConfigurationException   ← bad module setup (thrown at bootstrap)
├── PdfmeTemplateException        ← invalid template or schema structure
├── PdfmeGenerationException      ← runtime failure during PDF generation
└── PdfmeFontException            ← font not found or invalid
```

All exceptions expose:

| Property  | Type             | Description                                |
| --------- | ---------------- | ------------------------------------------ |
| `message` | `string`         | Human-readable description                 |
| `code`    | `PdfmeErrorCode` | Machine-readable error code                |
| `cause`   | `unknown`        | Original error from PDFMe (when available) |

### `PdfmeErrorCode` values

```typescript
enum PdfmeErrorCode {
  CONFIGURATION_INVALID = "PDFME_CONFIGURATION_INVALID",
  TEMPLATE_INVALID = "PDFME_TEMPLATE_INVALID",
  GENERATION_FAILED = "PDFME_GENERATION_FAILED",
  FONT_NOT_FOUND = "PDFME_FONT_NOT_FOUND",
  PLUGIN_NOT_REGISTERED = "PDFME_PLUGIN_NOT_REGISTERED",
}
```

### Catching exceptions in a service

```typescript
import {
  PdfmeService,
  PdfmeTemplateException,
  PdfmeGenerationException,
} from '@nestjsforge/pdfme';

async generate(): Promise<Buffer> {
  try {
    return await this.pdfme.generateToBuffer({ template, inputs });
  } catch (error) {
    if (error instanceof PdfmeTemplateException) {
      // The template is malformed — user-facing error, safe to expose
      throw new BadRequestException(`Template error: ${error.message}`);
    }
    if (error instanceof PdfmeGenerationException) {
      // Unexpected runtime failure — log and return 500
      this.logger.error('PDF generation failed', error.cause);
      throw new InternalServerErrorException('Could not generate PDF');
    }
    throw error;
  }
}
```

### Global exception filter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { PdfmeException } from "@nestjsforge/pdfme";

@Catch(PdfmeException)
export class PdfmeExceptionFilter implements ExceptionFilter {
  catch(exception: PdfmeException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(422).json({
      error: exception.code,
      message: exception.message,
    });
  }
}
```

---

## Configuration Reference

### `PdfmeModuleOptions`

| Option                | Type                             | Default | Description                                                        |
| --------------------- | -------------------------------- | ------- | ------------------------------------------------------------------ |
| `font`                | `Font`                           | `{}`    | Global font map. At least one font should have `fallback: true`.   |
| `plugins`             | `Record<string, Plugin<Schema>>` | `{}`    | Global plugin map. Schema types must match registered plugin keys. |
| `logging.logInit`     | `boolean`                        | `true`  | Log a summary on module initialization.                            |
| `logging.logGenerate` | `boolean`                        | `false` | Log each `generate()` call (debug level). Avoid in production.     |
| `debug`               | `boolean`                        | `false` | Warn when no plugins are registered. Avoid in production.          |

### `PdfmeModuleAsyncOptions`

| Option           | Type                                                             | Description                                    |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| `imports`        | `ModuleMetadata['imports']`                                      | Modules to import into the async context.      |
| `useFactory`     | `(...args) => PdfmeModuleOptions \| Promise<PdfmeModuleOptions>` | Factory function.                              |
| `inject`         | `any[]`                                                          | Tokens to inject into `useFactory`.            |
| `useClass`       | `Type<PdfmeOptionsFactory>`                                      | Class instantiated inside this module's scope. |
| `useExisting`    | `Type<PdfmeOptionsFactory>`                                      | Reuses an already-registered provider.         |
| `extraProviders` | `Provider[]`                                                     | Additional providers scoped to this module.    |

### `PdfmeOptionsFactory` interface

Implement this interface when using `useClass` or `useExisting`:

```typescript
import { PdfmeOptionsFactory, PdfmeModuleOptions } from "@nestjsforge/pdfme";

@Injectable()
export class MyPdfmeConfig implements PdfmeOptionsFactory {
  createPdfmeOptions(): PdfmeModuleOptions | Promise<PdfmeModuleOptions> {
    return { plugins: { text } };
  }
}
```

---

## Compatibility

| `@nestjsforge/pdfme` | NestJS                 | PDFMe    | Node.js |
| -------------------- | ---------------------- | -------- | ------- |
| `1.x`                | `^10.0.0 \|\| ^11.0.0` | `^6.0.0` | `>=18`  |

---

## Testing Your Application

### Mocking `PdfmeService` in unit tests

```typescript
import { Test } from "@nestjs/testing";
import { PdfmeService } from "@nestjsforge/pdfme";
import { InvoiceService } from "./invoice.service";

describe("InvoiceService", () => {
  let invoiceService: InvoiceService;
  let pdfmeService: jest.Mocked<PdfmeService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: PdfmeService,
          useValue: {
            generateToBuffer: jest
              .fn()
              .mockResolvedValue(Buffer.from("%PDF-fake")),
          },
        },
      ],
    }).compile();

    invoiceService = module.get(InvoiceService);
    pdfmeService = module.get(PdfmeService);
  });

  it("calls generateToBuffer with correct inputs", async () => {
    await invoiceService.generateInvoice({
      number: "INV-001",
      customer: "Acme",
      total: 100,
    });

    expect(pdfmeService.generateToBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: [expect.objectContaining({ invoiceNumber: "INV-001" })],
      }),
    );
  });
});
```

### Integration tests with real `PdfmeModule`

```typescript
import { Test } from "@nestjs/testing";
import { PdfmeModule, PdfmeService } from "@nestjsforge/pdfme";
import { text } from "@pdfme/schemas";
import { getDefaultFont } from "@pdfme/common";

describe("PdfmeModule integration", () => {
  it("provides PdfmeService via forRootAsync", async () => {
    const module = await Test.createTestingModule({
      imports: [
        PdfmeModule.forRootAsync({
          useFactory: async () => ({
            font: await getDefaultFont(),
            plugins: { text },
          }),
        }),
      ],
    }).compile();

    const service = module.get(PdfmeService);
    expect(service).toBeInstanceOf(PdfmeService);

    await module.close();
  });
});
```

---

## Roadmap

### v1.1

- `isGlobal` option — register `PdfmeModule` globally without importing in every feature module
- `PdfmeHealthIndicator` for `@nestjs/terminus`
- `@InjectPdfmeOptions()` decorator available in public API

### v2.0

- Support for `@pdfme/manipulator` — merge, split, and rotate PDFs
- Named module instances — `PdfmeModule.forFeature('invoices')` for domain-specific configurations
- Streaming output for large PDF generation
- NestJS 12 compatibility

---

## Stay in touch

- Author - [Smerlyn Javier Eusebio Bonifacio](https://www.linkedin.com/in/smerlyn-javier-eusebio-bonifacio-aab15b418/)

---

## Support

If this library saved you time, consider buying me a coffee:

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/SmerlynJavierEB)

---

## License

MIT © [NestJSForge](https://github.com/nestjsforge)
