// Dev-only page — excluded from production builds via router.tsx conditional import.
import { useState } from "react";

type ColorRow = { name: string; bg: string; label: string };
type TypographyRow = { name: string; cls: string; sample: string };

const COLORS: ColorRow[] = [
  { name: "background", bg: "bg-background", label: "App background" },
  { name: "surface", bg: "bg-surface", label: "Cards, sheets, dialogs" },
  { name: "surface-muted", bg: "bg-surface-muted", label: "Inputs, unselected tiles" },
  { name: "border", bg: "bg-border", label: "Borders, dividers" },
  { name: "text", bg: "bg-text", label: "Main text, expense amounts" },
  { name: "text-muted", bg: "bg-text-muted", label: "Labels, dates, secondary" },
  { name: "primary", bg: "bg-primary", label: "Buttons, active tab, links" },
  { name: "primary-foreground", bg: "bg-primary-foreground", label: "Text on primary" },
  { name: "primary-soft", bg: "bg-primary-soft", label: "Selected tile, upcoming badge" },
  { name: "income", bg: "bg-income", label: "Income amounts only" },
  { name: "alert", bg: "bg-alert", label: "Overdue, delete, form errors" },
  { name: "alert-soft", bg: "bg-alert-soft", label: "Background of overdue badges" },
];

const TYPOGRAPHY: TypographyRow[] = [
  { name: "amount-xl", cls: "text-amount-xl", sample: "₹48,000" },
  { name: "display", cls: "text-display", sample: "₹1,24,500" },
  { name: "title", cls: "text-title", sample: "Transactions" },
  { name: "heading", cls: "text-heading", sample: "This month" },
  { name: "body", cls: "text-body", sample: "Electricity — 15 Nov" },
  { name: "label", cls: "text-label", sample: "Amount (₹)" },
  { name: "caption", cls: "text-caption", sample: "3 days ago" },
];

const CHART_COLORS = [
  { name: "chart-1", bg: "bg-chart-1", label: "Violet" },
  { name: "chart-2", bg: "bg-chart-2", label: "Teal" },
  { name: "chart-3", bg: "bg-chart-3", label: "Amber" },
  { name: "chart-4", bg: "bg-chart-4", label: "Pink" },
  { name: "chart-5", bg: "bg-chart-5", label: "Sky" },
  { name: "chart-6", bg: "bg-chart-6", label: "Lime" },
  { name: "chart-7", bg: "bg-chart-7", label: "Orange" },
  { name: "chart-8", bg: "bg-chart-8", label: "Slate (lightened in dark)" },
];

const RADII = [
  { name: "radius-sm (8px)", cls: "rounded-sm", label: "Chips, badges" },
  { name: "radius-md (12px)", cls: "rounded-md", label: "Buttons, inputs" },
  { name: "radius-lg (16px)", cls: "rounded-lg", label: "Cards, dialogs" },
  { name: "radius-sheet (24px)", cls: "rounded-sheet", label: "Bottom sheet top corners" },
  { name: "radius-full", cls: "rounded-full", label: "FAB, avatars, toggles" },
];

export default function DevUiPage() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="min-h-screen bg-background text-text p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <h1 className="text-title">Design Tokens · Dev</h1>
          <button
            type="button"
            onClick={toggleTheme}
            className="text-label px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            {dark ? "Switch to Light" : "Switch to Dark"}
          </button>
        </header>

        <section>
          <h2 className="text-heading mb-4">Colours (UI.md 4.1)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLORS.map((c) => (
              <div key={c.name} className="rounded-lg border border-border overflow-hidden">
                <div className={`${c.bg} h-16`} />
                <div className="bg-surface p-2">
                  <p className="text-label text-text">{c.name}</p>
                  <p className="text-caption text-text-muted">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-heading mb-4">Typography (UI.md 4.2)</h2>
          <div className="space-y-4 bg-surface rounded-lg p-6 border border-border">
            {TYPOGRAPHY.map((t) => (
              <div key={t.name} className="flex items-baseline gap-4">
                <span className="text-caption text-text-muted w-24 shrink-0">{t.name}</span>
                <span className={`${t.cls} text-text tabular-nums`}>{t.sample}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-heading mb-4">Shape — radii (UI.md 4.4)</h2>
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r.name} className="text-center">
                <div className={`w-16 h-16 bg-primary-soft border-2 border-primary ${r.cls}`} />
                <p className="text-caption text-text-muted mt-1">{r.name}</p>
                <p className="text-caption text-text-muted">{r.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-heading mb-4">Chart palette (UI.md 4.1)</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {CHART_COLORS.map((c) => (
              <div key={c.name} className="text-center">
                <div className={`${c.bg} h-10 rounded-md`} />
                <p className="text-caption text-text-muted mt-1">{c.name}</p>
                <p className="text-caption text-text-muted">{c.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-heading mb-4">Elevation (UI.md 4.5)</h2>
          <p className="text-caption text-text-muted mb-4">
            Light: soft shadows. Dark: no shadows — higher layers use lighter surfaces.
          </p>
          <div className="flex gap-6 flex-wrap">
            <div className="shadow-card rounded-lg bg-surface p-6 border border-border">
              <p className="text-label text-text">shadow-card</p>
              <p className="text-caption text-text-muted">Cards and list rows</p>
            </div>
            <div className="shadow-fab rounded-full bg-primary w-14 h-14 flex items-center justify-center">
              <span className="text-primary-foreground text-heading">+</span>
            </div>
            <div className="shadow-modal rounded-lg bg-surface p-6">
              <p className="text-label text-text">shadow-modal</p>
              <p className="text-caption text-text-muted">Dialogs and sheets</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-heading mb-4">Semantic usage examples</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-body text-text">Electricity</span>
              <span className="text-body tabular-nums text-text">−₹2,400</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-body text-text">Salary</span>
              <span className="text-body tabular-nums text-income">+₹85,000</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-body text-text">Electricity bill</span>
              <span className="text-caption px-2 py-0.5 rounded-sm bg-alert-soft text-alert">
                3 days overdue
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
