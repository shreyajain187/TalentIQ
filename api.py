import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import UploadFile

from integration.full_pipeline import run_full_pipeline


app = FastAPI(
    title="TalentIQ API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".xml"
}


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/api/analyze")
async def analyze(request: Request):

    # ---------------------------------------------
    # READ MULTIPART FORM
    # ---------------------------------------------

    form = await request.form()

    jd = form.get("jd")

    resumes = form.getlist("resumes")

    # ---------------------------------------------
    # VALIDATE JD
    # ---------------------------------------------

    if not isinstance(jd, UploadFile):

        raise HTTPException(
            status_code=400,
            detail="One JD file is required."
        )

    # ---------------------------------------------
    # VALIDATE RESUMES
    # ---------------------------------------------

    resumes = [
        item
        for item in resumes
        if isinstance(item, UploadFile)
    ]

    if not resumes:

        raise HTTPException(
            status_code=400,
            detail="At least one resume is required."
        )

    if len(resumes) > 18:

        raise HTTPException(
            status_code=400,
            detail="Maximum 18 resumes allowed."
        )

    # ---------------------------------------------
    # VALIDATE JD EXTENSION
    # ---------------------------------------------

    jd_extension = Path(
        jd.filename or ""
    ).suffix.lower()

    if jd_extension not in SUPPORTED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported JD format: "
                f"{jd_extension}"
            )
        )

    # ---------------------------------------------
    # VALIDATE RESUME EXTENSIONS
    # ---------------------------------------------

    for resume in resumes:

        extension = Path(
            resume.filename or ""
        ).suffix.lower()

        if extension not in SUPPORTED_EXTENSIONS:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported resume format: "
                    f"{resume.filename}"
                )
            )

    # ---------------------------------------------
    # CREATE TEMPORARY WORKSPACE
    # ---------------------------------------------

    try:

        with tempfile.TemporaryDirectory() as temp_dir:

            root = Path(temp_dir)

            jd_folder = root / "jd"
            resume_folder = root / "resumes"

            jd_folder.mkdir()
            resume_folder.mkdir()

            # -------------------------------------
            # SAVE JD
            # -------------------------------------

            jd_filename = Path(
                jd.filename or "job.pdf"
            ).name

            jd_path = (
                jd_folder /
                jd_filename
            )

            with open(
                jd_path,
                "wb"
            ) as output:

                shutil.copyfileobj(
                    jd.file,
                    output
                )

            # -------------------------------------
            # SAVE RESUMES
            # -------------------------------------

            for index, resume in enumerate(
                resumes,
                start=1
            ):

                filename = Path(
                    resume.filename
                    or f"resume_{index}.pdf"
                ).name

                resume_path = (
                    resume_folder /
                    filename
                )

                with open(
                    resume_path,
                    "wb"
                ) as output:

                    shutil.copyfileobj(
                        resume.file,
                        output
                    )

            # -------------------------------------
            # RUN COMPLETE TALENTIQ PIPELINE
            # -------------------------------------

            result = run_full_pipeline(
                str(jd_path),
                str(resume_folder)
            )

            return result

    except HTTPException:
        raise

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print(
            "ANALYSIS ERROR:",
            type(e).__name__,
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )