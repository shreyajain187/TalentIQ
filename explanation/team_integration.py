"""Read Person 2 results directly; no model, API, or third-party dependency."""
import json
import math
from pathlib import Path
from explanation.explanations import normalized


def build_team_explanations(payload, rankings):
    sources = {}
    for wrapped in payload["resumes"]:
        source = wrapped.get("data", wrapped)
        if source["id"] in sources:
            raise ValueError("Duplicate source ID")
        sources[source["id"]] = source
    output = {"top_three": [], "unranked": [], "validation": [],
              "scope": "Checks against supplied parsed text, not original PDFs. Skill coverage uses Person 2's selected criteria, not every JD qualification."}
    ranked = []
    ids = set()
    for row in rankings:
        cid = row["candidate_id"]
        if cid in ids:
            raise ValueError("Duplicate candidate ID")
        ids.add(cid)
        if row.get("rank") is None or row.get("final_score") is None:
            output["unranked"].append({"candidate_id": cid, "warnings": row.get("warnings", [])})
            continue
        source = sources[cid]
        if source["filename"] != row["filename"]:
            raise ValueError("Source filename mismatch")
        score = row["final_score"]
        dimensions, weights, contributions = row["dimension_scores"], row["effective_weights"], row["score_contributions"]
        if set(weights) != set(contributions) or not set(weights) <= set(dimensions):
            raise ValueError("Dimension keys differ")
        if not math.isfinite(score) or not 0 <= score <= 100:
            raise ValueError("Invalid score")
        if any(not math.isfinite(w) or w < 0 for w in weights.values()) or not math.isclose(sum(weights.values()), 1, abs_tol=1e-6):
            raise ValueError("Invalid effective weights")
        for key, weight in weights.items():
            if not math.isfinite(dimensions[key]) or not 0 <= dimensions[key] <= 100:
                raise ValueError("Invalid dimension score")
            if not math.isclose(dimensions[key] * weight, contributions[key], abs_tol=1e-5):
                raise ValueError("Contribution calculation mismatch")
        if not math.isclose(sum(contributions.values()), score, abs_tol=0.0001):
            raise ValueError("Final score does not match contributions")
        expected_gaps = {m["skill"] for m in row["skill_matches"] if m["group"] == "required" and m["status"] == "not_found"}
        if expected_gaps != set(row["missing_required_skills"]):
            raise ValueError("Missing-skill summary disagrees with skill matches")
        ranked.append(row)
    if any(a["final_score"] < b["final_score"] for a, b in zip(ranked, ranked[1:])):
        raise ValueError("Results are not in descending score order")
    if any(row["rank"] != i for i, row in enumerate(ranked, 1)):
        raise ValueError("Rank labels disagree with order")
    output["validation"].append(f"Checked score arithmetic, ranking order and missing-skill consistency for {len(ranked)} candidates.")
    for row in ranked[:3]:
        source = sources[row["candidate_id"]]
        item = {"resume_id": source["id"], "filename": source["filename"],
                "summary": f"Ranked #{row['rank']} with a match score of {row['final_score']:.2f}/100 under the current weights.",
                "matches": [], "required_gaps": [], "flags": list(row.get("warnings", [])), "questions": [],
                "score_contributions": row["score_contributions"], "effective_weights": row["effective_weights"]}
        complete = row.get("parse_status") == "ok"
        if not complete:
            item["flags"].append("Extraction is incomplete; review the original document.")
        questions = []
        for match in row["skill_matches"]:
            skill, status = match["skill"], match["status"]
            if status not in {"explicit", "inferred", "not_found"}:
                raise ValueError(f"Unsupported skill status: {status}")
            if status == "not_found":
                if match["group"] == "required":
                    item["required_gaps"].append(f"{skill}: no evidence found by the matcher in the supplied resume." if complete else f"{skill}: unable to assess reliably because extraction is incomplete.")
                    if complete:
                        questions.append((0, f"The supplied resume evidence does not show {skill}. Have you used it in coursework or a project? Describe your contribution."))
                continue
            quote, page = match.get("evidence"), match.get("page")
            pages = [p for p in source["pages"] if type(page) is int and p["page"] == page]
            if not quote or not any(normalized(quote) in normalized(p["text"]) for p in pages):
                item["flags"].append(f"{skill}: quote/page could not be verified against parsed source text.")
                continue
            section_names = []
            for name, section in source.get("sections", {}).items():
                if isinstance(section, dict) and page in section.get("pages", []) and normalized(quote) in normalized(section.get("text", "")):
                    section_names.append(name)
            section = section_names[0] if len(section_names) == 1 else None
            location = f"resume page {page}" + (f" under {section.title()}" if section else "")
            observed = match.get("observed_skill") or skill
            if status == "explicit":
                text = f"{observed} is explicitly mentioned on {location}."
                if match.get("alternatives"):
                    text += f" This matches the alternative requirement: {skill}."
            else:
                text = f"{skill} relevance is inferred from {observed} on {location}. Relationship reported by matcher: {match.get('relationship') or 'not supplied'}."
                item["flags"].append(f"{skill}: inferred relevance; verify direct experience.")
            item["matches"].append({"skill": skill, "match_type": status, "evidence_level": "not_assessed", "text": text,
                                    "evidence": [{"filename": source["filename"], "page": page, "section": section, "quote": quote, "verified_against": "parsed_page_text"}]})
            questions.append((1 if status == "inferred" else 2, f"Your resume mentions {observed} on page {page}. Describe your direct experience and personal contribution using it."))
        item["flags"].append("Representative skill excerpts do not establish implementation depth; listed-only versus demonstrated status has not been assessed.")
        item["questions"] = list(dict.fromkeys(q for _, q in sorted(questions, key=lambda pair: pair[0])))[:3]
        output["top_three"].append(item)
    if len(ranked) >= 2:
        a, b = ranked[:2]
        delta = {k: a["score_contributions"][k] - b["score_contributions"][k] for k in a["score_contributions"]}
        output["comparison"] = {"candidate_a": a["candidate_id"], "candidate_b": b["candidate_id"],
                                "score_difference": a["final_score"] - b["final_score"], "contribution_differences": delta,
                                "explanation": "Positive differences favor candidate A; negative differences favor candidate B. Values are weighted score points, not probabilities."}
    return output


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    data = root / "team_data"
    payload = json.loads((data / "parsed_data.json").read_text(encoding="utf-8"))
    rankings = json.loads((data / "rankings.json").read_text(encoding="utf-8"))
    result = build_team_explanations(payload, rankings)
    (root / "team_explanations.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    for candidate in result["top_three"]:
        print(candidate["filename"], candidate["summary"])
        print("  Verified matches:", len(candidate["matches"]))
        print("  Required gaps:", candidate["required_gaps"])
    print(*result["validation"], sep="\n")
    print("Saved team_explanations.json")
