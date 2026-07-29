from fastapi.testclient import TestClient

from tests.conftest import MAYA_ID


def test_markdown_import_creates_sanitized_editable_document(
    client: TestClient,
    as_user,
) -> None:
    response = client.post(
        "/api/v1/documents/import",
        headers=as_user(MAYA_ID),
        files={
            "file": (
                "Product brief.md",
                b"# Product brief\n\n- Fast\n- Focused\n\n<script>bad()</script>",
                "text/markdown",
            )
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Product brief"
    assert "<h1>Product brief</h1>" in body["content_html"]
    assert "<ul>" in body["content_html"]
    assert "<script>" not in body["content_html"]


def test_binary_and_unsupported_files_are_rejected(client: TestClient, as_user) -> None:
    binary = client.post(
        "/api/v1/documents/import",
        headers=as_user(MAYA_ID),
        files={"file": ("notes.txt", b"hello\x00world", "text/plain")},
    )
    unsupported = client.post(
        "/api/v1/documents/import",
        headers=as_user(MAYA_ID),
        files={"file": ("notes.pdf", b"%PDF", "application/pdf")},
    )

    assert binary.status_code == 422
    assert "binary" in binary.json()["detail"]
    assert unsupported.status_code == 422
    assert "Only .txt and .md" in unsupported.json()["detail"]
