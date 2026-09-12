from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class PageData:
    page: int
    text: str


@dataclass
class SectionData:
    text: str = ""
    pages: List[int] = field(default_factory=list)


@dataclass
class ParsedDocument:
    id: str
    filename: str
    document_type: str

    pages: List[PageData]
    full_text: str

    sections: Dict[str, SectionData]
    skills: List[str]

    status: str = "success"
    error: str = ""