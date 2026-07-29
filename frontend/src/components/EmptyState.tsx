import { FilePlus2, Files } from "lucide-react";

interface EmptyStateProps {
  filtered?: boolean;
  onCreate: () => void;
}

export function EmptyState({ filtered = false, onCreate }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Files size={28} />
      </span>
      <h2>{filtered ? "No documents in this view" : "Create your first document"}</h2>
      <p>
        {filtered
          ? "Try another filter or create a new document."
          : "Draft an idea, import your notes, and invite a teammate."}
      </p>
      <button className="button button--primary" type="button" onClick={onCreate}>
        <FilePlus2 size={17} />
        New document
      </button>
    </div>
  );
}

