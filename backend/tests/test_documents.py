from fastapi.testclient import TestClient

from tests.conftest import ALEX_ID, JORDAN_ID, MAYA_ID


def test_owner_can_share_and_collaborator_can_edit(
    client: TestClient,
    as_user,
) -> None:
    created = client.post(
        "/api/v1/documents",
        headers=as_user(MAYA_ID),
        json={"title": "Launch brief"},
    )
    assert created.status_code == 201
    document_id = created.json()["id"]
    assert created.json()["current_user_access"] == "owner"

    hidden = client.get(f"/api/v1/documents/{document_id}", headers=as_user(ALEX_ID))
    assert hidden.status_code == 404

    shared = client.post(
        f"/api/v1/documents/{document_id}/shares",
        headers=as_user(MAYA_ID),
        json={"email": "alex@ajaia.demo"},
    )
    assert shared.status_code == 201
    assert shared.json()["user"]["id"] == ALEX_ID

    collaborator_update = client.patch(
        f"/api/v1/documents/{document_id}",
        headers=as_user(ALEX_ID),
        json={"content_html": "<h1>Launch plan</h1><script>alert('no')</script>"},
    )
    assert collaborator_update.status_code == 200
    assert collaborator_update.json()["current_user_access"] == "editor"
    assert "<script>" not in collaborator_update.json()["content_html"]

    forbidden_share = client.post(
        f"/api/v1/documents/{document_id}/shares",
        headers=as_user(ALEX_ID),
        json={"email": "jordan@ajaia.demo"},
    )
    assert forbidden_share.status_code == 403

    still_hidden = client.get(
        f"/api/v1/documents/{document_id}",
        headers=as_user(JORDAN_ID),
    )
    assert still_hidden.status_code == 404


def test_duplicate_share_is_rejected(client: TestClient, as_user) -> None:
    document_id = client.post(
        "/api/v1/documents",
        headers=as_user(MAYA_ID),
        json={"title": "Roadmap"},
    ).json()["id"]

    first = client.post(
        f"/api/v1/documents/{document_id}/shares",
        headers=as_user(MAYA_ID),
        json={"email": "alex@ajaia.demo"},
    )
    second = client.post(
        f"/api/v1/documents/{document_id}/shares",
        headers=as_user(MAYA_ID),
        json={"email": "alex@ajaia.demo"},
    )

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["detail"] == "This document is already shared with that user."

