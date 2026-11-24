import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button.js";

interface TopBarProps {
  onAdd: () => void;
}

export function TopBar({ onAdd }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 pr-safe">
      <span className="text-heading font-semibold text-text">Outgo</span>
      <Button variant="primary" size="sm" onClick={onAdd}>
        <Plus className="icon-content mr-1" aria-hidden />
        Add
      </Button>
    </header>
  );
}
