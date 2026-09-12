import json
from pathlib import Path

from integration.pipeline import (
    parse_job,
    parse_all_resumes
)


JD_FOLDER = "data/jd"
RESUME_FOLDER = "data/resumes"
OUTPUT_FOLDER = "output"


def find_jd():

    pdfs = list(
        Path(JD_FOLDER).glob("*.pdf")
    )

    if not pdfs:
        raise FileNotFoundError(
            "No JD PDF found in data/jd"
        )

    if len(pdfs) > 1:
        print(
            "WARNING: Multiple JD PDFs found. "
            "Using the first one."
        )

    return str(pdfs[0])


def main():

    print("=" * 60)
    print("RESUME MATCHER - DATA PIPELINE")
    print("=" * 60)

    Path(OUTPUT_FOLDER).mkdir(
        exist_ok=True
    )

    jd_path = find_jd()

    print("\nParsing JD...")

    job = parse_job(jd_path)

    print(
        f"OK: {job['filename']}"
    )

    print(
        f"Pages: {len(job['pages'])}"
    )

    print(
        "Skills:",
        ", ".join(job["skills"])
    )

    print("\nParsing resumes...")

    resumes = parse_all_resumes(
        RESUME_FOLDER
    )

    successful = 0
    failed = 0

    for index, result in enumerate(
        resumes,
        start=1
    ):

        if result["status"] == "success":

            successful += 1

            resume = result["data"]

            print(
                f"[{index:02}] ✓ "
                f"{resume['filename']} | "
                f"{len(resume['pages'])} pages | "
                f"{len(resume['skills'])} skills"
            )

        else:

            failed += 1

            print(
                f"[{index:02}] ✗ "
                f"{result['filename']} | "
                f"{result['error']}"
            )

    output = {
        "job": job,
        "resumes": resumes
    }

    output_file = (
        Path(OUTPUT_FOLDER)
        / "parsed_data.json"
    )

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            output,
            f,
            indent=2,
            ensure_ascii=False
        )

    print("\n" + "=" * 60)

    print(
        f"Successful: {successful}"
    )

    print(
        f"Failed:     {failed}"
    )

    print(
        f"Output: {output_file}"
    )

    print("=" * 60)


if __name__ == "__main__":
    main()