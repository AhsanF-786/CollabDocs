"""Seed reviewer-friendly demo users and a shared document.

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-29
"""

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

MAYA_ID = "11111111-1111-1111-1111-111111111111"
ALEX_ID = "22222222-2222-2222-2222-222222222222"
JORDAN_ID = "33333333-3333-3333-3333-333333333333"
WELCOME_DOCUMENT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def upgrade() -> None:
    users = sa.table(
        "users",
        sa.column("id", sa.String),
        sa.column("name", sa.String),
        sa.column("email", sa.String),
        sa.column("avatar_color", sa.String),
    )
    documents = sa.table(
        "documents",
        sa.column("id", sa.String),
        sa.column("title", sa.String),
        sa.column("content_html", sa.Text),
        sa.column("owner_id", sa.String),
    )
    access = sa.table(
        "document_access",
        sa.column("document_id", sa.String),
        sa.column("user_id", sa.String),
        sa.column("role", sa.String),
        sa.column("granted_by", sa.String),
    )

    op.bulk_insert(
        users,
        [
            {
                "id": MAYA_ID,
                "name": "Maya Chen",
                "email": "maya@ajaia.demo",
                "avatar_color": "#6d5dfc",
            },
            {
                "id": ALEX_ID,
                "name": "Alex Morgan",
                "email": "alex@ajaia.demo",
                "avatar_color": "#0f9f82",
            },
            {
                "id": JORDAN_ID,
                "name": "Jordan Lee",
                "email": "jordan@ajaia.demo",
                "avatar_color": "#e07a3f",
            },
        ],
    )
    op.bulk_insert(
        documents,
        [
            {
                "id": WELCOME_DOCUMENT_ID,
                "title": "Welcome to CollabDocs",
                "owner_id": MAYA_ID,
                "content_html": (
                    "<h1>Welcome to CollabDocs</h1>"
                    "<p>This seeded document demonstrates rich text and sharing.</p>"
                    "<h2>Try the complete workflow</h2>"
                    "<ul><li>Edit this document as Maya or Alex</li>"
                    "<li>Share it with Jordan</li>"
                    "<li>Import a Markdown or text file</li></ul>"
                ),
            }
        ],
    )
    op.bulk_insert(
        access,
        [
            {
                "document_id": WELCOME_DOCUMENT_ID,
                "user_id": ALEX_ID,
                "role": "editor",
                "granted_by": MAYA_ID,
            }
        ],
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM document_access WHERE document_id = :document_id").bindparams(
            document_id=WELCOME_DOCUMENT_ID
        )
    )
    op.execute(
        sa.text("DELETE FROM documents WHERE id = :document_id").bindparams(
            document_id=WELCOME_DOCUMENT_ID
        )
    )
    op.execute(
        sa.text("DELETE FROM users WHERE id IN (:maya, :alex, :jordan)").bindparams(
            maya=MAYA_ID,
            alex=ALEX_ID,
            jordan=JORDAN_ID,
        )
    )
