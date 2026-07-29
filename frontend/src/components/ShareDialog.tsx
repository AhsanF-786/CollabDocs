import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Trash2, UserPlus, X } from "lucide-react";

import { api } from "../lib/api";
import type { Document, Share, User } from "../types";
import { Avatar } from "./Avatar";

interface ShareDialogProps {
  document: Document;
  currentUser: User;
  users: User[];
  onClose: () => void;
}

export function ShareDialog({
  document,
  currentUser,
  users,
  onClose,
}: ShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    api.shares
      .list(currentUser.id, document.id)
      .then(setShares)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Sharing could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, [currentUser.id, document.id]);

  const availableUsers = useMemo(() => {
    const sharedIds = new Set(shares.map((share) => share.user.id));
    return users.filter(
      (user) => user.id !== document.owner.id && !sharedIds.has(user.id),
    );
  }, [document.owner.id, shares, users]);

  const effectiveSelectedEmail = availableUsers.some(
    (user) => user.email === selectedEmail,
  )
    ? selectedEmail
    : (availableUsers[0]?.email ?? "");

  async function addShare() {
    if (!effectiveSelectedEmail) return;
    setSubmitting(true);
    setError(null);
    try {
      const share = await api.shares.create(
        currentUser.id,
        document.id,
        effectiveSelectedEmail,
      );
      setShares((current) => [...current, share]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Access could not be granted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeShare(userId: string) {
    setRemovingId(userId);
    setError(null);
    try {
      await api.shares.remove(currentUser.id, document.id, userId);
      setShares((current) => current.filter((share) => share.user.id !== userId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Access could not be removed.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog__header">
          <div>
            <span className="dialog__icon">
              <UserPlus size={19} />
            </span>
            <div>
              <h2 id="share-dialog-title">Share document</h2>
              <p>Invite a demo teammate to edit this document.</p>
            </div>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="dialog__body">
          {availableUsers.length > 0 && (
            <div className="invite-row">
              <select
                aria-label="Teammate to invite"
                value={effectiveSelectedEmail}
                onChange={(event) => setSelectedEmail(event.target.value)}
              >
                {availableUsers.map((user) => (
                  <option value={user.email} key={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
              <button
                className="button button--primary"
                type="button"
                disabled={!effectiveSelectedEmail || submitting}
                onClick={() => void addShare()}
              >
                {submitting ? <LoaderCircle className="spin" size={17} /> : <UserPlus size={17} />}
                Invite
              </button>
            </div>
          )}

          {error && <div className="alert alert--error">{error}</div>}

          <div className="people-list">
            <h3>People with access</h3>
            <div className="person-row">
              <Avatar user={document.owner} />
              <span>
                <strong>{document.owner.name} (you)</strong>
                <small>{document.owner.email}</small>
              </span>
              <span className="role-label">
                <Check size={14} />
                Owner
              </span>
            </div>
            {loading ? (
              <div className="dialog-loading">
                <LoaderCircle className="spin" size={20} />
                Loading access…
              </div>
            ) : (
              shares.map((share) => (
                <div className="person-row" key={share.user.id}>
                  <Avatar user={share.user} />
                  <span>
                    <strong>{share.user.name}</strong>
                    <small>{share.user.email}</small>
                  </span>
                  <span className="role-label">Editor</span>
                  <button
                    className="icon-button icon-button--danger"
                    type="button"
                    title="Remove access"
                    aria-label={`Remove ${share.user.name}`}
                    disabled={removingId === share.user.id}
                    onClick={() => void removeShare(share.user.id)}
                  >
                    {removingId === share.user.id ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="dialog__footer">
          <span>Demo sharing · Editors can change content</span>
          <button className="button button--secondary" type="button" onClick={onClose}>
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}
