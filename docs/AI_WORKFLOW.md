# AI-assisted workflow

## Tool used

OpenAI Codex was used as a collaborative implementation assistant for requirements
analysis, architecture discussion, code generation, documentation, and test review.

## Where AI accelerated the work

- Converted the ambiguous assessment into a deliberately scoped product slice.
- Compared a single-framework implementation with a separate FastAPI architecture.
- Scaffolded repeated API schemas, route wiring, React components, and setup files.
- Produced a first pass of migration, test, accessibility, and failure-state coverage.
- Kept the README, architecture note, and implementation synchronized.

## Human decisions retained

AI output was not treated as an architectural authority. The important decisions were
made explicitly:

- FastAPI owns the API and database instead of Next.js server functions.
- Alembic is required; runtime table creation is not allowed.
- Seeded identity is used because the prompt permits it and reviewer friction matters.
- `.txt` and Markdown import are prioritized over fragile `.docx` support.
- Real-time collaboration is deferred in favor of complete access control and persistence.
- Synchronous SQLAlchemy is used because async database plumbing would add complexity
  without a meaningful benefit at this scale.

## Output changed or rejected

- A proposed Next.js-only backend was rejected in favor of FastAPI and explicit migrations.
- Direct browser-to-database access was rejected so authorization has one backend boundary.
- Broad file support was reduced to an auditable UTF-8 text surface.
- Generic repository abstractions were avoided because they obscured three simple models.
- Generated migrations are reviewed and checked in rather than applied from model metadata.

## Verification

Correctness is checked through:

- Backend API integration tests for privacy, sharing, collaborator permissions, duplicate
  access, sanitization, and file rejection.
- Frontend tests for the visible distinction between owned and shared documents.
- TypeScript compilation and production frontend build.
- Python linting and test execution.
- Manual end-to-end checks using all three seeded users.
- Manual inspection of migration upgrade and downgrade paths.

AI materially reduced typing and iteration time, but product scope, security boundaries,
tradeoffs, and final acceptance remained deliberate engineering decisions.

