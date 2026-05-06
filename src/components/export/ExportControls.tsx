"use client";

import { useRef, useState } from 'react';
import { safeFileName } from '@/lib/format';
import { recordCanvasToGif, triggerGifDownload } from '@/lib/record-gif';

type ExportControlsProps = {
  canvas: HTMLCanvasElement | null;
  username: string;
};

type ExportMode = 'idle' | 'png' | 'webm' | 'gif';

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function ExportControls({ canvas, username }: ExportControlsProps) {
  const [mode, setMode] = useState<ExportMode>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const baseName = `git-aura-${safeFileName(username)}`;
  const isBusy = mode !== 'idle';
  const disabled = !canvas || isBusy;

  function assertCanvas(): HTMLCanvasElement {
    if (!canvas) throw new Error('Aura canvas is not ready yet');
    return canvas;
  }

  async function exportPng() {
    setError(null);
    setMode('png');

    try {
      const source = assertCanvas();
      const blob = await new Promise<Blob>((resolve, reject) => {
        source.toBlob((nextBlob) => {
          if (!nextBlob) reject(new Error('Could not export PNG'));
          else resolve(nextBlob);
        }, 'image/png');
      });

      downloadBlob(blob, `${baseName}.png`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'PNG export failed');
    } finally {
      setMode('idle');
    }
  }

  async function exportWebm() {
    setError(null);
    setMode('webm');
    setProgress(0);

    try {
      const source = assertCanvas();

      if (!('captureStream' in source)) {
        throw new Error('Canvas video capture is not supported in this browser');
      }

      const stream = source.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.start();

      for (let tick = 0; tick < 45; tick += 1) {
        await wait(100);
        setProgress(Math.round(((tick + 1) / 45) * 100));
      }

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      downloadBlob(new Blob(chunks, { type: mimeType }), `${baseName}.webm`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'WebM export failed');
    } finally {
      setMode('idle');
      setProgress(0);
    }
  }

  async function exportGif() {
    setError(null);
    setMode('gif');
    setProgress(0);
    abortRef.current = new AbortController();

    try {
      const source = assertCanvas();
      const width = Math.min(640, Math.max(320, Math.round(source.clientWidth || source.width)));
      const height = Math.min(640, Math.max(260, Math.round(source.clientHeight || source.height)));
      const bytes = await recordCanvasToGif({
        source,
        width,
        height,
        fps: 18,
        durationMs: 3200,
        signal: abortRef.current.signal,
        onProgress: (captured, total) => setProgress(Math.round((captured / total) * 100)),
      });

      triggerGifDownload(bytes, `${baseName}.gif`);
    } catch (nextError) {
      if (nextError instanceof DOMException && nextError.name === 'AbortError') {
        setError('GIF export cancelled');
      } else {
        setError(nextError instanceof Error ? nextError.message : 'GIF export failed');
      }
    } finally {
      abortRef.current = null;
      setMode('idle');
      setProgress(0);
    }
  }

  function cancelExport() {
    abortRef.current?.abort();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-panel backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyanAura/80">export aura</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Share-ready capture</h3>
        </div>

        {isBusy ? (
          <button
            type="button"
            onClick={cancelExport}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-hotAura hover:text-hotAura"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={disabled}
          onClick={exportPng}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyanAura/60 hover:bg-cyanAura/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          PNG
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={exportWebm}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:border-violetAura/60 hover:bg-violetAura/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          WebM
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={exportGif}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:border-hotAura/60 hover:bg-hotAura/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          GIF
        </button>
      </div>

      {isBusy ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-cyanAura via-violetAura to-hotAura transition-all" style={{ width: `${progress || 8}%` }} />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-hotAura">{error}</p> : null}
    </div>
  );
}
