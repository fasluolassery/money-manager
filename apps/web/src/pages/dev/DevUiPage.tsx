// Dev-only page — excluded from production builds via router.tsx conditional import.

import type { Paise } from "@money-manager/shared";
import { useState } from "react";
import { toast } from "sonner";
import { Amount } from "@/components/Amount.js";
import { Autocomplete } from "@/components/Autocomplete.js";
import { ConfirmDialog } from "@/components/ConfirmDialog.js";
import { DateField } from "@/components/DateField.js";
import { EmptyState } from "@/components/EmptyState.js";
import { ErrorState } from "@/components/ErrorState.js";
import { EmojiPicker } from "@/components/emoji-picker/index.js";
import { OfflineBanner } from "@/components/OfflineBanner.js";
import { ProgressBar } from "@/components/ProgressBar.js";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer.js";
import { SegmentedControl } from "@/components/SegmentedControl.js";
import { TextArea } from "@/components/TextArea.js";
import { TextField } from "@/components/TextField.js";
import { Toaster } from "@/components/Toaster.js";
import { Badge } from "@/components/ui/badge.js";
import { Button } from "@/components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { Skeleton } from "@/components/ui/skeleton.js";

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

const AMOUNTS: {
  label: string;
  paise: Paise;
  variant: "expense" | "income" | "total" | "left-over" | "balance";
}[] = [
  { label: "expense (₹2,400)", paise: 240000 as Paise, variant: "expense" },
  { label: "income (₹85,000)", paise: 8500000 as Paise, variant: "income" },
  { label: "total (₹1,24,500)", paise: 12450000 as Paise, variant: "total" },
  { label: "left-over +", paise: 2200000 as Paise, variant: "left-over" },
  { label: "left-over −", paise: -800000 as Paise, variant: "left-over" },
  { label: "balance −", paise: -50000 as Paise, variant: "balance" },
  { label: "zero income", paise: 0 as Paise, variant: "income" },
  { label: "paise (₹125.50)", paise: 12550 as Paise, variant: "expense" },
  { label: "lakh (₹1,00,000)", paise: 10000000 as Paise, variant: "income" },
  { label: "crore (₹1,00,00,000)", paise: 1000000000 as Paise, variant: "income" },
];

function ButtonsSection() {
  const [busy, setBusy] = useState(false);
  function simulateBusy() {
    setBusy(true);
    setTimeout(() => setBusy(false), 2000);
  }
  return (
    <section>
      <h2 className="text-heading mb-4">Buttons (UI.md 5.2–5.3)</h2>
      <div className="flex flex-wrap gap-3 items-center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="danger-ghost">Danger Ghost</Button>
        <Button variant="primary" busy={busy} onClick={simulateBusy}>
          Busy (click me)
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <Button size="sm" variant="primary">
          Small
        </Button>
        <Button size="default" variant="primary">
          Default
        </Button>
        <Button size="lg" variant="primary">
          Large
        </Button>
        <Button size="icon" variant="primary">
          +
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-caption text-text-muted">FAB (shown in-flow):</span>
        <button
          type="button"
          className="h-14 w-14 rounded-full shadow-fab bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center text-heading"
          aria-label="Add"
        >
          +
        </button>
      </div>
    </section>
  );
}

function AmountSection() {
  return (
    <section>
      <h2 className="text-heading mb-4">Amount (UI.md 5.3, Spec Rule 14)</h2>
      <div className="bg-surface rounded-[var(--radius-lg)] p-6 border border-border space-y-3">
        {AMOUNTS.map(({ label, paise, variant }) => (
          <div key={label} className="flex items-baseline justify-between">
            <span className="text-label text-text-muted w-52 shrink-0">{label}</span>
            <Amount paise={paise} variant={variant} className="text-heading" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CardBadgeSection() {
  return (
    <section>
      <h2 className="text-heading mb-4">Card + Badge</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Electricity</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Amount paise={240000 as Paise} variant="expense" className="text-heading" />
            <Badge variant="overdue">3 days overdue</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Internet</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Amount paise={120000 as Paise} variant="expense" className="text-heading" />
            <Badge variant="upcoming">Due in 5 days</Badge>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-2 mt-4">
        <Badge variant="upcoming">Upcoming</Badge>
        <Badge variant="overdue">Overdue</Badge>
        <Badge variant="paused">Paused</Badge>
        <Badge variant="source">Auto</Badge>
      </div>
    </section>
  );
}

function SkeletonSection() {
  return (
    <section>
      <h2 className="text-heading mb-4">Skeleton (UI.md 5.1)</h2>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-3 mt-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </section>
  );
}

function DialogSection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <section>
      <h2 className="text-heading mb-4">ResponsiveDrawer + ConfirmDialog</h2>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          Open ResponsiveDrawer
        </Button>
        <Button variant="danger-ghost" onClick={() => setConfirmOpen(true)}>
          Open ConfirmDialog
        </Button>
      </div>
      <ResponsiveDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Add transaction"
        description="Enter the details below."
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => setDrawerOpen(false)}>
              Save
            </Button>
          </div>
        }
      >
        <p className="text-body text-text-muted py-4">
          Form content goes here (inputs in issue #59).
        </p>
      </ResponsiveDrawer>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete transaction?"
        description="This will permanently remove this transaction. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success("Transaction deleted");
        }}
      />
    </section>
  );
}

function ToastsSection() {
  return (
    <section>
      <h2 className="text-heading mb-4">Toasts (UI.md 7.2)</h2>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => toast.success("Transaction saved")}>
          Success
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast.error("Couldn't save — try again")}
        >
          Error
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            toast("Transaction deleted", {
              action: { label: "Undo", onClick: () => toast.success("Undo successful") },
            })
          }
        >
          With action (6s)
        </Button>
      </div>
    </section>
  );
}

function EmptyErrorSection() {
  return (
    <section>
      <h2 className="text-heading mb-4">Empty & Error states (UI.md 5.1)</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <EmptyState
              message="No transactions yet. Add one to get started."
              actionLabel="Add transaction"
              onAction={() => toast("Add transaction clicked")}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <ErrorState requestId="req_abc123" onRetry={() => toast("Retrying…")} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TokenSections() {
  return (
    <>
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
    </>
  );
}

function TextFieldsSection() {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  return (
    <section>
      <h2 className="text-heading mb-4">TextField + TextArea (UI.md 5.3)</h2>
      <div className="space-y-4 max-w-sm">
        <TextField
          label="Payee"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Swiggy"
          maxLength={100}
        />
        <TextField
          label="With error"
          value=""
          onChange={() => {}}
          error="This field is required."
        />
        <TextArea
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          maxLength={500}
        />
      </div>
    </section>
  );
}

function DateAutoSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [payee, setPayee] = useState("");
  const payeeOptions = [
    { value: "swiggy", label: "Swiggy" },
    { value: "zomato", label: "Zomato" },
    { value: "amazon", label: "Amazon" },
    { value: "netflix", label: "Netflix" },
  ];
  return (
    <section>
      <h2 className="text-heading mb-4">DateField + Autocomplete (UI.md 5.3)</h2>
      <div className="space-y-4 max-w-sm">
        <DateField label="Transaction date" value={date} onChange={setDate} disableFuture />
        <DateField label="Due date (future allowed)" value={date} onChange={setDate} />
        <Autocomplete
          label="Payee"
          options={payeeOptions}
          value={payee}
          onChange={setPayee}
          placeholder="Search payees…"
          emptyText="No payees yet."
        />
      </div>
    </section>
  );
}

function SegmentedProgressSection() {
  const [type, setType] = useState("expense");
  return (
    <section>
      <h2 className="text-heading mb-4">SegmentedControl + ProgressBar (UI.md 5.3)</h2>
      <div className="space-y-4 max-w-sm">
        <SegmentedControl
          label="Type"
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          value={type}
          onChange={setType}
        />
        <SegmentedControl
          label="Lending"
          options={[
            { value: "lent", label: "I lent" },
            { value: "borrowed", label: "I borrowed" },
          ]}
          value="lent"
          onChange={() => {}}
        />
        <ProgressBar percent={65} className="mt-6" />
        <ProgressBar percent={24} label="₹12,000 of ₹50,000" />
      </div>
    </section>
  );
}

function EmojiSection() {
  const [emoji, setEmoji] = useState("🍕");
  const [open, setOpen] = useState(false);
  return (
    <section>
      <h2 className="text-heading mb-4">EmojiPicker (UI.md 5.4)</h2>
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <span className="text-heading mr-2">{emoji}</span>
          Change emoji
        </Button>
        <span className="text-label text-text-muted">Selected: {emoji}</span>
      </div>
      <EmojiPicker open={open} onOpenChange={setOpen} value={emoji} onChange={setEmoji} />
    </section>
  );
}

export default function DevUiPage() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }
  return (
    <div className="min-h-screen bg-background text-text p-8 font-sans">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <h1 className="text-title">Design Tokens · Dev</h1>
          <Button onClick={toggleTheme} variant="secondary" size="sm">
            {dark ? "Switch to Light" : "Switch to Dark"}
          </Button>
        </header>
        <ButtonsSection />
        <AmountSection />
        <CardBadgeSection />
        <SkeletonSection />
        <DialogSection />
        <ToastsSection />
        <EmptyErrorSection />
        <TextFieldsSection />
        <DateAutoSection />
        <SegmentedProgressSection />
        <EmojiSection />
        <section>
          <h2 className="text-heading mb-4">OfflineBanner (UI.md 5.1)</h2>
          <p className="text-body text-text-muted">
            Go offline (DevTools → Network → Offline) to see the banner appear at the top.
          </p>
          <OfflineBanner />
        </section>
        <TokenSections />
      </div>
    </div>
  );
}
