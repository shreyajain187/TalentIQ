from pathlib import Path
import uuid

from parser.models import ParsedDocument
from parser.file_parser import extract_file
from parser.text_normalizer import (
    normalize_text,
    combine_pages
)
from parser.section_detector import detect_sections
from parser.skill_extractor import extract_skills


def parse_document(
    pdf_path: str,
    document_type: str
):

    if document_type not in [
        "resume",
        "jd"
    ]:
        raise ValueError(
            "document_type must be 'resume' or 'jd'"
        )

    pages = extract_file(pdf_path)

    for page in pages:
        page.text = normalize_text(
            page.text
        )

    full_text = combine_pages(pages)

    if len(full_text.strip()) < 20:
        raise ValueError(
            "PDF contains little or no extractable text. "
            "It may be a scanned PDF."
        )

    sections = detect_sections(
        pages,
        document_type
    )

    skills = extract_skills(
        full_text
    )

    return ParsedDocument(
        id=str(uuid.uuid4()),
        filename=Path(pdf_path).name,
        document_type=document_type,
        pages=pages,
        full_text=full_text,
        sections=sections,
        skills=skills
    )