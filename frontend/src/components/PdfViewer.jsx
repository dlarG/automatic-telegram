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

        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        if (cancelled) return;

        onPageRendered?.(canvas);
      } catch (e) {
        setError(`Could not render PDF: ${e.message}`);
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
    <div className="rounded border border-slate-200 bg-white p-3">
      {loading && <p className="text-xs text-slate-500">Rendering page...</p>}
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <canvas
        ref={canvasRef}
        className="block max-w-full"
        style={{ display: loading ? "none" : "block" }}
      />
    </div>
  );
}
