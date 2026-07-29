import { useEffect, useRef, useState } from "react";
import { FilePlus2, Search, Upload, X } from "lucide-react";

import { DocumentCard } from "../components/DocumentCard";
import { EmptyState } from "../components/EmptyState";
import { ApiError, api } from "../lib/api";
import { navigate } from "../lib/navigation";
import type { Document, User } from "../types";

type Filter = "all" | "owned" | "shared";

interface DashboardPageProps {
  currentUser: User;
}

export function DashboardPage({ currentUser }: DashboardPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.documents
      .list(currentUser.id)
      .then((result) => {
        if (active) setDocuments(result.items);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Documents could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser.id]);

  const visibleDocuments = documents.filter((document) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "owned" && document.current_user_access === "owner") ||
      (filter === "shared" && document.current_user_access === "editor");
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      document.title.toLowerCase().includes(query) ||
      document.owner.name.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  async function createDocument() {
    setCreating(true);
    setError(null);
    try {
      const document = await api.documents.create(currentUser.id);
      navigate(`/documents/${document.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The document could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function importDocument(file: File) {
    setImporting(true);
    setError(null);
    try {
      const document = await api.documents.import(currentUser.id, file);
      navigate(`/documents/${document.id}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "The file could not be imported.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteDocument(document: Document) {
    const confirmed = window.confirm(
      `Delete “${document.title}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(document.id);
    setError(null);
    try {
      await api.documents.remove(currentUser.id, document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The document could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  const counts = {
    all: documents.length,
    owned: documents.filter((item) => item.current_user_access === "owner").length,
    shared: documents.filter((item) => item.current_user_access === "editor").length,
  };

  return (
    <main className="dashboard">
      <section className="dashboard__intro">
        <div>
          <span className="eyebrow">Your workspace</span>
          <h1>Good work starts with a clear page.</h1>
          <p>Create, import, and share focused documents with your team.</p>
        </div>
        <div className="dashboard__actions">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importDocument(file);
            }}
          />
          <button
            className="button button--secondary"
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={17} />
            {importing ? "Importing…" : "Import file"}
          </button>
          <button
            className="button button--primary"
            type="button"
            disabled={creating}
            onClick={() => void createDocument()}
          >
            <FilePlus2 size={17} />
            {creating ? "Creating…" : "New document"}
          </button>
        </div>
      </section>

      <div className="import-note">
        Import UTF-8 <strong>.txt</strong> or <strong>.md</strong> files up to 1 MB.
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="document-controls" aria-label="Document filters">
        <div className="filter-tabs">
          {(["all", "owned", "shared"] as Filter[]).map((item) => (
            <button
              className={filter === item ? "active" : ""}
              type="button"
              key={item}
              onClick={() => setFilter(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
              <span>{counts[item]}</span>
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search documents"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {loading ? (
        <div className="document-grid" aria-label="Loading documents">
          {[1, 2, 3].map((item) => (
            <div className="document-card document-card--skeleton" key={item} />
          ))}
        </div>
      ) : visibleDocuments.length ? (
        <div className="document-grid">
          {visibleDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              deleting={deletingId === document.id}
              onDelete={(item) => void deleteDocument(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          filtered={documents.length > 0}
          onCreate={() => void createDocument()}
        />
      )}
    </main>
  );
}
