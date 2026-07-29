export const NAVIGATION_EVENT = "collabdocs:navigate";

export function navigate(path: string, options: { replace?: boolean } = {}) {
  if (options.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

