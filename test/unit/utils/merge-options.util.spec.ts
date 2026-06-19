import { mergeFonts, mergePlugins } from '../../../src/utils/merge-options.util';
import type { Font, Plugin, Schema } from '@pdfme/common';

const makePlugin = (id: string): Plugin<Schema> =>
  ({ id } as unknown as Plugin<Schema>);

describe('mergeFonts', () => {
  it('returns global when local is undefined', () => {
    const global: Font = { Arial: { data: new Uint8Array([1]), fallback: true } };
    expect(mergeFonts(global, undefined)).toEqual(global);
  });

  it('returns global when local is empty', () => {
    const global: Font = { Arial: { data: new Uint8Array([1]), fallback: true } };
    expect(mergeFonts(global, {})).toEqual(global);
  });

  it('merges local over global — local takes precedence', () => {
    const globalFont: Font = {
      Arial: { data: new Uint8Array([1]), fallback: true },
      Roboto: { data: new Uint8Array([2]), fallback: false },
    };
    const localFont: Font = {
      Arial: { data: new Uint8Array([99]), fallback: false }, // overrides
    };
    const result = mergeFonts(globalFont, localFont);
    expect(result.Arial).toEqual(localFont.Arial);
    expect(result.Roboto).toEqual(globalFont.Roboto);
  });
});

describe('mergePlugins', () => {
  it('returns global when local is undefined', () => {
    const global = { text: makePlugin('text') };
    expect(mergePlugins(global, undefined)).toEqual(global);
  });

  it('returns global when local is empty', () => {
    const global = { text: makePlugin('text') };
    expect(mergePlugins(global, {})).toEqual(global);
  });

  it('local plugin takes precedence over global', () => {
    const globalPlugins = { text: makePlugin('global-text'), image: makePlugin('image') };
    const localPlugins = { text: makePlugin('local-text') };
    const result = mergePlugins(globalPlugins, localPlugins);
    expect(result.text).toBe(localPlugins.text);
    expect(result.image).toBe(globalPlugins.image);
  });

  it('adds new plugins from local without touching global', () => {
    const globalPlugins = { text: makePlugin('text') };
    const localPlugins = { qrCode: makePlugin('qrCode') };
    const result = mergePlugins(globalPlugins, localPlugins);
    expect(Object.keys(result)).toContain('text');
    expect(Object.keys(result)).toContain('qrCode');
  });
});
