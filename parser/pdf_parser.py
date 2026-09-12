import fitz
from pathlib import Path

from parser.models import PageData


class PDFExtractionError(Exception):
    pass


def extract_pdf(pdf_path: str) -> list[PageData]:

    path = Path(pdf_path)

    if not path.exists():
        raise PDFExtractionError(
            f"File does not exist: {pdf_path}"
        )

    if path.suffix.lower() != ".pdf":
        raise PDFExtractionError(
            f"Not a PDF: {pdf_path}"
        )

    pages = []

    try:
        document = fitz.open(pdf_path)

        for index, page in enumerate(document):

            text = page.get_text("text")

            pages.append(
                PageData(
                    page=index + 1,
                    text=text.strip()
                )
            )

        document.close()

    except Exception as e:
        raise PDFExtractionError(
            f"Failed to parse {pdf_path}: {e}"
        )

    if not pages:
        raise PDFExtractionError(
            f"PDF contains no pages: {pdf_path}"
        )

    return pages