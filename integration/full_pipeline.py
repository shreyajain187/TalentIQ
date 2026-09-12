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
# PERSON 2 - MATCHING / RANKING / INTERVIEW QUESTIONS
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

DEFAULT_RESUME_FOLDER = "data/resumes"

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
# GENERATE INTERVIEW PLANS
# ============================================================

def generate_interview_plans(
    session,
    rankings,
    max_questions=8
):

    interview_plans = {}

    for row in rankings:

        candidate_id = row.get(
            "candidate_id"
        )

        if not candidate_id:
            continue

        try:

            plan = session.interview_questions(
                candidate_id,
                max_questions=max_questions
            )

            interview_plans[
                candidate_id
            ] = plan

        except ValueError as e:

            print(
                "      WARNING -> "
                f"Interview questions failed for "
                f"{candidate_id}: {e}"
            )

    return interview_plans


# ============================================================
# MAIN FULL PIPELINE
# ============================================================

def run_full_pipeline(
    jd_path=DEFAULT_JD_PATH,
    resume_folder=DEFAULT_RESUME_FOLDER
):

    print()
    print("=" * 70)
    print("                  TALENTIQ FULL PIPELINE")
    print("=" * 70)

    # ========================================================
    # STEP 1 - PERSON 1: PARSE JD
    # ========================================================

    print()
    print("[1/7] Parsing Job Description...")

    job = parse_job(
        jd_path
    )

    print(
        f"      OK -> {job['filename']}"
    )

    print(
        f"      Pages: {len(job['pages'])}"
    )

    # ========================================================
    # STEP 2 - PERSON 1: PARSE RESUMES
    # ========================================================

    print()
    print("[2/7] Parsing resumes...")

    resume_results = parse_all_resumes(
        resume_folder
    )

    successful, failed = (
        count_parse_results(
            resume_results
        )
    )

    print(
        f"      Successful: {successful}"
    )

    print(
        f"      Failed:     {failed}"
    )

    print(
        f"      Total:      "
        f"{len(resume_results)}"
    )

    if successful == 0:

        raise RuntimeError(
            "No resumes were parsed successfully."
        )

    # Show parsing failures without killing
    # the entire application.

    for item in resume_results:

        if item.get("status") != "success":

            print(
                "      WARNING -> "
                f"{item.get('filename', 'Unknown file')}: "
                f"{item.get('error', 'Unknown parsing error')}"
            )

    # ========================================================
    # STEP 3 - BUILD SHARED PAYLOAD
    # ========================================================

    print()
    print("[3/7] Building shared parser payload...")

    # IMPORTANT:
    #
    # Keep the wrapped resume structure returned
    # by parse_all_resumes().
    #
    # Person 2's parser_adapter handles it.
    # Person 3's team integration also supports it.

    payload = {
        "job": job,
        "resumes": resume_results
    }

    print(
        "      Payload ready."
    )

    # ========================================================
    # STEP 4 - LOAD CRITERIA
    # ========================================================

    print()
    print("[4/7] Loading matching criteria...")

    criteria = load_criteria()

    print(
        f"      OK -> {CRITERIA_PATH}"
    )

    # ========================================================
    # STEP 5 - PERSON 2:
    # MATCH + SCORE + RANK
    # ========================================================

    print()
    print("[5/7] Running matching engine...")

    session = RankingSession()

    rankings = session.evaluate(
        payload,
        criteria
    )

    print(
        "      Ranking complete."
    )

    print(
        f"      Candidates returned: "
        f"{len(rankings)}"
    )

    # --------------------------------------------------------
    # DISPLAY RANKING SUMMARY
    # --------------------------------------------------------

    ranked_candidates = [
        row
        for row in rankings
        if row.get("rank") is not None
    ]

    if ranked_candidates:

        print()
        print("      RANKING")
        print("      " + "-" * 55)

        for row in ranked_candidates:

            print(
                f"      #{row['rank']} "
                f"{row['filename']} "
                f"-> "
                f"{row['final_score']:.2f}/100"
            )

    # ========================================================
    # PERSON 2 - INTERVIEW QUESTIONS
    # ========================================================

    print()
    print(
        "      Generating interview plans..."
    )

    interview_plans = (
        generate_interview_plans(
            session,
            rankings,
            max_questions=8
        )
    )

    print(
        f"      Interview plans generated: "
        f"{len(interview_plans)}"
    )

    # ========================================================
    # STEP 6 - PERSON 3:
    # EXPLANATIONS + EVIDENCE
    # ========================================================

    print()
    print("[6/7] Building explanations...")

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

    # ========================================================
    # STEP 7 - FINAL OUTPUT
    # ========================================================

    print()
    print("[7/7] Building final output...")

    final_result = {

        # ====================================================
        # PERSON 1
        # ====================================================

        "job": job,

        "resumes": resume_results,

        "parse_summary": {
            "successful": successful,
            "failed": failed,
            "total": len(resume_results)
        },

        # ====================================================
        # PERSON 2
        # ====================================================

        "rankings": rankings,

        "interview_plans": (
            interview_plans
        ),

        # ====================================================
        # PERSON 3
        # ====================================================

        "explanations": (
            explanation_view
        ),

        # ====================================================
        # PERSON 4 CONVENIENCE FIELDS
        # ====================================================

        "top_three": (
            explanation_view.get(
                "top_three",
                []
            )
        ),

        "unranked": (
            explanation_view.get(
                "unranked",
                []
            )
        ),

        "validation": (
            explanation_view.get(
                "validation",
                []
            )
        )
    }

    print(
        "      Final result created."
    )

    print()
    print("=" * 70)
    print("                  PIPELINE COMPLETE")
    print("=" * 70)
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
# DISPLAY TOP CANDIDATES
# ============================================================

def display_top_candidates(
    result
):

    top_three = result.get(
        "top_three",
        []
    )

    if not top_three:

        print(
            "No ranked candidates "
            "were available."
        )

        return

    print()
    print("TOP CANDIDATES")
    print("=" * 70)

    for candidate in top_three:

        print()

        print(
            candidate["summary"]
        )

        print(
            f"Resume: "
            f"{candidate['filename']}"
        )

        # ----------------------------------------------------
        # REQUIRED GAPS
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # VERIFIED MATCHES
        # ----------------------------------------------------

        matches = candidate.get(
            "matches",
            []
        )

        print(
            f"Verified matches: "
            f"{len(matches)}"
        )

        # ----------------------------------------------------
        # PERSON 2 INTERVIEW PLAN
        # ----------------------------------------------------

        candidate_id = candidate.get(
            "resume_id"
        )

        plan = (
            result
            .get(
                "interview_plans",
                {}
            )
            .get(
                candidate_id
            )
        )

        if plan:

            questions = plan.get(
                "questions",
                []
            )

            print(
                f"Interview questions: "
                f"{len(questions)}"
            )

            # Display first 3 in terminal.
            # All questions remain in JSON.

            for question in questions[:3]:

                print(
                    "  - "
                    + question.get(
                        "question",
                        ""
                    )
                )

        print(
            "-" * 70
        )


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":

    try:

        # ----------------------------------------------------
        # RUN COMPLETE PIPELINE
        # ----------------------------------------------------

        result = (
            run_full_pipeline()
        )

        # ----------------------------------------------------
        # SAVE JSON
        # ----------------------------------------------------

        save_final_result(
            result
        )

        # ----------------------------------------------------
        # TERMINAL SUMMARY
        # ----------------------------------------------------

        print()
        print(
            "SUCCESS: TalentIQ pipeline "
            "completed."
        )

        print()

        print(
            f"Final output -> "
            f"{FINAL_OUTPUT_PATH}"
        )

        # ----------------------------------------------------
        # SHOW TOP CANDIDATES
        # ----------------------------------------------------

        display_top_candidates(
            result
        )

    # ========================================================
    # FRIENDLY ERRORS
    # ========================================================

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

        # Keep traceback during development.
        raise