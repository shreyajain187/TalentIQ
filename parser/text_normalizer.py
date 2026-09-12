import re


def normalize_text(text: str) -> str:

    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    cleaned_lines = []

    for line in text.split("\n"):

        line = re.sub(
            r"[ \t]+",
            " ",
            line
        ).strip()

        if line:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


def combine_pages(pages) -> str:

    return "\n\n".join(
        page.text
        for page in pages
        if page.text
    )