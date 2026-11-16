import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfViewer({
  pdfFile,
  pageNumber,
  onPageRendered,
  onPageCount,
}) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!pdfFile) return;
      setLoading(true);
      setError("");

      try {
        const buffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;

        if (onPageCount) onPageCount(pdf.numPages);

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        // --- STRICTER SCALING ---
        // We set a much smaller max dimension to ensure the browser doesn't crash.
        // 1500px is plenty for OCR and cropping.
        const MAX_DIMENSION = 1500;
        const baseViewport = page.getViewport({ scale: 1.0 });

        let scale = 1.5;
        // If the page is huge, scale it down so it fits in 1500x1500
        if (
          baseViewport.width > MAX_DIMENSION ||
          baseViewport.height > MAX_DIMENSION
        ) {
          const scaleW = MAX_DIMENSION / baseViewport.width;
          const scaleH = MAX_DIMENSION / baseViewport.height;
          scale = Math.min(scaleW, scaleH);
        }

        // Ensure scale is at least readable (0.5)
        scale = Math.max(scale, 0.5);

        const finalViewport = page.getViewport({ scale: scale });
        const canvas = canvasRef.current;

        // Clear previous canvas data to free memory
        canvas.width = 0;
        canvas.height = 0;
        canvas.width = finalViewport.width;
        canvas.height = finalViewport.height;

        const context = canvas.getContext("2d");

        // Add a white background fill just in case the PDF has transparency
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: finalViewport,
        };

        await page.render(renderContext).promise;
        if (cancelled) return;

        onPageRendered?.(canvas);
      } catch (e) {
        console.error("PDF Render Error:", e);
        setError(
          `Could not render this specific page. It might be too large or contain complex vectors. (${e.message})`
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfFile, pageNumber]);

  return (
    <div className="rounded border border-slate-200 bg-white p-3 min-h-[400px] flex items-center justify-center">
      {loading && <p className="text-sm text-slate-500">Rendering page...</p>}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center max-w-md">
          <p className="font-semibold mb-1">Rendering Failed</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">
            Try taking a direct screenshot of the page and uploading it as an
            image instead.
          </p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="block max-w-full shadow-sm"
        style={{ display: loading || error ? "none" : "block" }}
      />
    </div>
  );
}
