import cv2
import numpy as np


def preprocess_for_ocr(image_bytes: bytes) -> np.ndarray:
    """
    Decode image bytes and apply light preprocessing for OCR.

    Steps:
      1. Decode bytes to BGR ndarray
      2. Convert to grayscale
      3. Denoise (preserves edges, removes speckle)
      4. Increase contrast with CLAHE
      5. Return the processed grayscale image
    """
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image bytes.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    return enhanced


def preprocess_for_ocr_threshold(image_bytes: bytes) -> np.ndarray:
    """
    Alternative preprocessing with adaptive threshold.
    Use this if the default produces weak OCR results.
    """
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image bytes.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    thresh = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15,
    )
    return thresh