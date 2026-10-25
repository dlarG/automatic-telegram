import RegionSelector from "./RegionSelector";

export default function DrawingPreview({
  previewUrl,
  fileType,
  fileName,
  region,
  setRegion,
}) {
  if (!previewUrl && !fileName) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-500">No drawing uploaded yet.</p>
      </div>
    );
  }

  if (fileType === "application/pdf") {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-slate-800 text-xs font-semibold text-slate-900">
          PDF
        </span>
        <p className="mt-3 text-sm font-medium text-slate-800">{fileName}</p>
        <p className="mt-2 max-w-md text-sm leading-snug text-slate-600">
          PDF rendering will be added in Phase 4 (backend extraction pipeline).
          For now, upload a JPG or PNG crop to use the region selector.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Drawing preview
          </h3>
          <p className="mt-0.5 max-w-xl text-sm text-slate-600">
            Drag on the image to draw a box. It stands in for the future column
            locator or schedule crop.
          </p>
        </div>
        {region && (
          <button
            onClick={() => setRegion(null)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="mt-4 max-h-[70vh] overflow-auto rounded-sm border border-slate-300 bg-slate-200 p-3">
        <RegionSelector
          imageUrl={previewUrl}
          region={region}
          setRegion={setRegion}
        />
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {region
          ? `Selection: x ${Math.round(region.x)}, y ${Math.round(
              region.y
            )}, width ${Math.round(region.w)}, height ${Math.round(region.h)}`
          : "No selection yet."}
      </p>
    </section>
  );
}
