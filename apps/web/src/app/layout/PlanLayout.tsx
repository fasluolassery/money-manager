import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils.js";
import { PLAN_TABS } from "./NavItems.js";

export function PlanLayout() {
  return (
    <div className="flex flex-col">
      <nav aria-label="Plan sections" className="flex border-b border-border">
        {PLAN_TABS.map((tab) => (
          <NavLink
            key={tab.href}
            to={tab.href}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-4 py-3 text-label",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
