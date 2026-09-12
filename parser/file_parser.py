from pathlib import Path
from docx import Document
import xml.etree.ElementTree as ET

from parser.models import PageData
from parser.pdf_parser import extract_pdf


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".xml"
}


def extract_docx(path: str) -> list[PageData]:
    """
    DOCX files don't have reliable page boundaries at this level,
    so the extracted document is represented as page 1.
    """

    document = Document(path)

    lines = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            lines.append(text)

    # Also extract text from tables.
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                text = cell.text.strip()

                if text:
                    lines.append(text)

    full_text = "\n".join(lines)

    return [
        PageData(
            page=1,
            text=full_text
        )
    ]


def extract_txt(path: str) -> list[PageData]:

    # Try common encodings.
    encodings = [
        "utf-8",
        "utf-8-sig",
        "cp1252",
        "latin-1"
    ]

    text = None

    for encoding in encodings:
        try:
            with open(
                path,
                "r",
                encoding=encoding
            ) as file:
                text = file.read()

            break

        except UnicodeDecodeError:
            continue

    if text is None:
        raise ValueError(
            f"Unable to decode text file: {path}"
        )

    return [
        PageData(
            page=1,
            text=text
        )
    ]

def extract_xml(path: str) -> list[PageData]:
    """
    Extract readable text from an XML document.

    XML does not have reliable page boundaries,
    so the extracted content is represented as logical page 1.
    """

    try:
        tree = ET.parse(path)
        root = tree.getroot()

        text_parts = []

        for element in root.iter():

            if element.text and element.text.strip():
                text_parts.append(
                    element.text.strip()
                )

        full_text = "\n".join(text_parts)

        if not full_text.strip():
            raise ValueError(
                "XML file contains no readable text."
            )

        return [
            PageData(
                page=1,
                text=full_text
            )
        ]

    except ET.ParseError as e:
        raise ValueError(
            f"Invalid XML file: {e}"
        )
def extract_file(path: str) -> list[PageData]:

    file_path = Path(path)

    if not file_path.exists():
        raise FileNotFoundError(
            f"File does not exist: {path}"
        )

    extension = file_path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {extension}. "
            "Supported formats: PDF, DOCX, TXT"
        )

    if extension == ".pdf":
        return extract_pdf(path)

    if extension == ".docx":
        return extract_docx(path)

    if extension == ".txt":
        return extract_txt(path)
    if extension == ".xml":
        return extract_xml(path)
    raise ValueError(
        f"Unsupported file type: {extension}"
    )
    