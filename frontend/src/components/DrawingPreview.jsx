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
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white">
        <p className="text-sm text-slate-500">No drawing uploaded yet.</p>
      </div>
    );
  }

  if (fileType === "application/pdf") {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          PDF selected: {fileName}
        </p>
        <p className="mt-2 max-w-md text-xs text-slate-500">
          PDF rendering will be added in Phase 4 (backend extraction pipeline).
          For now, please upload a JPG or PNG crop to use the region selector.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Drawing Preview & Region Selection
        </h3>
        {region && (
          <button
            onClick={() => setRegion(null)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear Region
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Click and drag on the image to define a rectangular region. The region
        is a placeholder for the future column locator or schedule crop.
      </p>
      <div className="overflow-auto rounded border border-slate-200 bg-slate-100 p-2">
        <RegionSelector
          imageUrl={previewUrl}
          region={region}
          setRegion={setRegion}
        />
      </div>
      {region && (
        <p className="mt-2 text-xs text-slate-500">
          Region: x={Math.round(region.x)}, y={Math.round(region.y)}, w=
          {Math.round(region.w)}, h={Math.round(region.h)}
        </p>
      )}
    </div>
  );
}
