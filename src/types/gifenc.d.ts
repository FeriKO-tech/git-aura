declare module 'gifenc' {
  export type Palette = number[][];

  export type QuantizeFormat = 'rgb444' | 'rgb565' | 'rgba4444';

  export interface QuantizeOptions {
    format?: QuantizeFormat;
    oneBitAlpha?: boolean | number;
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    clearAlphaColor?: number;
  }

  export function quantize(
    data: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): Palette;

  export interface ApplyPaletteOptions {
    format?: QuantizeFormat;
  }

  export function applyPalette(
    data: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: QuantizeFormat,
  ): Uint8Array;

  export interface WriteFrameOptions {
    palette?: Palette;
    /** Delay between this frame and the next in milliseconds. */
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
    repeat?: number;
    first?: boolean;
  }

  export interface Encoder {
    writeFrame(
      indexedPixels: Uint8Array,
      width: number,
      height: number,
      options?: WriteFrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }

  export interface EncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export function GIFEncoder(options?: EncoderOptions): Encoder;
}
