import type { Font, Plugin, Schema } from '@pdfme/common';

export function mergeFonts(global: Font, local: Font | undefined): Font {
  if (!local || Object.keys(local).length === 0) return global;
  return { ...global, ...local };
}

export function mergePlugins(
  global: Record<string, Plugin<Schema>>,
  local: Record<string, Plugin<Schema>> | undefined,
): Record<string, Plugin<Schema>> {
  if (!local || Object.keys(local).length === 0) return global;
  return { ...global, ...local };
}
