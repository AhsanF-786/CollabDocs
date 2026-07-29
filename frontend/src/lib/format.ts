export function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const elapsedSeconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h ago`;
  if (elapsedSeconds < 604_800) return `${Math.floor(elapsedSeconds / 86_400)}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function htmlToPlainText(html: string): string {
  const container = window.document.createElement("div");
  container.innerHTML = html;
  return container.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

