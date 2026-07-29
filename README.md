# CollabDocs

CollabDocs is a focused collaborative document workspace built for Ajaia's Full Stack
Product Engineer assessment. It supports document creation, rich-text editing, persistent
autosave, text and Markdown import, and owner-controlled sharing between seeded demo users.

The project intentionally delivers a coherent product slice rather than attempting to
recreate all of Google Docs.

## What works

- Create, rename, edit, delete, save, and reopen documents
- Rich-text headings, bold, italic, underline, lists, undo, and redo
- Debounced autosave with visible saving, saved, and retry states
- Import UTF-8 `.txt`, `.md`, and `.markdown` files up to 1 MB
- Switch between three seeded demo users without registration
- Share documents with other demo users
- Separate owned and shared documents
- Server-enforced owner and collaborator permissions
- PostgreSQL persistence with explicit Alembic migrations
- Sanitized rich-text content and defensive file validation
- FastAPI OpenAPI/Swagger documentation
- Backend authorization/import tests and a frontend ownership-state test

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Editor | Tiptap 3 |
| Styling | Custom responsive CSS, Lucide icons |
| Backend | FastAPI, Pydantic |
| Persistence | PostgreSQL, SQLAlchemy 2 |
| Schema history | Alembic |
| Tests | Pytest, FastAPI TestClient, Vitest, Testing Library |
| Local infrastructure | Docker Compose |
| Suggested deployment | Vercel frontend, Render API, hosted PostgreSQL |

## Repository structure

```text
.
├── backend/
│   ├── alembic/              # Migration environment and version history
│   ├── app/
│   │   ├── api/              # FastAPI dependencies and versioned routes
│   │   ├── core/             # Environment-backed configuration
│   │   ├── db/               # SQLAlchemy base and session lifecycle
│   │   ├── models/           # Database entities and constraints
│   │   ├── schemas/          # Pydantic request/response contracts
│   │   └── services/         # Authorization, sharing, and import logic
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/       # Reusable product and editor components
│       ├── lib/              # Typed API client and formatting helpers
│       ├── pages/            # Dashboard and document editor
│       └── types/            # API-facing TypeScript models
├── docs/
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Prerequisites

Install:

- Node.js 22 or newer
- Python 3.11 or newer (3.12 recommended)
- Docker Desktop, or another reachable PostgreSQL 14+ server
- `uv` (recommended) or standard `pip`

No paid service is required for local development.

## Local setup

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d db
```

The local database is exposed on `localhost:5432` using:

```text
database: collabdocs
username: collabdocs
password: collabdocs
```

These credentials are for local development only.

### 2. Configure and run the backend

Open a terminal in `backend`.

macOS/Linux:

```bash
cp .env.example .env
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

If `uv` is unavailable, use a virtual environment:

```bash
python -m venv .venv
```

Activate it, then run:

```bash
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

The backend is available at:

- API: `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Configure and run the frontend

Open another terminal in `frontend`.

macOS/Linux:

```bash
cp .env.example .env
npm install
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Seeded demo users

Alembic revision `0002` creates:

| Name | Email | Initial access |
| --- | --- | --- |
| Maya Chen | `maya@ajaia.demo` | Owns the welcome document |
| Alex Morgan | `alex@ajaia.demo` | Can edit Maya's welcome document |
| Jordan Lee | `jordan@ajaia.demo` | Starts without document access |

Use the user switcher in the top-right corner to demonstrate sharing:

1. Open the welcome document as Maya.
2. Select **Share** and invite Jordan.
3. Switch to Jordan.
4. The document appears under **Shared** and can be edited.

This is intentionally simulated identity, as permitted by the assignment. The API still
performs authorization for every document operation. See
[Authentication and security](#authentication-and-security).

## Environment variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLAlchemy database URL, including the `+psycopg` driver |
| `FRONTEND_ORIGINS` | Yes | Comma-separated allowed CORS origins |
| `APP_ENV` | No | Environment label; defaults to `development` |
| `MAX_UPLOAD_BYTES` | No | Import size limit; defaults to `1048576` |

Example:

```text
DATABASE_URL=postgresql+psycopg://collabdocs:collabdocs@localhost:5432/collabdocs
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Some hosting providers supply `postgresql://...`. Change it to
`postgresql+psycopg://...` before using it with this project.

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Public URL of the versioned API |

Example:

```text
VITE_API_URL=/api/v1
```

Only variables prefixed with `VITE_` are exposed to browser code. Never place database
credentials in the frontend environment.

The relative local value is forwarded to FastAPI by Vite's development proxy. For a
deployed frontend, set this variable to the backend's complete public URL, such as
`https://collabdocs-api.onrender.com/api/v1`.

## Database migrations

Production code never calls `Base.metadata.create_all()`. Alembic is the only supported
way to change the application schema.

Apply all migrations:

```bash
cd backend
uv run alembic upgrade head
```

Inspect current revision:

```bash
uv run alembic current
```

Inspect migration history:

```bash
uv run alembic history --verbose
```

Create a migration after changing a model:

```bash
uv run alembic revision --autogenerate -m "describe the schema change"
```

Always inspect autogenerated upgrade and downgrade functions before committing them.

Roll back one revision during local development:

```bash
uv run alembic downgrade -1
```

Do not downgrade a shared production database without a reviewed recovery plan.

## Tests and quality checks

Backend:

```bash
cd backend
uv run pytest
uv run ruff check .
```

Frontend:

```bash
cd frontend
npm test
npm run lint
npm run build
```

Backend tests use an isolated in-memory database and exercise the API end to end:

- A document is private before sharing.
- Owners can grant access.
- Collaborators can edit but cannot manage sharing.
- Unrelated users cannot discover the document.
- Duplicate sharing is rejected.
- Markdown import is converted and sanitized.
- Binary and unsupported imports are rejected.

## API summary

All protected routes require an `X-User-Id` header containing a seeded user ID.

```text
GET    /health
GET    /docs
GET    /api/v1/users
GET    /api/v1/documents
POST   /api/v1/documents
GET    /api/v1/documents/{document_id}
PATCH  /api/v1/documents/{document_id}
DELETE /api/v1/documents/{document_id}
POST   /api/v1/documents/import
GET    /api/v1/documents/{document_id}/shares
POST   /api/v1/documents/{document_id}/shares
DELETE /api/v1/documents/{document_id}/shares/{user_id}
```

FastAPI's `/docs` page contains the authoritative request and response schemas.

## File handling

The import workflow is intentionally narrow and predictable:

- Accepted extensions: `.txt`, `.md`, `.markdown`
- Maximum size: 1 MB by default
- Required encoding: UTF-8, with or without a byte-order mark
- Original filenames are reduced to their basename and used only as a suggested title
- Uploaded bytes are not persisted to the filesystem
- Empty, binary-looking, malformed, oversized, and unsupported files are rejected
- Markdown is converted to a restricted HTML subset
- All imported and editor-submitted HTML is sanitized on the server

The resulting content becomes a normal editable document. Restricting the import surface
was a deliberate timebox decision; `.docx` parsing would add significant complexity and
security surface without improving the core sharing flow.

## Authentication and security

The assignment permits mocked identity, so the user selector sends a demo user ID in
`X-User-Id`. This is not production authentication and is clearly labeled in the UI.

The authorization behavior is real:

- Owners can edit, share, unshare, and delete.
- Collaborators can read and edit.
- Collaborators cannot delete or manage sharing.
- Unrelated users receive `404`, which avoids confirming that a document ID exists.
- Duplicate access rows are prevented by a database constraint.
- Database credentials exist only in the backend.
- CORS is restricted through configuration.
- Rich-text HTML is sanitized on every write.

For production, replace the demo header with an HttpOnly-cookie session or verified JWT
whose subject resolves to the same `users.id`. The document authorization services would
not need to change.

## Deployment

### Backend on Render

The root `render.yaml` and `backend/Dockerfile` configure a FastAPI web service.

1. Create a hosted PostgreSQL database.
2. Create a Render Blueprint from this repository.
3. Set `DATABASE_URL` using the `postgresql+psycopg://` scheme.
4. Set `FRONTEND_ORIGINS` to the final Vercel URL.
5. Deploy. The container applies `alembic upgrade head` before starting Uvicorn.

The free Render tier can sleep while idle, so the first request after inactivity may take
longer. Use an always-on service for a production system.

### Frontend on Vercel

1. Import the repository as a Vercel project.
2. Set the root directory to `frontend`.
3. Set `VITE_API_URL` to `https://<api-host>/api/v1`.
4. Deploy using the Vite defaults.

`frontend/vercel.json` rewrites client-side routes to `index.html`, so direct editor URLs
continue to work after refresh.

## Product scope and tradeoffs

Prioritized:

- A coherent editor and autosave experience
- Persistent sharing with clear ownership
- Defensive import handling
- Inspectable schema history and API contracts
- Reviewer-friendly seeded data and documentation

Intentionally deferred:

- Real-time cursor presence and conflict-free collaborative editing
- Comments and suggestion mode
- Full authentication, invitations, and password recovery
- Viewer/editor role selection
- Version history and restore
- `.docx` import and export
- Offline editing

With another 2–4 hours, the next improvement would be optimistic concurrency control:
add a document revision number, reject stale updates with `409 Conflict`, and expose a
small version history. That improves collaboration reliability more than adding another
formatting button.

## Additional documentation

- [Architecture and decisions](docs/ARCHITECTURE.md)
- [AI-assisted workflow](docs/AI_WORKFLOW.md)
- [Submission inventory](SUBMISSION.md)
- [Walkthrough URL placeholder](WALKTHROUGH_URL.txt)
