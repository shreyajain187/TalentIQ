from dataclasses import asdict
from pathlib import Path
from parser.file_parser import SUPPORTED_EXTENSIONS
from parser.document_parser import parse_document


def parse_job(jd_path):

    job = parse_document(
        jd_path,
        "jd"
    )

    return asdict(job)


def parse_resume(resume_path):

    resume = parse_document(
        resume_path,
        "resume"
    )

    return asdict(resume)


def parse_all_resumes(folder):

    results = []

    SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".xml"
}


def parse_all_resumes(folder):

    results = []

    files = sorted(
        path
        for path in Path(folder).iterdir()
        if path.is_file()
        and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    for file in files:

        try:
            parsed = parse_resume(
                str(file)
            )

            results.append({
                "status": "success",
                "data": parsed
            })

        except Exception as e:
            results.append({
                "status": "error",
                "filename": file.name,
                "error": str(e)
            })

    return results

    for pdf in pdf_files:

        try:

            parsed = parse_resume(
                str(pdf)
            )

            results.append({
                "status": "success",
                "data": parsed
            })

        except Exception as e:

            results.append({
                "status": "error",
                "filename": pdf.name,
                "error": str(e)
            })

    return results