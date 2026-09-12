import re

from parser.models import SectionData


RESUME_HEADINGS = {

    "summary": [
        "summary",
        "professional summary",
        "profile",
        "objective"
    ],

    "skills": [
        "skills",
        "technical skills",
        "core skills",
        "core competencies",
        "technologies"
    ],

    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "internship experience"
    ],

    "education": [
        "education",
        "academic background",
        "academic qualifications",
        "qualifications"
    ],

    "projects": [
        "projects",
        "personal projects",
        "academic projects",
        "key projects"
    ],

    "certifications": [
        "certifications",
        "certificates",
        "licenses and certifications"
    ],

    "achievements": [
        "achievements",
        "awards",
        "honors",
        "awards and achievements"
    ]
}


JD_HEADINGS = {

    "summary": [
        "job summary",
        "job description",
        "about the role",
        "role overview"
    ],

    "responsibilities": [
        "responsibilities",
        "roles and responsibilities",
        "key responsibilities",
        "what you will do",
        "what you'll do"
    ],

    "requirements": [
        "requirements",
        "job requirements",
        "required qualifications",
        "minimum qualifications",
        "what we are looking for",
        "what we're looking for"
    ],

    "preferred": [
        "preferred qualifications",
        "preferred skills",
        "nice to have",
        "good to have"
    ],

    "skills": [
        "skills",
        "required skills",
        "technical skills",
        "key skills"
    ],

    "education": [
        "education",
        "educational qualifications",
        "educational requirements"
    ],

    "experience": [
        "experience",
        "experience required",
        "required experience"
    ]
}


def clean_heading(line: str) -> str:

    line = line.strip().lower()

    line = re.sub(
        r"[:\-–—]+$",
        "",
        line
    )

    return line.strip()


def find_heading(line, heading_map):

    cleaned = clean_heading(line)

    for canonical, aliases in heading_map.items():

        for alias in aliases:

            if cleaned == alias.lower():
                return canonical

    return None


def detect_sections(pages, document_type):

    heading_map = (
        RESUME_HEADINGS
        if document_type == "resume"
        else JD_HEADINGS
    )

    sections = {}

    current_section = None

    for page in pages:

        lines = page.text.split("\n")

        for line in lines:

            line = line.strip()

            if not line:
                continue

            heading = find_heading(
                line,
                heading_map
            )

            if heading:

                current_section = heading

                if heading not in sections:
                    sections[heading] = SectionData()

                if page.page not in sections[heading].pages:
                    sections[heading].pages.append(
                        page.page
                    )

                continue

            if current_section:

                section = sections[current_section]

                if section.text:
                    section.text += "\n"

                section.text += line

                if page.page not in section.pages:
                    section.pages.append(
                        page.page
                    )

    return sections