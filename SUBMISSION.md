# CollabDocs — Full Stack Product Engineer Submission

## Quick review

- Live product: https://collabdocs-ahsanf-786.vercel.app
- API documentation: https://collabdocs-api-tqxd.onrender.com/docs
- API health: https://collabdocs-api-tqxd.onrender.com/health
- Source repository: https://github.com/AhsanF-786/CollabDocs
- Walkthrough video: see `WALKTHROUGH_URL.txt`

CollabDocs is a focused collaborative document workspace built for Ajaia's Full Stack
Product Engineer assessment. It delivers one complete product loop: create or import a
document, edit and persist rich text, share it, and reopen it as another user.

## Reviewer access

No signup, password, or paid dependency is required. The application provides a visible
demo-user switcher with three seeded users:

| User | Email | Suggested review action |
| --- | --- | --- |
| Maya Chen | `maya@ajaia.demo` | Own, create, edit, import, and share documents |
| Alex Morgan | `alex@ajaia.demo` | Open and edit a document shared by Maya |
| Jordan Lee | `jordan@ajaia.demo` | Demonstrate a second sharing recipient |

The identity switcher intentionally replaces production authentication for this
time-boxed assessment. Authorization is still enforced by FastAPI on every protected
document operation.

## Suggested 3–5 minute review flow

1. Open the live product as Maya Chen.
2. Open the seeded **Welcome to CollabDocs** document.
3. Edit its title and content, apply rich-text formatting, and observe autosave.
4. Return to the dashboard and confirm that the document persists.
5. Create a document or import a UTF-8 `.txt`, `.md`, or `.markdown` file.
6. Share a Maya-owned document with Alex Morgan.
7. Switch to Alex and open the **Shared with me** view.
8. Edit the shared document and switch back to Maya to confirm persistence.
9. Open the FastAPI Swagger documentation and review the API surface.

## Implemented functionality

### Document creation and editing

- Create a new document.
- Rename a document from the editor.
- Edit document content in the browser.
- Save automatically and reopen persisted documents.
- Delete an owned document.
- Format content with:
  - bold;
  - italic;
  - underline;
  - headings;
  - bulleted lists;
  - numbered lists.
- Display saving, saved, error, empty, and loading states.
- Preserve supported formatting as sanitized HTML.

### File handling

- Import UTF-8 `.txt`, `.md`, and `.markdown` files as editable documents.
- Convert Markdown into the supported rich-text representation.
- Enforce a 1 MB upload limit.
- Reject unsupported extensions, invalid UTF-8, oversized files, and binary-like input.
- Sanitize imported content on the backend.
- Store imported document content in PostgreSQL rather than retaining unsafe raw files.

Supported file limitations are stated in both the user interface and `README.md`.

### Sharing and access control

- Every document has one owner.
- Owners can grant editor access to a seeded user by email.
- Owners can revoke existing access.
- Collaborators can read and edit shared documents.
- Collaborators cannot share, revoke access, or delete the owner's document.
- Duplicate shares are rejected.
- The dashboard visibly separates **Owned by me** and **Shared with me** documents.
- Inaccessible document IDs return `404` to avoid leaking document existence.

### Persistence

- Production data is stored in managed Render PostgreSQL 18.
- Local development supports Docker PostgreSQL.
- SQLite remains available as a lightweight backend fallback.
- SQLAlchemy provides application mappings.
- Alembic is the only supported schema migration mechanism.
- A deterministic migration seeds reviewer-friendly users and a shared document.
- Documents, formatting, ownership, and sharing survive refreshes and service restarts.

### Product quality

- Responsive dashboard and editor layouts.
- Clear ownership and collaborator labels.
- Keyboard-accessible controls using native buttons and form elements.
- Error feedback for API, validation, file, sharing, and save failures.
- Debounced autosave with stale-response protection.
- Server-side HTML sanitization for normal saves and imports.
- Environment values and secrets excluded from source control.

## Architecture

```text
React 19 + Vite + TypeScript
             |
             | JSON and multipart HTTP
             v
FastAPI + Pydantic validation
             |
             | Authorization and domain services
             v
SQLAlchemy 2 + Alembic
             |
             v
PostgreSQL
```

The browser never connects directly to PostgreSQL. FastAPI is the single authorization
and data-access boundary.

### Frontend

- React 19
- TypeScript
- Vite
- Tiptap rich-text editor
- Lucide icons
- Vitest and Testing Library

### Backend

- Python 3.12
- FastAPI
- Pydantic Settings
- SQLAlchemy 2
- Alembic
- `psycopg`
- `nh3` HTML sanitization
- Pytest
- Ruff

### Deployment

- Frontend: Vercel
- API: Render Docker web service
- Database: Render PostgreSQL
- Migrations: `alembic upgrade head` runs before Uvicorn starts
- Production CORS: restricted to the deployed Vercel origin

The free Render API may require a short wake-up period after inactivity. The free Render
PostgreSQL instance expires on **August 28, 2026** unless upgraded.

See `docs/ARCHITECTURE.md` for deeper implementation decisions and tradeoffs.

## Repository contents

```text
.
├── backend/
│   ├── alembic/
│   │   └── versions/          # Schema and deterministic seed migrations
│   ├── app/
│   │   ├── api/               # FastAPI endpoints and dependencies
│   │   ├── core/              # Environment-backed configuration
│   │   ├── db/                # SQLAlchemy engine and session
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Public API contracts
│   │   └── services/          # Document, sharing, and content rules
│   ├── tests/                 # API, authorization, import, and config tests
│   ├── Dockerfile
│   ├── alembic.ini
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable product UI
│   │   ├── lib/               # API, formatting, and navigation helpers
│   │   ├── pages/             # Dashboard and editor flows
│   │   └── types/             # Shared client types
│   ├── vercel.json
│   └── package.json
├── docs/
│   ├── AI_WORKFLOW.md
│   └── ARCHITECTURE.md
├── docker-compose.yml         # Local PostgreSQL
├── render.yaml                # Render API and database Blueprint
├── README.md                  # Complete setup and operating guide
├── SUBMISSION.md              # This reviewer guide
└── WALKTHROUGH_URL.txt        # Video link location
```

## Local setup

### Prerequisites

- Node.js 22 or newer
- Python 3.11 or newer
- Docker Desktop for the recommended local PostgreSQL setup

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d db
```

### 2. Start FastAPI

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

The API will be available at:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs

### 3. Start React

In a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

Vite proxies local `/api` requests to FastAPI at `http://127.0.0.1:8000`.

Complete setup, migration, troubleshooting, and deployment instructions are available in
`README.md`.

## Validation and automated checks

The final implementation was verified with:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .

cd ..\frontend
npm test
npm run lint
npm run build
npm audit
```

Verified results:

- Backend: 6 tests passing.
- Backend lint: passing.
- Frontend: 2 tests passing.
- Frontend lint: passing.
- Frontend TypeScript production build: passing.
- npm audit: 0 known vulnerabilities at verification time.
- Alembic upgrade, downgrade-to-base, and upgrade path: passing.
- Production health, seeded users, CORS, and document persistence: manually verified.

Meaningful automated coverage includes:

- owner sharing and collaborator editing;
- unauthorized document privacy;
- duplicate sharing rejection;
- backend content sanitization;
- supported and rejected file imports;
- production PostgreSQL URL normalization;
- production CORS environment parsing;
- owned/shared document presentation.

## Product priorities

The assessment requested a coherent product slice rather than a full Google Docs clone.
The implementation prioritized:

1. A usable editor and reliable persistence.
2. A clear ownership and sharing model.
3. Product-relevant and defensive file import.
4. Explicit database migrations and deployable infrastructure.
5. Reviewer usability through seeded identities and repeatable data.
6. Tests around the highest-risk authorization and file-handling behavior.

## Intentional tradeoffs and incomplete work

### Seeded identity instead of authentication

Real signup/login was intentionally excluded because the assessment explicitly permits
seeded or mocked users. This keeps reviewer friction low while preserving meaningful
server-side access control.

### No real-time simultaneous editing

Autosave currently uses last-write-wins behavior. Two users editing simultaneously could
overwrite the latest content. Reliable real-time collaboration would require revision
checks followed by conflict handling, operational transformation, or a CRDT.

### No comments, suggestions, or version history

These are useful stretch features but were deprioritized to keep the core create, edit,
import, persist, and share workflow complete.

### Limited import surface

The app deliberately supports auditable UTF-8 text and Markdown rather than fragile
`.docx` parsing. Original uploaded files are not retained as attachments.

### Editor document format

Sanitized HTML is persisted because it round-trips cleanly through the selected editor.
A larger system could store ProseMirror JSON as the canonical model and derive sanitized
HTML for display or export.

## What I would build next with another 2–4 hours

1. Add optimistic concurrency with a document revision number and `409 Conflict`
   responses for stale saves.
2. Add real authentication while retaining seeded demo access for reviewers.
3. Add document version history with restore support.
4. Add Markdown export and a clearer unsaved-change recovery path.
5. Add Playwright end-to-end coverage for the complete share-and-edit workflow.
6. Add structured production logging and request correlation IDs.

If real-time collaboration became a confirmed product requirement, I would first define
the expected concurrency semantics and then evaluate a CRDT-based provider rather than
extending last-write-wins autosave.

## AI-native workflow

OpenAI Codex was used as a collaborative implementation assistant for:

- requirements decomposition;
- architecture comparison;
- repeated component, schema, and route scaffolding;
- migration and test first drafts;
- documentation synchronization;
- deployment diagnosis and verification.

AI output did not determine the product scope or security boundary. Important human
decisions included:

- selecting FastAPI and Alembic over a single-framework backend;
- keeping all database access behind the API;
- choosing seeded identities for reviewer usability;
- limiting imports to a safe, well-tested text surface;
- prioritizing complete persistence and sharing over real-time editing;
- rejecting generic abstractions that would obscure a small domain model.

Generated output was reviewed through automated tests, linting, TypeScript compilation,
production builds, migration round trips, manual UI checks, and live endpoint
verification.

See `docs/AI_WORKFLOW.md` for the dedicated AI workflow note.

## Known hosting considerations

- Render's free web service can sleep while idle, so the first API request may take
  longer.
- The free Render PostgreSQL database is temporary and must be upgraded or replaced
  before August 28, 2026 to preserve hosted data.
- The deployment does not require reviewers to purchase a dependency or service.
- Local development remains independent of Render and Vercel.

## Deliverable checklist

- [x] Source code
- [x] README with local setup and run instructions
- [x] Architecture note
- [x] AI workflow note
- [x] `SUBMISSION.md` inventory and reviewer guide
- [x] Live product URL
- [x] API documentation URL
- [x] Seeded reviewer users
- [x] Automated tests
- [x] Deployment configuration
- [x] Walkthrough URL text file
- [x] Recorded walkthrough URL added to `WALKTHROUGH_URL.txt`
- [x] Final Google Drive folder assembled and shared

## Final status

The scoped product is implemented, tested, documented, deployed, and assembled for final
submission.
