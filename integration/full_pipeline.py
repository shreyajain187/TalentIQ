import json
from pathlib import Path

# ============================================================
# PERSON 1 - PARSER
# ============================================================

from integration.pipeline import (
    parse_job,
    parse_all_resumes
)

# ============================================================
# PERSON 2 - MATCHING / RANKING
# ============================================================

from ranking_session import RankingSession

# ============================================================
# PERSON 3 - EXPLANATIONS
# ============================================================

from explanation.team_integration import (
    build_team_explanations
)


# ============================================================
# CONFIGURATION
# ============================================================

CRITERIA_PATH = "criteria.json"

DEFAULT_JD_PATH = (
    "data/jd/job_description_backend_engineer.pdf"
)

DEFAULT_RESUME_FOLDER = (
    "data/resumes"
)

OUTPUT_FOLDER = "output"

FINAL_OUTPUT_PATH = (
    "output/final_results.json"
)


# ============================================================
# LOAD PERSON 2 CRITERIA
# ============================================================

def load_criteria(path=CRITERIA_PATH):

    criteria_path = Path(path)

    if not criteria_path.exists():
        raise FileNotFoundError(
            f"Criteria file not found: {path}"
        )

    with open(
        criteria_path,
        "r",
        encoding="utf-8-sig"
    ) as file:

        return json.load(file)


# ============================================================
# COUNT PARSER RESULTS
# ============================================================

def count_parse_results(resume_results):

    successful = 0
    failed = 0

    for item in resume_results:

        if item.get("status") == "success":
            successful += 1
        else:
            failed += 1

    return successful, failed


# ============================================================
# MAIN FULL PIPELINE
# ============================================================

def run_full_pipeline(
    jd_path=DEFAULT_JD_PATH,
    resume_folder=DEFAULT_RESUME_FOLDER
):

    print()
    print("=" * 65)
    print("              TALENTIQ FULL PIPELINE")
    print("=" * 65)

    # --------------------------------------------------------
    # STEP 1 - PERSON 1: PARSE JD
    # --------------------------------------------------------

    print()
    print("[1/6] Parsing Job Description...")

    job = parse_job(
        jd_path
    )

    print(
        f"      OK -> {job['filename']}"
    )

    print(
        f"      Pages: {len(job['pages'])}"
    )

    # --------------------------------------------------------
    # STEP 2 - PERSON 1: PARSE RESUMES
    # --------------------------------------------------------

    print()
    print("[2/6] Parsing resumes...")

    resume_results = parse_all_resumes(
        resume_folder
    )

    successful, failed = count_parse_results(
        resume_results
    )

    print(
        f"      Successful: {successful}"
    )

    print(
        f"      Failed:     {failed}"
    )

    if successful == 0:
        raise RuntimeError(
            "No resumes were parsed successfully."
        )

    # Display parsing failures but DO NOT crash
    for item in resume_results:

        if item.get("status") != "success":

            print(
                "      WARNING -> "
                f"{item.get('filename', 'Unknown file')}: "
                f"{item.get('error', 'Unknown parsing error')}"
            )

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Keep the ORIGINAL wrapped resume structure.
    #
    # Example:
    #
    # {
    #     "status": "success",
    #     "data": {
    #         "id": "...",
    #         "filename": "...",
    #         ...
    #     }
    # }
    #
    # Person 2's parser adapter can consume this format.
    # Person 3 explicitly supports it using:
    #
    # source = wrapped.get("data", wrapped)
    #
    # --------------------------------------------------------

    payload = {
        "job": job,
        "resumes": resume_results
    }

    # --------------------------------------------------------
    # STEP 3 - LOAD MATCHING CRITERIA
    # --------------------------------------------------------

    print()
    print("[3/6] Loading matching criteria...")

    criteria = load_criteria()

    print(
        f"      OK -> {CRITERIA_PATH}"
    )

    # --------------------------------------------------------
    # STEP 4 - PERSON 2: MATCH + RANK
    # --------------------------------------------------------

    print()
    print("[4/6] Running matching engine...")

    session = RankingSession()

    rankings = session.evaluate(
        payload,
        criteria
    )

    print(
        f"      Ranking complete."
    )

    print(
        f"      Candidates returned: "
        f"{len(rankings)}"
    )

    # --------------------------------------------------------
    # SHOW RANKING SUMMARY
    # --------------------------------------------------------

    ranked_candidates = [
        row
        for row in rankings
        if row.get("rank") is not None
    ]

    print()

    if ranked_candidates:

        print("      Ranking:")

        for row in ranked_candidates:

            print(
                f"      #{row['rank']} "
                f"{row['filename']} "
                f"-> {row['final_score']:.2f}/100"
            )

    # --------------------------------------------------------
    # STEP 5 - PERSON 3: EXPLANATIONS
    # --------------------------------------------------------

    print()
    print("[5/6] Building explanations...")

    explanation_view = (
        build_team_explanations(
            payload,
            rankings
        )
    )

    print(
        "      Explanations complete."
    )

    print(
        "      Top candidates explained: "
        f"{len(explanation_view.get('top_three', []))}"
    )

    # --------------------------------------------------------
    # STEP 6 - BUILD FINAL OUTPUT
    # --------------------------------------------------------

    print()
    print("[6/6] Building final output...")

    final_result = {

        # Person 1
        "job": job,

        "resumes": resume_results,

        "parse_summary": {
            "successful": successful,
            "failed": failed,
            "total": len(resume_results)
        },

        # Person 2
        "rankings": rankings,

        # Person 3
        "explanations": explanation_view,

        # Convenient field for Person 4
        "top_three": explanation_view.get(
            "top_three",
            []
        ),

        "unranked": explanation_view.get(
            "unranked",
            []
        )
    }

    print(
        "      Final result created."
    )

    print()
    print("=" * 65)
    print("              PIPELINE COMPLETE")
    print("=" * 65)
    print()

    return final_result


# ============================================================
# SAVE FINAL RESULT
# ============================================================

def save_final_result(
    result,
    output_path=FINAL_OUTPUT_PATH
):

    output_file = Path(
        output_path
    )

    output_file.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            result,
            file,
            indent=2,
            ensure_ascii=False
        )

    print(
        f"Saved -> {output_file}"
    )


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":

    try:

        result = run_full_pipeline()

        save_final_result(
            result
        )

        print()
        print(
            "SUCCESS: TalentIQ pipeline completed."
        )

        print(
            "Final output:"
        )

        print(
            FINAL_OUTPUT_PATH
        )

        print()

        top_three = result.get(
            "top_three",
            []
        )

        if top_three:

            print("TOP CANDIDATES")
            print("-" * 65)

            for candidate in top_three:

                print(
                    candidate["summary"]
                )

                print(
                    f"Resume: "
                    f"{candidate['filename']}"
                )

                gaps = candidate.get(
                    "required_gaps",
                    []
                )

                if gaps:

                    print(
                        "Required gaps:"
                    )

                    for gap in gaps:
                        print(
                            f"  - {gap}"
                        )

                else:

                    print(
                        "Required gaps: None"
                    )

                print()

        else:

            print(
                "No ranked candidates "
                "were available."
            )

    except FileNotFoundError as e:

        print()
        print(
            "FILE ERROR:"
        )
        print(e)

    except ValueError as e:

        print()
        print(
            "VALIDATION ERROR:"
        )
        print(e)

    except Exception as e:

        print()
        print(
            "PIPELINE ERROR:"
        )
        print(
            f"{type(e).__name__}: {e}"
        )

        raise