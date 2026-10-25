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

  // No padding or border around the canvas: the selection overlay in
  // ViewSlot is measured against this element, so the canvas must be flush
  // with it for the crop to line up with what the user drew.
  return (
    <div>
      {loading && (
        <p className="px-6 py-10 text-sm text-slate-500">Rendering page...</p>
      )}
      {error && (
        <p
          role="alert"
          className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <canvas
        ref={canvasRef}
        className="block max-w-full bg-white"
        style={{ display: loading ? "none" : "block" }}
      />
    </div>
  );
}
