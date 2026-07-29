import type { Document, DocumentList, Share, User } from "../types";

const API_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  userId?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (userId) headers.set("X-User-Id", userId);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "The API could not be reached. Confirm that the FastAPI server is running.",
      0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(body?.detail ?? "Something went wrong. Please try again.", response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  users: {
    list: () => request<User[]>("/users"),
  },
  documents: {
    list: (userId: string) => request<DocumentList>("/documents", {}, userId),
    get: (userId: string, documentId: string) =>
      request<Document>(`/documents/${documentId}`, {}, userId),
    create: (userId: string, title = "Untitled document") =>
      request<Document>(
        "/documents",
        { method: "POST", body: JSON.stringify({ title }) },
        userId,
      ),
    update: (
      userId: string,
      documentId: string,
      changes: { title?: string; content_html?: string },
    ) =>
      request<Document>(
        `/documents/${documentId}`,
        { method: "PATCH", body: JSON.stringify(changes) },
        userId,
      ),
    remove: (userId: string, documentId: string) =>
      request<void>(`/documents/${documentId}`, { method: "DELETE" }, userId),
    import: (userId: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<Document>("/documents/import", { method: "POST", body: form }, userId);
    },
  },
  shares: {
    list: (userId: string, documentId: string) =>
      request<Share[]>(`/documents/${documentId}/shares`, {}, userId),
    create: (userId: string, documentId: string, email: string) =>
      request<Share>(
        `/documents/${documentId}/shares`,
        { method: "POST", body: JSON.stringify({ email }) },
        userId,
      ),
    remove: (userId: string, documentId: string, sharedUserId: string) =>
      request<void>(
        `/documents/${documentId}/shares/${sharedUserId}`,
        { method: "DELETE" },
        userId,
      ),
  },
};
