import { useState, useRef } from "react";
import PdfViewer from "./PdfViewer";

export default function ViewSlot({
  label,
  description,
  required,
  pdfFile,
  capturedImage,
  onCapture,
  onClear,
}) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [region, setRegion] = useState(null);
  const canvasRef = useRef(null);

  // -------- Region selection handling --------
  const overlayRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);

  const getRelPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    const p = getRelPos(e);
    setStart(p);
    setDragging(true);
    setRegion({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onMouseMove = (e) => {
    if (!dragging || !start) return;
    const p = getRelPos(e);
    setRegion({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  };

  const onMouseUp = () => {
    setDragging(false);
    setStart(null);
  };

  // -------- Capture --------
  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas || !region || region.w < 5 || region.h < 5) return;

    // The region coordinates are in CSS pixels of the overlay.
    // The canvas may be at a different scale (due to max-width: 100%).
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;

    const cropX = region.x * scaleX;
    const cropY = region.y * scaleY;
    const cropW = region.w * scaleX;
    const cropH = region.h * scaleY;

    const cropped = document.createElement("canvas");
    cropped.width = Math.round(cropW);
    cropped.height = Math.round(cropH);
    const ctx = cropped.getContext("2d");
    ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    cropped.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onCapture(blob, url);
    }, "image/png");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            View {label} — {description}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {required ? "Required." : "Optional. Only if a check needs it."}
          </p>
        </div>
        {capturedImage && (
          <button
            onClick={() => {
              onClear();
              setRegion(null);
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Re-capture
          </button>
        )}
      </div>

      {!capturedImage && (
        <>
          {pdfFile ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-600">
                  Page {pageNumber} of {pageCount}
                </span>
                <button
                  onClick={() =>
                    setPageNumber((p) => Math.min(pageCount, p + 1))
                  }
                  disabled={pageNumber >= pageCount}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="mt-3 overflow-auto">
                <div
                  ref={overlayRef}
                  className="relative inline-block select-none"
                  style={{ cursor: "crosshair" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  <PdfViewer
                    pdfFile={pdfFile}
                    pageNumber={pageNumber}
                    onPageRendered={(canvas) => {
                      canvasRef.current = canvas;
                    }}
                    onPageCount={setPageCount}
                  />
                  {region && region.w > 2 && region.h > 2 && (
                    <div
                      className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10"
                      style={{
                        left: region.x,
                        top: region.y,
                        width: region.w,
                        height: region.h,
                      }}
                    />
                  )}
                </div>
              </div>

              {region && region.w > 5 && region.h > 5 && (
                <p className="mt-2 text-xs text-slate-500">
                  Region: {Math.round(region.w)} × {Math.round(region.h)} CSS px
                </p>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleCapture}
                  disabled={!region || region.w < 5 || region.h < 5}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
                >
                  Capture {label}
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Upload a PDF or image in the panel above to enable page selection
              and cropping.
            </p>
          )}
        </>
      )}

      {capturedImage && (
        <div className="mt-3">
          <img
            src={capturedImage}
            alt={`View ${label}`}
            className="max-h-64 rounded border border-slate-200"
          />
        </div>
      )}
    </div>
  );
}
