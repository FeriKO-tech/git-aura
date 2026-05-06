import { GIFEncoder, applyPalette, quantize } from 'gifenc';

export type RecordGifOptions = {
  /** Source WebGL canvas. Must have been created with preserveDrawingBuffer: true. */
  source: HTMLCanvasElement;
  /** Target GIF width in CSS pixels. */
  width: number;
  /** Target GIF height in CSS pixels. */
  height: number;
  /** Frames per second for the output GIF. */
  fps: number;
  /** Total capture duration in milliseconds. */
  durationMs: number;
  /** Called after each captured frame; useful for UI progress. */
  onProgress?: (captured: number, total: number) => void;
  /** Allows cancelling the capture early. */
  signal?: AbortSignal;
};

function waitForNextFrame(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Recording aborted', 'AbortError'));
      return;
    }
    const handle = requestAnimationFrame(() => resolve());
    signal?.addEventListener(
      'abort',
      () => {
        cancelAnimationFrame(handle);
        reject(new DOMException('Recording aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Records frames from a live WebGL canvas and encodes them into an animated GIF.
 *
 * One frame is captured per animation tick; if the page's rAF cadence drifts, the
 * GIF timing still respects the requested fps via `delay`. The source canvas must
 * be created with `preserveDrawingBuffer: true`.
 */
export async function recordCanvasToGif(options: RecordGifOptions): Promise<Uint8Array> {
  const { source, width, height, fps, durationMs, onProgress, signal } = options;

  if (width <= 0 || height <= 0) throw new Error('Invalid GIF dimensions');
  if (fps <= 0) throw new Error('fps must be positive');
  if (durationMs <= 0) throw new Error('durationMs must be positive');

  const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
  const frameDelay = Math.max(20, Math.round(1000 / fps));

  const scratch = document.createElement('canvas');
  scratch.width = width;
  scratch.height = height;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D context is not available on this browser');

  const encoder = GIFEncoder();

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) throw new DOMException('Recording aborted', 'AbortError');

    // Wait so that the source canvas has a fresh frame on the first iteration too.
    await waitForNextFrame(signal);

    ctx.drawImage(source, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256);
    const indexed = applyPalette(data, palette);
    encoder.writeFrame(indexed, width, height, { palette, delay: frameDelay });

    onProgress?.(i + 1, totalFrames);
  }

  encoder.finish();
  return encoder.bytes();
}

export function triggerGifDownload(bytes: Uint8Array, filename: string) {
  // Copy into a fresh buffer so TS narrows ArrayBufferLike → ArrayBuffer for BlobPart.
  const payload = new Uint8Array(bytes);
  const blob = new Blob([payload], { type: 'image/gif' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename.endsWith('.gif') ? filename : `${filename}.gif`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
