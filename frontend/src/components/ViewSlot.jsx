import { useState, useRef, useEffect } from "react";
import PdfViewer from "./PdfViewer";

export default function ViewSlot({
  label,
  description,
  required,
  pdfFile,
  imageUrl,
  capturedImage,
  onCapture,
  onClear,
}) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [region, setRegion] = useState(null);
  const [pdfScale, setPdfScale] = useState(1);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-capture if an image is passed from Step 1
  useEffect(() => {
    if (imageUrl && !capturedImage) {
      fetch(imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          onCapture(blob, imageUrl);
        });
    }
  }, [imageUrl, capturedImage, onCapture]);

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

  // -------- The Precise Cropping Fix --------
  const handleCapture = () => {
    const element = canvasRef.current; // This is the <canvas> or <img>
    if (!element || !region || region.w < 5 || region.h < 5) return;

    // 1. Get the real dimensions of the element (not CSS dimensions)
    // If it's a canvas, it has .width/.height. If it's an img, it has .naturalWidth/.naturalHeight
    const realWidth = element.width || element.naturalWidth;
    const realHeight = element.height || element.naturalHeight;

    // 2. Get the CSS dimensions (what you actually see on screen)
    const rect = overlayRef.current.getBoundingClientRect();

    // 3. Calculate the scale factor between real pixels and CSS pixels
    const scaleX = realWidth / rect.width;
    const scaleY = realHeight / rect.height;

    // 4. Map the selection box coordinates to real pixels
    const cropX = region.x * scaleX;
    const cropY = region.y * scaleY;
    const cropW = region.w * scaleX;
    const cropH = region.h * scaleY;

    const cropped = document.createElement("canvas");
    cropped.width = cropW;
    cropped.height = cropH;
    const ctx = cropped.getContext("2d");

    // 5. Draw the precise high-res crop
    ctx.drawImage(element, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    cropped.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onCapture(blob, url);
    }, "image/png");
  };

  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onCapture(file, url);
    }
  };

  const hasRegion = region && region.w > 5 && region.h > 5;
  const activeImageUrl = imageUrl;
  const scrollContainerRef = useRef(null);
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-sm bg-slate-900 text-base font-semibold text-white">
            {label}
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              View {label}: {description}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {required ? "Required" : "Optional."}
              {capturedImage && (
                <span className="inline-flex items-center gap-1 rounded-sm border-l-4 border-green-600 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-900">
                  ✓ Captured
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
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
              }}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Re-capture
            </button>
          )}
        </div>
      </div>

      {!capturedImage && (
        <>
          {pdfFile || activeImageUrl ? (
            <>
              {pdfFile && !activeImageUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <p className="text-sm text-slate-600">Drag to draw a box.</p>
                  <div className="flex items-center border border-slate-300 bg-white">
                    <button
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className="px-3 py-1.5 text-xs hover:bg-slate-100 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="border-x border-slate-300 px-3 py-1.5 text-xs">
                      Page {pageNumber} of {pageCount}
                    </span>
                    <button
                      onClick={() =>
                        setPageNumber((p) => Math.min(pageCount, p + 1))
                      }
                      disabled={pageNumber >= pageCount}
                      className="px-3 py-1.5 text-xs hover:bg-slate-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {pdfFile && (
                <div className="mb-2 flex items-center justify-between rounded-md border border-slate-300 bg-slate-800 px-4 py-2 text-white">
                  <span className="text-sm font-medium">PDF Zoom</span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPdfScale((s) =>
                          Math.max(0.5, Math.round((s - 0.25) * 100) / 100)
                        )
                      }
                      disabled={pdfScale <= 0.5}
                      className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600 disabled:opacity-40"
                    >
                      −
                    </button>

                    <span className="w-14 text-center text-sm font-semibold">
                      {Math.round(pdfScale * 100)}%
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPdfScale((s) =>
                          Math.min(3, Math.round((s + 0.25) * 100) / 100)
                        )
                      }
                      disabled={pdfScale >= 3}
                      className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600 disabled:opacity-40"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfScale(1)}
                      className="rounded border border-slate-500 px-3 py-1 text-xs hover:bg-slate-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* THE FIX: Fixed height, scrollable container */}
              <div
                ref={scrollContainerRef}
                className="relative w-full h-[65vh] border border-slate-300 bg-slate-200 overflow-auto rounded-sm"
              >
                <div
                  ref={overlayRef}
                  className="relative inline-block select-none"
                  style={{ cursor: "crosshair" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  {activeImageUrl && !pdfFile ? (
                    <img
                      src={activeImageUrl}
                      alt="Uploaded drawing"
                      className="block max-w-none"
                      ref={(el) => {
                        if (el) canvasRef.current = el;
                      }}
                    />
                  ) : (
                    <PdfViewer
                      pdfFile={pdfFile}
                      pageNumber={pageNumber}
                      scale={pdfScale}
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
                Upload a PDF in step 1, or click "Upload Image" above.
              </p>
            </div>
          )}
        </>
      )}

      {capturedImage && (
        <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
          <img
            src={capturedImage}
            alt={`View ${label}`}
            className="max-h-64 object-contain"
          />
        </div>
      )}
    </section>
  );
}
