import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils.js";
import { NAV_ITEMS } from "./NavItems.js";

function isActive(href: string, matchPrefix: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(matchPrefix);
}

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className="flex w-56 flex-col border-r border-border bg-background pt-4 pl-safe"
    >
      <span className="px-4 pb-6 text-heading font-semibold text-text">Money Manager</span>
      <ul className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.matchPrefix, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-label",
                  active
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-text-muted hover:bg-surface-muted",
                )}
              >
                <Icon className="icon-nav shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
