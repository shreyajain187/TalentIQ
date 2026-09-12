"""Evidence-backed local résumé ranking. Public entry point: evaluate_candidates."""
from __future__ import annotations

import math
import re
from functools import lru_cache
from pathlib import Path
from parser_adapter import normalize_document

DEFAULT_WEIGHTS = dict(semantic=35, required_skills=30, preferred_skills=15,
                       experience=10, projects=10)
MODEL_PATH = Path(__file__).parent / "models" / "all-MiniLM-L6-v2"

# Edges mean: observed skill supports target skill. Never traverse transitively.
ALIASES = {
    "JavaScript": ["javascript", "js"], "TypeScript": ["typescript", "ts"],
    "Node.js": ["node.js", "nodejs", "node js", "node"],
    "Express": ["express", "express.js", "expressjs"],
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs"], "Vue": ["vue", "vue.js", "vuejs"],
    "Angular": ["angular"], "HTML": ["html", "html5"],
    "CSS": ["css", "css3"], "Tailwind CSS": ["tailwind", "tailwind css"],
    "REST APIs": ["rest", "rest api", "rest apis", "restful", "restful apis"],
    "GraphQL": ["graphql"], "MongoDB": ["mongodb", "mongo db"],
    "SQL": ["sql"], "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"], "SQLite": ["sqlite", "sqlite3"],
    "Redis": ["redis"], "Python": ["python", "python3"],
    "Django": ["django"], "Flask": ["flask"], "FastAPI": ["fastapi"],
    "Java": ["java"], "Spring Boot": ["spring boot", "springboot"],
    "C++": ["c++"], "C#": ["c#"], ".NET": [".net", "dotnet"],
    "Docker": ["docker"], "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"], "Azure": ["azure"],
    "Google Cloud": ["google cloud", "gcp", "google cloud platform"],
    "Microservices": ["microservices", "microservice"],
    "Jenkins": ["jenkins"], "GitHub Actions": ["github actions"],
    "Git": ["git"], "GitHub": ["github"],
    "CI/CD": ["ci/cd", "ci cd", "continuous integration"],
    "Linux": ["linux"], "Jest": ["jest"], "pytest": ["pytest"],
}
RELATIONSHIPS = {
    "Express": ["Node.js"], "Node.js": ["JavaScript"],
    "Next.js": ["React"], "PostgreSQL": ["SQL"], "MySQL": ["SQL"],
    "SQLite": ["SQL"], "Django": ["Python"], "Flask": ["Python"],
    "FastAPI": ["Python"], "Spring Boot": ["Java"], "Tailwind CSS": ["CSS"],
}
ALIAS_LOOKUP = {alias.casefold(): name for name, aliases in ALIASES.items()
                for alias in [name, *aliases]}


def canonical_skill(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Skills must be nonempty strings.")
    if "|" in value:
        return " | ".join(dict.fromkeys(canonical_skill(part) for part in value.split("|")))
    return ALIAS_LOOKUP.get(value.strip().casefold(), value.strip())


def _skills(values):
    if isinstance(values, str):
        raise ValueError("Pass skills as a list of strings, not a single string.")
    return list(dict.fromkeys(canonical_skill(v) for v in values))


def _pattern(skill):
    aliases = ALIASES.get(skill, [skill])
    return re.compile(r"(?<![\w+#])(?:" + "|".join(
        re.escape(a) for a in sorted(aliases, key=len, reverse=True)) + r")(?![\w+#])", re.I)


def _negated(text, match):
    # Conservative handling of common explicit negatives; not full language parsing.
    prefix = text[max(0, match.start() - 65):match.start()]
    suffix = text[match.end():match.end() + 35]
    return bool(re.search(r"\b(?:no|not|never|without|lack|lacks|lacking)\b[^.;!?\n]*$", prefix, re.I)
                or re.match(r"\s+(?:experience\s+)?(?:not\s+(?:used|known)|is\s+missing)\b", suffix, re.I))


def _split(text, size=120, overlap=20):
    """Keep exact source slices; short overlapping windows avoid model truncation."""
    result = []
    for paragraph in re.split(r"\n\s*\n", text):
        words = list(re.finditer(r"\S+", paragraph))
        for start in range(0, len(words), size - overlap):
            end = min(start + size, len(words))
            result.append(paragraph[words[start].start():words[end - 1].end()])
            if end == len(words):
                break
    return result


def _pages(doc):
    doc = normalize_document(doc)
    pages = doc.get("pages") or []
    usable = [{"page": p.get("page"), "text": p.get("text", "")}
              for p in pages if isinstance(p, dict) and isinstance(p.get("text"), str)
              and p["text"].strip()]
    if usable:
        return usable
    full = doc.get("fullText", "")
    return [{"page": None, "text": full}] if isinstance(full, str) and full.strip() else []


def _chunks(doc, section=None):
    doc = normalize_document(doc)
    pages = _pages(doc)
    if section is None:
        return [{"text": t, "page": p["page"], "section": "document"}
                for p in pages for t in _split(p["text"])]
    text = (doc.get("sections") or {}).get(section) or ""
    if not isinstance(text, str):
        raise ValueError(f"Section {section!r} must be text.")
    return [{"text": t, "page": next((p["page"] for p in pages if t in p["text"]), None),
             "section": section} for t in _split(text)]


def detect_skills(doc):
    """Suggestions only: recruiter decides which skills are required/preferred."""
    text = "\n".join(p["text"] for p in _pages(doc))
    return [skill for skill in ALIASES
            if any(not _negated(text, m) for m in _pattern(skill).finditer(text))]


def _find_skill(pages, skill):
    for page in pages:
        text = page["text"]
        for match in _pattern(skill).finditer(text):
            if _negated(text, match):
                continue
            # Exact excerpt with enough context, restricted to its source line.
            left = max(text.rfind("\n", 0, match.start()) + 1, match.start() - 120)
            newline = text.find("\n", match.end())
            right = min(newline if newline >= 0 else len(text), match.end() + 160)
            return {"evidence": text[left:right], "page": page["page"]}
    return None


def match_skills(doc, required_skills, preferred_skills):
    pages = _pages(doc)
    rows = []
    for group, skills in [("required", required_skills), ("preferred", preferred_skills)]:
        for skill in skills:
            skill = canonical_skill(skill)
            if " | " in skill:
                alternatives = skill.split(" | ")
                options = match_skills(doc, alternatives if group == "required" else [],
                                       alternatives if group == "preferred" else [])
                best = max(options, key=lambda row: row["credit"]).copy()
                best.update(skill=skill, alternatives=alternatives)
                rows.append(best)
                continue
            evidence = _find_skill(pages, skill)
            observed = skill if evidence else None
            status, credit = ("explicit", 1.0) if evidence else ("not_found", 0.0)
            if not evidence:
                for source, targets in RELATIONSHIPS.items():
                    if skill in targets:
                        evidence = _find_skill(pages, source)
                        if evidence:
                            observed, status, credit = source, "inferred", 0.7
                            break
            rows.append(dict(skill=skill, group=group, status=status, credit=credit,
                             observed_skill=observed,
                             relationship=f"{observed} -> {skill}" if status == "inferred" else None,
                             **(evidence or {"evidence": None, "page": None})))
    return rows


class LocalEmbedder:
    """Lazy, CPU-only, offline model. Download explicitly with download_model.py."""
    def __init__(self, model_path=MODEL_PATH):
        self.model_path = str(model_path)
        self._model = None
        self._cache = {}

    def encode(self, texts):
        missing = list(dict.fromkeys(t for t in texts if t not in self._cache))
        if missing:
            if self._model is None:
                try:
                    from sentence_transformers import SentenceTransformer
                except ImportError as exc:
                    raise RuntimeError("Install requirements.txt before semantic matching.") from exc
                if not Path(self.model_path).is_dir():
                    raise RuntimeError("Local model missing. Run download_model.py while online first.")
                self._model = SentenceTransformer(self.model_path, device="cpu", local_files_only=True)
            vectors = self._model.encode(missing, normalize_embeddings=True,
                                         show_progress_bar=False, batch_size=32)
            self._cache.update(zip(missing, [v.tolist() for v in vectors]))
        return [self._cache[t] for t in texts]


@lru_cache(maxsize=1)
def _default_embedder():
    return LocalEmbedder()


def _cosine(a, b):
    if len(a) != len(b):
        raise ValueError("Embedding dimensions do not match.")
    denominator = math.sqrt(sum(x*x for x in a) * sum(x*x for x in b))
    return max(0.0, min(1.0, sum(x*y for x, y in zip(a, b)) / denominator)) if denominator else 0.0


def _semantic(queries, chunks, vectors):
    if not chunks:
        return 0.0, []
    evidence = []
    for query in queries:
        scores = [_cosine(vectors[query], vectors[c["text"]]) for c in chunks]
        index = max(range(len(scores)), key=scores.__getitem__)
        evidence.append(dict(requirement=query, similarity=round(scores[index], 6),
                             evidence=chunks[index]["text"], page=chunks[index]["page"],
                             section=chunks[index]["section"]))
    return 100 * sum(e["similarity"] for e in evidence) / len(queries), evidence


def normalize_weights(weights=None, inactive_dimensions=()):
    result = DEFAULT_WEIGHTS.copy()
    if weights is not None:
        if set(weights) - set(result):
            raise ValueError("Unknown weight dimension.")
        result.update(weights)
    for key, value in result.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
            raise ValueError("Weights must be finite, nonnegative numbers.")
    for key in inactive_dimensions:
        result[key] = 0
    total = sum(result.values())
    if total == 0:
        raise ValueError("At least one active weight must be greater than zero.")
    return {key: value / total for key, value in result.items()}


def rerank_candidates(results, weights=None):
    """No model calls. Returns copies with ranks, prior ranks and rank movement."""
    ranked = []
    for result in results:
        row = result.copy()
        effective = normalize_weights(weights, row.get("inactive_dimensions", []))
        row["effective_weights"] = effective
        row["score_contributions"] = {k: row["dimension_scores"][k] * w for k, w in effective.items()}
        row["final_score"] = round(sum(row["score_contributions"].values()), 4) if row["parse_status"] == "ok" else None
        row["previous_rank"] = row.get("rank")
        ranked.append(row)
    ranked.sort(key=lambda r: (r["final_score"] is None, -(r["final_score"] or 0), r["candidate_id"]))
    for rank, row in enumerate(ranked, 1):
        row["rank"] = rank if row["parse_status"] == "ok" else None
        row["rank_change"] = row["previous_rank"] - rank if row["previous_rank"] is not None and row["rank"] is not None else None
    return ranked


def evaluate_candidates(jd, resumes, required_skills, preferred_skills, weights=None, *, embedder=None):
    """Accept Person 1 parser dictionaries; return JSON-serializable ranked rows.

    embedder is optional dependency injection for tests, with encode(list[str]).
    Missing skill groups are inactive. Missing résumé sections receive zero
    documented relevance, with an explicit warning. Unreadable files are unranked.
    """
    jd = normalize_document(jd)
    resumes = [normalize_document(r) for r in resumes]
    required, preferred = _skills(required_skills), _skills(preferred_skills)
    preferred = [s for s in preferred if s not in required]
    inactive = [k for k, v in [("required_skills", required), ("preferred_skills", preferred)] if not v]
    normalize_weights(weights, inactive)
    sections = jd.get("sections") or {}
    query_text = sections.get("responsibilities") or sections.get("requirements") or jd.get("fullText") or "\n".join(p["text"] for p in _pages(jd))
    queries = list(dict.fromkeys(chunk for line in query_text.splitlines() if line.strip()
                                 for chunk in _split(line)))
    if not queries:
        raise ValueError("The JD contains no usable text.")
    ids = [r.get("id") for r in resumes]
    if any(not isinstance(i, str) or not i.strip() for i in ids) or len(set(ids)) != len(ids):
        raise ValueError("Every résumé needs a unique nonempty string id.")
    prepared, texts = [], list(queries)
    for resume in resumes:
        groups = {"semantic": _chunks(resume), "experience": _chunks(resume, "experience"),
                  "projects": _chunks(resume, "projects")}
        prepared.append((resume, groups))
        texts.extend(c["text"] for group in groups.values() for c in group)
    texts = list(dict.fromkeys(texts))
    vectors = {}
    if any(groups["semantic"] for _, groups in prepared):
        encoded = (embedder or _default_embedder()).encode(texts)
        if len(encoded) != len(texts):
            raise ValueError("Embedder returned the wrong number of vectors.")
        vectors = dict(zip(texts, encoded))
    results = []
    for resume, groups in prepared:
        valid = bool(groups["semantic"])
        matches = match_skills(resume, required, preferred) if valid else []
        scores, evidence = {}, {}
        for key, chunks in groups.items():
            scores[key], evidence[key] = _semantic(queries, chunks, vectors) if valid else (0.0, [])
        for key, group in [("required_skills", "required"), ("preferred_skills", "preferred")]:
            rows = [m for m in matches if m["group"] == group]
            scores[key] = 100 * sum(m["credit"] for m in rows) / len(rows) if rows else 0.0
            evidence[key] = rows
        warnings = [f"No {section} section detected; documented relevance is zero."
                    for section in ("experience", "projects") if not groups[section]]
        if not valid:
            warnings = ["No usable résumé text; repair extraction or supply fullText before ranking."]
        results.append(dict(candidate_id=resume["id"], filename=resume.get("filename", ""),
                            parse_status="ok" if valid else "empty_text", warnings=warnings,
                            dimension_scores={k: round(v, 6) for k, v in scores.items()},
                            skill_matches=matches, dimension_evidence=evidence,
                            inactive_dimensions=inactive,
                            missing_required_skills=[m["skill"] for m in matches
                                                     if m["group"] == "required" and m["status"] == "not_found"]))
    return rerank_candidates(results, weights)
