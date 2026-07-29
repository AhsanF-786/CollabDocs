import { initials } from "../lib/format";
import type { User } from "../types";

interface AvatarProps {
  user: User;
  size?: "small" | "medium";
}

export function Avatar({ user, size = "medium" }: AvatarProps) {
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{ backgroundColor: user.avatar_color }}
      aria-hidden="true"
    >
      {initials(user.name)}
    </span>
  );
}

