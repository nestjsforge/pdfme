export interface PdfmeLoggingOptions {
  /**
   * Log each generate() call with schema and input count.
   * Avoid in production — can be noisy on high-throughput workloads.
   * @default false
   */
  logGenerate?: boolean;

  /**
   * Log module initialization summary (font count, plugin count).
   * @default true
   */
  logInit?: boolean;
}
