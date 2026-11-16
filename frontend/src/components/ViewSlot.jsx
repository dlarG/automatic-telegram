import { useState, useRef } from "react";
import PdfViewer from "./PdfViewer";

export default function ViewSlot({
  label,
  description,
  required,
  pdfFile,
  imageUrl, // Main image upload (from Step 1)
  capturedImage,
  onCapture,
  onClear,
}) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [region, setRegion] = useState(null);
  const canvasRef = useRef(null);

  // New state to allow a specific image upload just for this view
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const activeImageUrl = localImageUrl || imageUrl;

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
    const element = canvasRef.current; // This is either a canvas or an img
    if (!element || !region || region.w < 5 || region.h < 5) return;

    const cropped = document.createElement("canvas");
    cropped.width = region.w;
    cropped.height = region.h;
    const ctx = cropped.getContext("2d");

    // Calculate scale (images might be displayed smaller than their actual resolution)
    const scaleX = element.width / element.clientWidth;
    const scaleY = element.height / element.clientHeight;

    const cropX = region.x * scaleX;
    const cropY = region.y * scaleY;
    const cropW = region.w * scaleX;
    const cropH = region.h * scaleY;

    ctx.drawImage(
      element,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      region.w,
      region.h
    );

    cropped.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onCapture(blob, url);
    }, "image/png");
  };

  // -------- Handle Local Image Upload --------
  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalImageUrl(url);
      setRegion(null); // Reset selection
    }
  };

  const hasRegion = region && region.w > 5 && region.h > 5;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-sm bg-slate-900 text-base font-semibold text-white"
          >
            {label}
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              View {label}: {description}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {required ? "Required" : "Optional. Only if a check needs it."}
              {capturedImage && (
                <span className="inline-flex items-center gap-1 rounded-sm border-l-4 border-green-600 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-900">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Captured
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Allow uploading a specific image for this view */}
          {!capturedImage && (
            <>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                ref={fileInputRef}
                onChange={handleLocalImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Upload Image
              </button>
            </>
          )}

          {capturedImage && (
            <button
              onClick={() => {
                onClear();
                setRegion(null);
                setLocalImageUrl(null);
              }}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Re-capture
            </button>
          )}
        </div>
      </div>

      {/* Selecting */}
      {!capturedImage && (
        <>
          {pdfFile || activeImageUrl ? (
            <>
              {/* Only show pagination if it's a PDF and we don't have a local image */}
              {pdfFile && !localImageUrl && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Drag on the page to draw a box around this view.
                  </p>
                  <div className="flex items-center border border-slate-300">
                    <button
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className="px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:text-slate-300"
                    >
                      Prev
                    </button>
                    <span className="border-x border-slate-300 px-3 py-1.5 text-xs text-slate-700">
                      Page {pageNumber} of {pageCount}
                    </span>
                    <button
                      onClick={() =>
                        setPageNumber((p) => Math.min(pageCount, p + 1))
                      }
                      disabled={pageNumber >= pageCount}
                      className="px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 max-h-[70vh] overflow-auto rounded-sm border border-slate-300 bg-slate-200 p-3">
                <div
                  ref={overlayRef}
                  className="relative inline-block select-none"
                  style={{ cursor: "crosshair" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  {/* Render Image if we have one, otherwise PDF */}
                  {localImageUrl || !pdfFile ? (
                    <img
                      src={localImageUrl || activeImageUrl}
                      alt="Uploaded drawing"
                      className="block max-w-full"
                      ref={(el) => {
                        if (el) canvasRef.current = el;
                      }}
                    />
                  ) : (
                    <PdfViewer
                      pdfFile={pdfFile}
                      pageNumber={pageNumber}
                      onPageRendered={(canvas) => {
                        canvasRef.current = canvas;
                      }}
                      onPageCount={setPageCount}
                    />
                  )}

                  {region && region.w > 2 && region.h > 2 && (
                    <div
                      className="pointer-events-none absolute border-2 border-blue-600 bg-blue-600/10"
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

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {hasRegion
                    ? `Selection: ${Math.round(region.w)} × ${Math.round(
                        region.h
                      )} px`
                    : "No selection yet."}
                </p>
                <button
                  onClick={handleCapture}
                  disabled={!hasRegion}
                  className="rounded bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
                >
                  Capture view {label}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-sm border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                Waiting for a Source Document
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Upload a PDF in step 1, or click "Upload Image" above to provide
                a specific screenshot for this view.
              </p>
            </div>
          )}
        </>
      )}

      {/* Captured */}
      {capturedImage && (
        <div className="mt-3">
          <img
            src={capturedImage}
            alt={`View ${label}`}
            className="max-h-64 rounded border border-slate-200"
          />
        </div>
      )}
    </section>
  );
}
