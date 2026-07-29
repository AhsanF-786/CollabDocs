# Architecture and product decisions

## Product slice

CollabDocs concentrates on one complete loop: create or import a document, edit it,
persist it, share it, and reopen it as another user. Real-time co-editing was excluded
because reliable conflict resolution would consume the assessment timebox and weaken the
core ownership and file-handling flows.

## System boundary

```text
React browser client
        |
        | JSON / multipart HTTP
        v
FastAPI route + Pydantic schema
        |
        v
Authorization and domain service
        |
        v
SQLAlchemy session
        |
        v
PostgreSQL
```

The browser never connects directly to the database. FastAPI is the only data owner.

## Backend organization

- Routes translate HTTP requests and responses.
- Pydantic schemas validate public API contracts.
- Services hold authorization, import, and sharing rules.
- SQLAlchemy models describe persistence and database relationships.
- Alembic revisions are the source of truth for schema evolution.

The project avoids a generic base-repository abstraction. There are only three entities,
and explicit SQLAlchemy statements are easier to read and change than a framework of
generic CRUD classes.

## Document content

Tiptap HTML is stored as sanitized text. This choice:

- Preserves the supported rich-text formatting.
- Round-trips directly through the editor.
- Allows Markdown imports to use a small, auditable conversion path.
- Keeps the API inspectable in Swagger.

HTML is sanitized by the backend both during file import and normal saves. Only the tags
needed by the editor are retained. A larger product could store ProseMirror JSON and
generate sanitized rendering output separately.

## Access model

`documents.owner_id` establishes ownership. `document_access` grants one collaborator
editor access and has a composite primary key plus uniqueness constraint. Authorization
queries use an `EXISTS` predicate so inaccessible documents never enter application code.

An unauthorized document request returns `404` instead of `403` to avoid leaking whether
an arbitrary document identifier exists.

## Persistence and migrations

PostgreSQL is the production database. SQLAlchemy models are the application mapping;
Alembic migrations are the database history. Migrations include named keys, constraints,
and indexes to produce understandable diffs and database errors.

The seed revision uses fixed identifiers so reviewer instructions and automated demos are
repeatable.

## Reliability choices

- A database session is scoped to one request.
- Commits happen only after complete domain operations.
- Duplicate sharing is enforced in PostgreSQL, not only checked in Python.
- File reads are capped before parsing.
- Browser autosave ignores stale responses from earlier save attempts.
- Environment-specific values are excluded from source control.

## Known limitation

Autosave is last-write-wins. Two users editing simultaneously can overwrite each other's
latest version. The next reliability increment is a numeric revision column and
conditional update that returns `409 Conflict` for stale clients. True simultaneous
editing would eventually require a CRDT or operational-transform service.

