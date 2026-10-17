const BASE_URL = "http://127.0.0.1:8000";

export async function extractFromBlob(blob, filename, sourceView) {
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("source_view", sourceView);

  const res = await fetch(`${BASE_URL}/api/extract`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function mergeViews(caseId, views) {
  const payload = {
    case_id: caseId,
    views,
  };
  const res = await fetch(`${BASE_URL}/api/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Merge error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function extractFromFile(file, sourceView) {
  return extractFromBlob(file, file.name, sourceView);
}
