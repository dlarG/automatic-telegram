import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfViewer({
  pdfFile,
  pageNumber,
  scale,
  onPageRendered,
  onPageCount,
}) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Keep callbacks current without restarting the PDF rendering effect.
  const callbacksRef = useRef({ onPageRendered, onPageCount });

  callbacksRef.current = { onPageRendered, onPageCount };

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    async function render() {
      if (!pdfFile) return;

      try {
        // Cancel any previous rendering operation.
        renderTaskRef.current?.cancel();

        const buffer = await pdfFile.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          await loadingTask.destroy();
          return;
        }

        callbacksRef.current.onPageCount?.(pdf.numPages);

        if (pageNumber > pdf.numPages) return;

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        // Original page dimensions at 100%.
        const baseViewport = page.getViewport({ scale: 1 });

        // Render at 2x resolution for better crop/OCR quality.
        const MAX_DIMENSION = 4000;
        const desiredRenderScale = scale * 2;

        const dimensionLimit = Math.min(
          MAX_DIMENSION / baseViewport.width,
          MAX_DIMENSION / baseViewport.height
        );

        const renderScale = Math.min(desiredRenderScale, dimensionLimit);

        const renderViewport = page.getViewport({
          scale: renderScale,
        });

        // Display dimensions are independent of render resolution.
        const displayWidth = baseViewport.width * scale;
        const displayHeight = baseViewport.height * scale;

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const context = canvas.getContext("2d", {
          alpha: false,
        });

        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);

        // CSS dimensions control what the user sees.
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        renderTask = page.render({
          canvasContext: context,
          viewport: renderViewport,
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (cancelled) return;

        callbacksRef.current.onPageRendered?.(canvas);
      } catch (error) {
        if (error.name !== "RenderingCancelledException") {
          if (!cancelled) {
            console.error("PDF Render Error:", error);
          }
        }
      }
    }

    render();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdfFile, pageNumber, scale]);

  return <canvas ref={canvasRef} className="block max-w-none bg-white" />;
}
