import numpy as np
import pymupdf

from app.services.image_processing import preprocess_for_ocr


# Lazy-loaded singleton. PaddleOCR initialization is expensive.
_ocr_instance = None


def get_ocr():
    global _ocr_instance
    if _ocr_instance is not None:
        return _ocr_instance

    from paddleocr import PaddleOCR

    kwargs = {
        "lang": "en",
        "use_textline_orientation": True,
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "enable_mkldnn": False,
    }

    try:
        _ocr_instance = PaddleOCR(**kwargs)
        print(f"[OCR] Initialized PaddleOCR with args: {kwargs}")
    except TypeError:
        _ocr_instance = PaddleOCR(lang="en", enable_mkldnn=False)
        print("[OCR] Initialized PaddleOCR with reduced args.")

    return _ocr_instance


def render_pdf_pages_to_images(contents: bytes, dpi: int = 200) -> list:
    """
    Render each PDF page to a PNG image (as bytes).
    Used when a PDF has no embedded text (scanned PDF).
    """
    doc = pymupdf.open(stream=contents, filetype="pdf")
    images = []
    for page_index in range(doc.page_count):
        page = doc.load_page(page_index)
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        images.append({
            "page_number": page_index + 1,
            "image_bytes": img_bytes,
        })
    doc.close()
    return images


def _to_native(value):
    """
    Convert NumPy scalars/arrays to plain Python types.
    Returns None if value is None or empty.
    """
    if value is None:
        return None

    # NumPy scalar
    if isinstance(value, np.generic):
        return value.item()

    # NumPy array
    if isinstance(value, np.ndarray):
        return [_to_native(v) for v in value.tolist()]

    # List/tuple: recurse
    if isinstance(value, (list, tuple)):
        return [_to_native(v) for v in value]

    return value


def _normalize_ocr_result(result):
    """
    Normalize PaddleOCR output across versions into a flat list of:
      {"text": str, "confidence": float, "bbox": [[x,y],...]}
    Handles:
      - 3.x dict-based format
      - 2.x nested list format
    """
    lines = []

    if result is None:
        return lines

    # Convert top-level result to a plain Python list if needed
    try:
        result_list = list(result)
    except TypeError:
        return lines

    def add_line(text, confidence, bbox):
        if text is None:
            return
        text_str = str(text).strip()
        if not text_str:
            return

        # Convert bbox to native list of [x, y] pairs
        bbox_native = []
        if bbox is not None:
            try:
                for point in bbox:
                    if hasattr(point, "__iter__"):
                        bbox_native.append([float(c) for c in point])
                    else:
                        bbox_native.append([])
            except TypeError:
                bbox_native = []

        try:
            conf_val = float(confidence)
        except (TypeError, ValueError):
            conf_val = 0.0

        lines.append({
            "text": text_str,
            "confidence": conf_val,
            "bbox": bbox_native,
        })

    for item in result_list:
        # ---- 3.x: dict with rec_texts / rec_scores / rec_polys ----
        if isinstance(item, dict):
            texts = item.get("rec_texts") or []
            scores = item.get("rec_scores") or []
            polys = item.get("rec_polys")
            if polys is None:
                polys = item.get("dt_polys") or []

            try:
                texts = list(texts)
                scores = list(scores)
                polys = list(polys)
            except TypeError:
                continue

            for i, text in enumerate(texts):
                conf = scores[i] if i < len(scores) else 0.0
                bbox = polys[i] if i < len(polys) else []
                add_line(text, conf, bbox)
            continue

        # ---- 2.x: nested list [[bbox, (text, conf)], ...] ----
        if isinstance(item, (list, tuple)):
            for entry in item:
                try:
                    bbox, payload = entry
                    text, confidence = payload
                except (ValueError, TypeError):
                    continue
                add_line(text, confidence, bbox)

    return lines


def run_ocr_on_image(image_bytes: bytes) -> dict:
    """
    Run PaddleOCR on a single image.
    Returns text, structured lines, and confidence.
    """
    try:
        processed = preprocess_for_ocr(image_bytes)
        processed_rgb = np.stack([processed] * 3, axis=-1)

        ocr = get_ocr()

        # ---- Run OCR ----
        try:
            if hasattr(ocr, "predict"):
                result = ocr.predict(processed_rgb)
            else:
                result = ocr.ocr(processed_rgb, cls=True)
        except Exception as e:
            return {
                "text": "",
                "lines": [],
                "line_count": 0,
                "avg_confidence": 0.0,
                "error": f"OCR failed: {e}",
            }

        # ---- Normalize ----
        try:
            lines = _normalize_ocr_result(result)
        except Exception as e:
            return {
                "text": "",
                "lines": [],
                "line_count": 0,
                "avg_confidence": 0.0,
                "error": f"OCR normalization failed: {e}",
            }

        concatenated = "\n".join(line["text"] for line in lines)
        avg_conf = (
            sum(line["confidence"] for line in lines) / len(lines)
            if lines else 0.0
        )

        return {
            "text": concatenated,
            "lines": lines,
            "line_count": int(len(lines)),
            "avg_confidence": float(round(avg_conf, 4)),
            "error": None,
        }

    except Exception as e:
        return {
            "text": "",
            "lines": [],
            "line_count": 0,
            "avg_confidence": 0.0,
            "error": f"OCR failed: {e}",
        }