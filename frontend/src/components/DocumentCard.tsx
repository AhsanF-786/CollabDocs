import { ArrowUpRight, Clock3, Crown, Trash2, Users } from "lucide-react";

import { formatRelativeDate, htmlToPlainText } from "../lib/format";
import type { Document } from "../types";
import { AppLink } from "./AppLink";
import { Avatar } from "./Avatar";

interface DocumentCardProps {
  document: Document;
  onDelete: (document: Document) => void;
  deleting: boolean;
}

export function DocumentCard({ document, onDelete, deleting }: DocumentCardProps) {
  const owned = document.current_user_access === "owner";
  const preview = htmlToPlainText(document.content_html) || "Start writing something meaningful…";

  return (
    <article className="document-card">
      <AppLink className="document-card__body" to={`/documents/${document.id}`}>
        <div className="document-card__top">
          <span className={`access-badge ${owned ? "access-badge--owned" : ""}`}>
            {owned ? <Crown size={13} /> : <Users size={13} />}
            {owned ? "Owned by me" : `Shared by ${document.owner.name}`}
          </span>
          <ArrowUpRight className="document-card__arrow" size={18} />
        </div>
        <h2>{document.title}</h2>
        <p>{preview}</p>
      </AppLink>
      <footer className="document-card__footer">
        <span className="owner-line">
          <Avatar user={document.owner} size="small" />
          {document.owner.name}
        </span>
        <span className="updated-line">
          <Clock3 size={14} />
          {formatRelativeDate(document.updated_at)}
        </span>
        {owned && (
          <button
            className="icon-button icon-button--danger"
            type="button"
            aria-label={`Delete ${document.title}`}
            title="Delete document"
            disabled={deleting}
            onClick={() => onDelete(document)}
          >
            <Trash2 size={16} />
          </button>
        )}
      </footer>
    </article>
  );
}
