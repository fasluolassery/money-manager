import { ResponsiveDrawer } from "@/components/ResponsiveDrawer.js";

interface AddTransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDrawer({ open, onOpenChange }: AddTransactionDrawerProps) {
  return (
    <ResponsiveDrawer open={open} onOpenChange={onOpenChange} title="Add transaction">
      <p className="text-body text-text-muted py-4">Add form coming soon.</p>
    </ResponsiveDrawer>
  );
}
