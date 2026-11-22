import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils.js";
import { NAV_ITEMS } from "./NavItems.js";

function isActive(href: string, matchPrefix: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(matchPrefix);
}

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-background pb-safe"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, item.matchPrefix, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 px-2 py-2 text-caption",
              active ? "text-primary" : "text-text-muted",
            )}
          >
            <Icon className="icon-nav" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
