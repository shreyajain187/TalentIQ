# Person 2 integration

Run `python team_integration.py` from this folder. It writes `team_explanations.json`. Run `python -m unittest -v` for the synthetic and team integration checks.

The original `demo.py` remains the synthetic exercise. The new integration consumes Person 2's native fields directly, including candidate_id, dimension_scores, skill_matches, and weighted contributions. It supports the supplied wrapped resumes and section objects without modifying their storage format. Only JSON data was imported from the ZIP; no bundled code or downloads were run.

In Person 1's application:

```python
from team_integration import build_team_explanations

# payload is the parsed job/resumes object used for this evaluation.
view = build_team_explanations(payload, engine.results)
# After a successful weight change:
view = build_team_explanations(payload, updated_results)
```

Give Person 4 `view['top_three']`. Fields: summary, matches, required_gaps, flags, questions, score_contributions, effective_weights. Show `view['unranked']` separately and catch ValueError for invalid ranking data. Evidence is checked against parsed page text, not the original PDFs. Missing source IDs raise KeyError and require the matching parser payload.

Explicit mentions stay explicit mentions. The engine supplies representative excerpts, not a complete per-skill assessment of implementation depth. Consequently evidence_level is not_assessed; never display it as listed-only or demonstrated. Broad source text may contain project evidence beyond the selected excerpt. Section labels are used only when the quote and page match a unique supplied section object. String sections produce page-only citations.

This sample contains two candidates; no third is invented. Technical criteria are selected from the supplied backend JD, not the original hackathon's unavailable complete evaluation pool. Education, communication, problem solving, and other qualifications are not all represented in technical-skill coverage. An empty required_gaps list means none among the selected matcher criteria.

Local verification: weighted contributions, final score rounding, rank order, missing-skill consistency, and source quote checks. The module does not rerun or independently validate the semantic model, infer hiring probability, or prove ranking quality across the full applicant pool.
