import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { AppHeader } from "./components/AppHeader";
import { api } from "./lib/api";
import { NAVIGATION_EVENT } from "./lib/navigation";
import { DashboardPage } from "./pages/DashboardPage";
import type { User } from "./types";

const USER_STORAGE_KEY = "collabdocs-demo-user";
const EditorPage = lazy(() =>
  import("./pages/EditorPage").then((module) => ({ default: module.EditorPage })),
);

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    window.addEventListener(NAVIGATION_EVENT, syncPath);
    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener(NAVIGATION_EVENT, syncPath);
    };
  }, []);

  const documentId = useMemo(() => {
    const match = pathname.match(/^\/documents\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [pathname]);

  useEffect(() => {
    api.users
      .list()
      .then((result) => {
        setUsers(result);
        const storedId = localStorage.getItem(USER_STORAGE_KEY);
        setCurrentUser(result.find((user) => user.id === storedId) ?? result[0] ?? null);
        setError(result.length ? null : "No demo users are available.");
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "The workspace could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  function selectUser(user: User) {
    localStorage.setItem(USER_STORAGE_KEY, user.id);
    setCurrentUser(user);
  }

  if (loading) {
    return (
      <main className="app-boot">
        <span className="brand__mark">
          <LoaderCircle className="spin" size={23} />
        </span>
        <h1>Opening CollabDocs</h1>
        <p>Connecting to your demo workspace…</p>
      </main>
    );
  }

  if (error || !currentUser) {
    return (
      <main className="app-boot app-boot--error">
        <h1>Workspace unavailable</h1>
        <p>{error ?? "No demo user could be selected."}</p>
        <button
          className="button button--primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={17} />
          Try again
        </button>
      </main>
    );
  }

  return (
    <div className="app">
      <AppHeader
        users={users}
        currentUser={currentUser}
        onUserChange={selectUser}
        compact={pathname !== "/"}
      />
      {documentId ? (
        <Suspense
          fallback={
            <main className="editor-state">
              <LoaderCircle className="spin" size={26} />
              <h1>Preparing the editor</h1>
              <p>Loading the rich-text workspace…</p>
            </main>
          }
        >
          <EditorPage
            key={`${currentUser.id}:${documentId}`}
            currentUser={currentUser}
            users={users}
            documentId={documentId}
          />
        </Suspense>
      ) : (
        <DashboardPage key={currentUser.id} currentUser={currentUser} />
      )}
    </div>
  );
}
