import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { navigate } from "../lib/navigation";

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
};

export function AppLink({ to, onClick, children, ...props }: AppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

