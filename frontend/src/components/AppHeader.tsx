import { ChevronDown, FileText } from "lucide-react";

import type { User } from "../types";
import { AppLink } from "./AppLink";
import { Avatar } from "./Avatar";

interface AppHeaderProps {
  users: User[];
  currentUser: User;
  onUserChange: (user: User) => void;
  compact?: boolean;
}

export function AppHeader({
  users,
  currentUser,
  onUserChange,
  compact = false,
}: AppHeaderProps) {
  return (
    <header className={`app-header ${compact ? "app-header--compact" : ""}`}>
      <AppLink className="brand" to="/" aria-label="CollabDocs home">
        <span className="brand__mark">
          <FileText size={20} strokeWidth={2.4} />
        </span>
        <span>CollabDocs</span>
      </AppLink>

      <label className="user-switcher" title="Switch demo user">
        <Avatar user={currentUser} size="small" />
        <span className="user-switcher__copy">
          <strong>{currentUser.name}</strong>
          <small>Demo workspace</small>
        </span>
        <select
          aria-label="Current demo user"
          value={currentUser.id}
          onChange={(event) => {
            const nextUser = users.find((user) => user.id === event.target.value);
            if (nextUser) onUserChange(nextUser);
          }}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </label>
    </header>
  );
}
