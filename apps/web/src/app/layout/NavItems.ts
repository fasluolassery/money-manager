import type { LucideIcon } from "lucide-react";
import { CalendarCheck, ChartPie, House, Receipt, Settings } from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  matchPrefix: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: House, href: "/", matchPrefix: "/" },
  { label: "Transactions", icon: Receipt, href: "/transactions", matchPrefix: "/transactions" },
  { label: "Reports", icon: ChartPie, href: "/reports", matchPrefix: "/reports" },
  { label: "Plan", icon: CalendarCheck, href: "/plan/bills", matchPrefix: "/plan" },
  { label: "Settings", icon: Settings, href: "/settings", matchPrefix: "/settings" },
];

export const PLAN_TABS = [
  { label: "Bills", href: "/plan/bills", value: "bills" },
  { label: "Goals", href: "/plan/goals", value: "goals" },
  { label: "Lending", href: "/plan/lending", value: "lending" },
];
