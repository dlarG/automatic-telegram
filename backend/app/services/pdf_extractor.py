import fitz  # PyMuPDF

# Minimum characters per page to consider a PDF "digital" (has embedded text).
# Scanned PDFs often extract a handful of stray characters from stamps/logos,
# so we use a small threshold rather than zero.
MIN_CHARS_PER_PAGE = 20


def extract_pdf_text(contents: bytes) -> dict:
    """
    Extract embedded text from a PDF.

    Returns a dict with:
      - has_embedded_text: bool
      - page_count: int
      - text_length: int
      - raw_text: str  (concatenated text across pages)
      - pages: list of {page_number, text, char_count}
    """
    try:
        doc = fitz.open(stream=contents, filetype="pdf")
    except Exception as e:
        return {
            "has_embedded_text": False,
            "page_count": 0,
            "text_length": 0,
            "raw_text": "",
            "pages": [],
            "error": f"Could not open PDF: {e}",
        }

    pages = []
    total_chars = 0

    for page_index in range(doc.page_count):
        page = doc.load_page(page_index)
        text = page.get_text("text") or ""
        char_count = len(text.strip())
        total_chars += char_count
        pages.append({
            "page_number": page_index + 1,
            "text": text,
            "char_count": char_count,
        })

    page_count = doc.page_count
    doc.close()

    # Heuristic: if the average characters per page is below the threshold,
    # treat the PDF as image-only and defer to OCR.
    avg_chars = (total_chars / page_count) if page_count > 0 else 0
    has_embedded_text = avg_chars >= MIN_CHARS_PER_PAGE

    raw_text = "\n\n".join(p["text"] for p in pages)

    return {
        "has_embedded_text": has_embedded_text,
        "page_count": page_count,
        "text_length": total_chars,
        "raw_text": raw_text,
        "pages": pages,
        "error": None,
    }