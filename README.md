# TalentIQ — Integrated Recruitment Project

TalentIQ parses a job description and resumes, computes candidate matches, and presents rankings, skill evidence, comparisons, interview questions, and JD insights in a Next.js frontend backed by a Python FastAPI service.

## Project structure

| Path | Purpose |
| --- | --- |
| `api.py` | HTTP API for uploading and analyzing documents |
| `parser/` | PDF, DOCX, TXT, and XML extraction and document parsing |
| `integration/full_pipeline.py` | Connects parsing, matching, explanations, and interview questions |
| `matching_engine.py` | Skill matching, semantic scores, and backend ranking |
| `ranking_session.py` | Stores results for recalculation within a ranking session |
| `interview_questions.py` | Generates questions from candidate evidence and gaps |
| `explanation/` | Candidate explanations and source evidence checks |
| `criteria.json` | Required and preferred skills used by the matcher |
| `frontend/` | Next.js application, including Candidates and JD Insights |
| `data/jd/` | Included backend-engineer JD PDF |
| `data/resumes/` | Included sample resumes |
| `test_data/` | JSON fixtures; separate from the 18 supplied test PDFs |
| `tests/` | Python unit tests |
| `download_model.py` | Downloads the model for later offline inference |
| `models/all-MiniLM-L6-v2/` | Local model directory, downloaded separately |

## Setup on Windows

Use Python 3.12, Node.js with npm, and PowerShell. Run backend commands from the project root, the folder containing `api.py` and `criteria.json`.

### 1. Prepare Python

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
```

The supplied `requirements.txt` ends with a shell command instead of a package requirement. To install its package pins without changing the original file, generate a filtered requirements file and install the API packages separately:

```powershell
Get-Content requirements.txt | Where-Object { $_ -notmatch '^python -m pip install' } | Set-Content requirements-install.txt
.\.venv\Scripts\python.exe -m pip install -r requirements-install.txt
.\.venv\Scripts\python.exe -m pip install fastapi uvicorn python-multipart
```

### 2. Prepare the offline model

If `models/all-MiniLM-L6-v2/` is missing, run this once with internet access:

```powershell
.\.venv\Scripts\python.exe download_model.py
```

The project uses `sentence-transformers/all-MiniLM-L6-v2` on CPU. Subsequent matching loads this local model without downloading it again. No model API key is needed.

### 3. Install frontend dependencies

```powershell
cd frontend
npm ci
```

## Run the application

Start the backend in one PowerShell terminal from the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
```

Start the frontend in a second terminal from `frontend/`:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend calls the API at `http://localhost:8000`. Use the `localhost:3000` frontend address because it is the origin allowed by the current API CORS configuration.

For a production frontend build:

```powershell
npm run build
npm start
```

Keep both services running. Press Ctrl+C in each terminal to stop services started this way.

## Use the supplied documents

1. Open the upload dialog in the frontend.
2. Select one JD, for example `data/jd/job_description_backend_engineer.pdf`.
3. Select between 1 and 18 resumes. Supported formats are PDF, DOCX, TXT, and XML.
4. Click **Analyze candidates** and wait for parsing and matching to complete.
5. Open **Candidates** to adjust weights, inspect candidate evidence, or compare candidates.
6. Open **JD Insights** to inspect the JD review.

The separately supplied archive, `drive-download-20260912T092713Z-1-001.zip`, contains 18 PDF resumes and no JD. Extract it and select the PDFs in the upload dialog; do not upload the ZIP itself.

On the machine where this project was prepared, those PDFs are extracted to:

```text
D:\Documents\ChatGPT\TalentIQ\work\test-dataset
```

The corrected source is located at:

```text
D:\Documents\ChatGPT\TalentIQ\work\final-integrated\TalentIQ-main
```

The running local setup uses the existing Python environment at `D:\Documents\ChatGPT\TalentIQ\.venv`. Replace the project-local Python path in the commands above with that environment's `Scripts\python.exe` when using this existing setup.

## How the sliders work

The frontend calculates overall fit from four scores:

| Dimension | Default weight |
| --- | ---: |
| Semantic fit | 35 |
| Required skills | 35 |
| Preferred skills | 20 |
| Experience relevance | 10 |

```text
Overall fit = round(sum(dimension score × weight) / sum(weights))
```

Changing a slider recalculates scores and sorts the candidate list immediately. It does not reparse resumes or rerun the model. Weights are relative and do not need to total 100. If all weights are zero, all overall scores are zero.

A weight change does not always change the order: candidates may have similar scores, or one candidate may lead on every dimension. Scores are rounded to whole numbers before sorting, so small changes can also produce ties. To see the effect clearly, compare semantic-only weighting with required-skills-only weighting, setting the other weights to zero.

The frontend's four-dimension formula differs from the backend ranking formula, which also supports a projects dimension. Backend final scores and frontend overall fit therefore need not be identical. Experience is documented semantic relevance, not a verified count of years worked.

## Fixes included

- Connected the candidate provider to `rankCandidates(analyses, weights)`. Previously it displayed the backend score and original order regardless of slider changes.
- Aligned the JD Insights adapter with the fields rendered by the page: quality, clarity, inclusivity, flags, and suggested rewrites.
- Added an analysis-updated event after uploads so the mounted provider reloads the new result without a manual refresh.
- Added a message when the wording checks suggest no rewrites.

JD insight scores are basic deterministic checks of parsed structure, skill groups, word count, and a small set of wording patterns. They are not a comprehensive bias audit. The matching criteria come from `criteria.json`, which currently targets the included backend-engineer JD; uploading another JD does not automatically replace those skill criteria. Review that file when evaluating another role.

## API and command-line checks

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Returns `{"status":"healthy"}` when the API is running |
| `POST /api/analyze` | Accepts multipart field `jd` and repeated fields `resumes` |
| `GET /docs` | FastAPI interactive documentation |

Check API availability:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Run the integrated pipeline with the bundled sample documents:

```powershell
.\.venv\Scripts\python.exe -m integration.full_pipeline
```

The command-line pipeline writes `output/final_results.json`. The browser upload flow returns results through the API and saves analysis in browser local storage.

## Verification

```powershell
# From the project root
.\.venv\Scripts\python.exe -m unittest discover -s tests -v

# From frontend/
npm run build
npm run lint
```

During preparation, the production frontend build and all 22 existing backend unit tests passed. Lint reported five existing explicit-`any` errors in `frontend/src/lib/types.ts` and three unused-code warnings in `frontend/src/app/page.tsx`. These checks do not establish end-to-end ranking results for the separate 18-resume dataset; that full dataset run was not completed during the original fix verification.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Upload fails with a network error | Confirm both services are running and `/health` responds. Open the frontend using `http://localhost:3000`. |
| `Local model missing` | Run `download_model.py` from the project root. |
| `No module named docx` or `fitz` | Install `python-docx` and `PyMuPDF` using the same Python environment that runs uvicorn. |
| `Criteria file not found` | Start the backend from the directory containing `criteria.json`. |
| JD Insights keeps showing placeholders before an upload | Complete an analysis first; the current page has no separate empty-state message. |
| Scores change but rank order stays the same | Compare the dimension scores and try substantially different relative weights. Similar scores and rounding can preserve order. |
| A new role produces unexpected skill gaps | Review the fixed required/preferred skill lists in `criteria.json`. |
| A port is already in use | Use the existing project service or stop it before starting another instance. |

Analysis is stored under `talentiq:analysis` and weights under `talentiq:weights` in the current browser's local storage. Clearing that storage removes saved browser results and preferences. Uploads are processed in a temporary backend directory; this project does not provide a persistent candidate database.
