import { Outlet, useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.js";
import { PLAN_TABS } from "./NavItems.js";

export function PlanLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const segment = pathname.split("/")[2] ?? "bills";

  return (
    <Tabs value={segment} onValueChange={(v) => navigate(`/plan/${v}`)}>
      <TabsList className="mb-4">
        {PLAN_TABS.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <Outlet />
    </Tabs>
  );
}
