import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Document } from "../types";
import { DocumentCard } from "./DocumentCard";

afterEach(cleanup);

const owner = {
  id: "owner-id",
  name: "Maya Chen",
  email: "maya@ajaia.demo",
  avatar_color: "#6558e8",
  created_at: "2026-07-29T10:00:00Z",
};

function makeDocument(access: "owner" | "editor"): Document {
  return {
    id: "document-id",
    title: "Product brief",
    content_html: "<p>A focused plan for the next launch.</p>",
    owner,
    current_user_access: access,
    created_at: "2026-07-29T10:00:00Z",
    updated_at: new Date().toISOString(),
  };
}

describe("DocumentCard", () => {
  it("clearly identifies owned documents and exposes owner actions", () => {
    render(
      <DocumentCard document={makeDocument("owner")} deleting={false} onDelete={vi.fn()} />,
    );

    expect(screen.getByText("Owned by me")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Product brief" })).toBeInTheDocument();
    expect(screen.getByText("A focused plan for the next launch.")).toBeInTheDocument();
  });

  it("identifies shared documents without showing destructive owner actions", () => {
    render(
      <DocumentCard document={makeDocument("editor")} deleting={false} onDelete={vi.fn()} />,
    );

    expect(screen.getByText("Shared by Maya Chen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Product brief" })).not.toBeInTheDocument();
  });
});
