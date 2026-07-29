import { useEffect, useRef, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudAlert,
  LoaderCircle,
  Share2,
  Users,
} from "lucide-react";

import { AppLink } from "../components/AppLink";
import { EditorToolbar } from "../components/EditorToolbar";
import { ShareDialog } from "../components/ShareDialog";
import { api } from "../lib/api";
import { formatRelativeDate } from "../lib/format";
import type { Document, User } from "../types";

interface EditorPageProps {
  currentUser: User;
  users: User[];
  documentId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function EditorPage({ currentUser, users, documentId }: EditorPageProps) {
  const saveVersion = useRef(0);
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [retry, setRetry] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing…",
      }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class: "document-editor__content",
        "aria-label": "Document content",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      setContentHtml(activeEditor.getHTML());
      setDirty(true);
    },
  });

  useEffect(() => {
    let active = true;
    api.documents
      .get(currentUser.id, documentId)
      .then((result) => {
        if (!active) return;
        setDocument(result);
        setTitle(result.title);
        setContentHtml(result.content_html);
        editor?.commands.setContent(result.content_html, { emitUpdate: false });
        setDirty(false);
        setSaveStatus("idle");
      })
      .catch((reason: unknown) => {
        if (active) {
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "This document could not be opened.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser.id, documentId, editor]);

  useEffect(() => {
    if (!dirty || !document) return;

    const version = ++saveVersion.current;
    const timeout = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const updated = await api.documents.update(currentUser.id, document.id, {
          title,
          content_html: contentHtml,
        });
        if (version === saveVersion.current) {
          setDocument(updated);
          setDirty(false);
          setSaveStatus("saved");
        }
      } catch {
        if (version === saveVersion.current) setSaveStatus("error");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [contentHtml, currentUser.id, dirty, document, retry, title]);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  if (loading) {
    return (
      <main className="editor-state">
        <LoaderCircle className="spin" size={26} />
        <h1>Opening document</h1>
        <p>Loading the latest saved content…</p>
      </main>
    );
  }

  if (loadError || !document) {
    return (
      <main className="editor-state editor-state--error">
        <CloudAlert size={28} />
        <h1>Document unavailable</h1>
        <p>{loadError ?? "This document does not exist or is not shared with you."}</p>
        <AppLink className="button button--primary" to="/">
          <ArrowLeft size={17} />
          Back to workspace
        </AppLink>
      </main>
    );
  }

  const owned = document.current_user_access === "owner";

  return (
    <main className="editor-page">
      <div className="editor-meta-bar">
        <AppLink className="back-link" to="/">
          <ArrowLeft size={17} />
          Workspace
        </AppLink>
        <span className={`save-indicator save-indicator--${saveStatus}`}>
          {saveStatus === "saving" && <LoaderCircle className="spin" size={15} />}
          {saveStatus === "saved" && <Check size={15} />}
          {saveStatus === "error" && <CloudAlert size={15} />}
          {(saveStatus === "idle" || saveStatus === "saved") && saveStatus !== "saved" && (
            <Cloud size={15} />
          )}
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "idle" && `Updated ${formatRelativeDate(document.updated_at)}`}
          {saveStatus === "error" && (
            <button type="button" onClick={() => setRetry((current) => current + 1)}>
              Save failed · Retry
            </button>
          )}
        </span>
        {owned ? (
          <button
            className="button button--primary button--small"
            type="button"
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={16} />
            Share
          </button>
        ) : (
          <span className="collaborator-label">
            <Users size={15} />
            Shared by {document.owner.name}
          </span>
        )}
      </div>

      <div className="editor-shell">
        <div className="editor-title-row">
          <input
            className="document-title"
            aria-label="Document title"
            maxLength={200}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
            onBlur={() => {
              if (!title.trim()) setTitle("Untitled document");
            }}
          />
          <span className="owner-chip">
            {owned ? "Owner" : "Editor"} · {currentUser.name}
          </span>
        </div>
        <EditorToolbar editor={editor} />
        <div className="document-paper">
          <EditorContent editor={editor} />
        </div>
      </div>

      {shareOpen && (
        <ShareDialog
          currentUser={currentUser}
          document={document}
          users={users}
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  );
}
