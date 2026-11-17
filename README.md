# Research Projects

Two independent applied-AI research prototypes. Both run locally, use a React + Vite frontend with a FastAPI backend, and run their language models on [Ollama](https://ollama.com/).

| Project | What it explores | Stack |
|---|---|---|
| [RBER – RAG](#rber--recursive-boundary-exposure-retrieval) | A retrieval method that turns LLMs' "lost-in-the-middle" positional bias into a search strategy | React 18, FastAPI, SQLite, Ollama (Llama 3.2, nomic-embed-text) |
| [Teevra](#teevra--ai-assisted-emergency-reporting) | AI-assisted emergency reporting, triage and responder coordination | React 19, Leaflet, FastAPI, SQLite, Ollama (Llama 3.2, Moondream), faster-whisper, Piper |

Each project is self-contained in its own folder and has its own detailed README, dependencies and tests.

```
.
├── RBR-RAG/      # Recursive Boundary Exposure Retrieval
└── Teevra/       # Emergency reporting and response coordination
```

> Both projects are research prototypes. They are not hardened for production, have no authentication, and should not be exposed to untrusted users without further work.

---

## RBER – Recursive Boundary Exposure Retrieval

Long-context LLMs attend most strongly to the beginning and end of a prompt and lose information buried in the middle. **RBER** uses that bias deliberately: it splits a document region into thirds, shows the model a bounded view of the outer boundaries, and, if no answer is found, peels those layers away so the middle content becomes the new boundary. The process repeats until an answer is found or the remaining core is small enough to evaluate directly.

The folder contains:

- **Research paper** – `RBER_Research_Paper.md`, describing the method, chunk-level max-pooled relevance scoring and confidence-guided early stopping.
- **Document workspace** – a local web app for uploading text-based PDFs, plain text and Markdown, asking questions and expanding the cited passages the model saw.
- **Reference implementation** – `res.py`, the boundary evaluator the backend follows.
- **Benchmarks** – a LongBench MultiFieldQA-en pilot comparing RBER-style boundary peeling with BM25, dense and hybrid retrieval (`benchmark/RESULTS.md`).

### Quick start

```sh
ollama pull nomic-embed-text
ollama pull llama3.2

cd RBR-RAG
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app:app --host 127.0.0.1 --port 8000

# in another terminal
cd RBR-RAG/frontend
npm install
npm run dev
```

On Windows, activate the virtual environment with `.venv\Scripts\activate` instead.

### Findings and limitations

The 10-example LongBench pilot found RBER-style peeling (27.2% token F1) roughly level with BM25 (28.7%), dense retrieval (29.8%) and a hybrid (26.5%). It passed slightly fewer words to the generator but needed more model calls. The sample is too small to establish a ranking. Because the method inspects boundary views rather than every passage, it can miss an answer. Scanned PDFs need OCR before upload.

---

## Teevra – AI-assisted emergency reporting

Teevra connects people reporting an emergency with the responders handling it, through two separate dashboards.

**Reporter** (`/`)
- Full-screen AI chat with typed, voice (English / Hindi) or image input
- The assistant asks follow-up questions and drafts a report for the reporter to review before sending
- Live tracking of assigned units after submission, with road ETAs
- Fixed "call emergency services now" instruction for critical breathing / consciousness red flags, independent of model output

**Responder** (`/responder`)
- Priority queue ordered by priority band, severity and waiting time
- LLM triage with a labelled rules-based fallback that requires operator review
- Multi-department fleet assignment, ranked by estimated arrival time
- OpenStreetMap maps with OSRM road routes, plus optional live GPS sharing from fleet devices

Speech is transcribed locally with faster-whisper, and replies are spoken with Piper using Hindi and Indian English voices.

### Quick start

```sh
ollama pull llama3.2
ollama pull moondream

cd Teevra
npm ci
python3 -m venv Backend/.venv
Backend/.venv/bin/python -m pip install -r Backend/requirements.txt
Backend/.venv/bin/python Backend/download_voices.py
Backend/.venv/bin/python -m uvicorn Backend.main:app --host 127.0.0.1 --port 8000

# in another terminal
cd Teevra
npm run dev
```

Then open `http://localhost:5173/` for the reporter and `http://localhost:5173/responder` for the responder. See `Teevra/Backend/README.md` for backend configuration.

### Limitations

Teevra does **not** contact real emergency services and is not connected to dispatch networks or live traffic. Triage is not comprehensive medical assessment, and image descriptions and voice transcripts may be inaccurate. The two dashboards are separate routes, not an access-control system.

---

## Prerequisites

- Python 3 with `venv`
- Node.js (current LTS) and npm
- [Ollama](https://ollama.com/) running locally with the models listed above

## Running the tests

```sh
# RBER
cd RBR-RAG && python -m unittest discover -s tests

# Teevra
cd Teevra
npm run lint && npm test
Backend/.venv/bin/python -m unittest discover -s Backend/tests -v
```

## Third-party notices

Teevra's Piper voices carry their own licenses: the Hindi voice dataset is CC BY-NC-SA 4.0 and the Indian English model is AGPL-3.0. Check their terms before any commercial use or deployment. Map tiles come from OpenStreetMap; follow the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) when using the public servers.

## Credits

The RBER method and paper are by Veer Vikram Singh.
