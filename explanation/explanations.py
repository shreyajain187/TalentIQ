"""Local, deterministic explanations. No third-party packages or network calls."""
import math
import re


def normalized(text):
    return re.sub(r"\s+", " ", text).strip()


def validate_evidence(resume, evidence):
    """Validate page quote; section is displayed only with explicit provenance."""
    quote = evidence.get("quote", "")
    page_number = evidence.get("page")
    if not isinstance(quote, str) or not normalized(quote):
        return None
    if type(page_number) is not int or page_number < 1:
        return None
    page = next((p for p in resume["pages"] if p["page"] == page_number), None)
    if page is None or normalized(quote) not in normalized(page["text"]):
        return None
    section = evidence.get("section")
    # Presence in both strings alone does not establish section/page provenance.
    section_verified = (
        evidence.get("section_verified") is True
        and section in resume["sections"]
        and normalized(quote) in normalized(resume["sections"][section])
    )
    return {
        "filename": resume["filename"], "page": page_number,
        "section": section if section_verified else None, "quote": quote,
    }


def explain_candidate(resume, jd, result, rank, parse_status="ok"):
    if result["resume_id"] != resume["id"] or result["jd_id"] != jd["id"]:
        raise ValueError("Matching result belongs to a different resume or JD")
    if type(rank) is not int or rank < 1:
        raise ValueError("Rank must be a positive integer")
    if parse_status not in {"ok", "partial", "failed"}:
        raise ValueError("Unknown parsing status")
    score = result["final_score"]
    if isinstance(score, bool) or not isinstance(score, (int, float)) or not math.isfinite(score) or not 0 <= score <= 100:
        raise ValueError("Final score must be finite and between 0 and 100")
    output = {
        "resume_id": resume["id"],
        "summary": f"Ranked #{rank} with a match score of {score:.2f}/100 under the current weights.",
        "matches": [], "required_gaps": [], "flags": [], "questions": [],
    }
    if parse_status != "ok":
        output["flags"].append("Extraction is incomplete; review the original PDF before drawing conclusions.")
    question_candidates = []
    seen = set()
    requirements = result["requirements"]
    if not requirements:
        output["flags"].append("No requirement assessments were supplied; gap coverage cannot be verified.")
    for match in requirements:
        skill = match["skill"].strip()
        if not skill or skill.casefold() in seen:
            raise ValueError("Requirement skills must be nonempty and unique")
        seen.add(skill.casefold())
        kind, level = match["match_type"], match["evidence_level"]
        required = match["required"]
        if type(required) is not bool:
            raise ValueError("required must be a boolean")
        if kind not in {"exact", "inferred", "missing"} or level not in {"demonstrated", "listed", "none"}:
            raise ValueError("Unknown match type or evidence level")
        if kind == "missing":
            if match.get("evidence") or level != "none":
                raise ValueError("Missing matches cannot carry positive evidence")
            if required:
                output["required_gaps"].append(
                    f"{skill}: no evidence found in the extracted resume." if parse_status == "ok"
                    else f"{skill}: unable to assess reliably because extraction is incomplete."
                )
                if parse_status == "ok":
                    question_candidates.append((0, skill, f"The extracted resume does not show {skill}. Have you used it in coursework or a project? Describe your contribution."))
            continue
        citations = []
        for evidence in match.get("evidence", []):
            citation = validate_evidence(resume, evidence)
            if citation:
                citations.append(citation)
            else:
                output["flags"].append(f"{skill}: a source quote failed page validation.")
        if not citations or level == "none":
            output["flags"].append(f"{skill}: match lacks usable supporting evidence; manual review required.")
            continue
        first = citations[0]
        location = f"resume page {first['page']}"
        if first["section"]:
            location += f" under {first['section'].title()}"
        if kind == "inferred":
            reason = match.get("reason", "").strip()
            if not reason:
                output["flags"].append(f"{skill}: inference rule explanation is missing.")
                continue
            wording = f"{skill} relevance is inferred from evidence on {location}. {reason}"
            output["flags"].append(f"{skill}: verify direct experience; this is an inference.")
            question_candidates.append((1 if required else 4, skill, f"Related evidence suggests {skill} relevance: {reason} What direct experience do you have with {skill}, and what did you personally implement?"))
        elif level == "listed":
            wording = f"{skill} is explicitly listed on {location}."
            output["flags"].append(f"{skill}: listed without supporting project/work evidence in the matching results.")
            question_candidates.append((2 if required else 4, skill, f"Your resume lists {skill}. Describe a specific use, your contribution, and a problem you solved."))
        else:
            wording = f"{skill} has explicit project/work evidence on {location}."
            question_candidates.append((3, skill, f"Regarding this evidence on page {first['page']}: \"{first['quote']}\" What did you personally implement, and how did you test it?"))
        output["matches"].append({"skill": skill, "match_type": kind, "evidence_level": level, "text": wording, "evidence": citations})
    ordered_questions = [q for _, _, q in sorted(question_candidates, key=lambda x: (x[0], x[1].casefold()))]
    output["questions"] = list(dict.fromkeys(ordered_questions))[:3]
    return output


def build_top_three(resumes, jd, ranked_results, parse_status):
    """Consume Person 2's ordered results; do not silently reorder their ranking."""
    by_id = {r["id"]: r for r in resumes}
    if len(by_id) != len(resumes):
        raise ValueError("Duplicate resume IDs")
    ids = [r["resume_id"] for r in ranked_results]
    if len(set(ids)) != len(ids) or any(i not in by_id for i in ids):
        raise ValueError("Duplicate or unknown ranked resume IDs")
    scores = [r["final_score"] for r in ranked_results]
    if any(isinstance(s, bool) or not isinstance(s, (int, float)) or not math.isfinite(s) or not 0 <= s <= 100 for s in scores):
        raise ValueError("Invalid ranking score")
    if any(a < b for a, b in zip(scores, scores[1:])):
        raise ValueError("Matching results are not sorted by descending score")
    return [explain_candidate(by_id[r["resume_id"]], jd, r, i, parse_status.get(r["resume_id"], "partial"))
            for i, r in enumerate(ranked_results[:3], 1)]
