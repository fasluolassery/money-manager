import { ERROR_MESSAGES } from "@money-manager/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.js";
import {
  signOutCurrentSession,
  useAuthSession,
  useInvalidateAuthSession,
} from "@/lib/auth-session.js";
import { usePageTitle } from "@/lib/use-page-title.js";

/** Settings shell for #17: log out current session only (UI.md 3.7; all-devices is #53). */
export default function SettingsPage() {
  usePageTitle("Settings");
  const navigate = useNavigate();
  const { data: session } = useAuthSession();
  const invalidateSession = useInvalidateAuthSession();
  const [busy, setBusy] = useState(false);

  async function logOut() {
    setBusy(true);
    try {
      await signOutCurrentSession();
      invalidateSession();
      void navigate("/sign-in", { replace: true });
    } catch {
      toast.error(ERROR_MESSAGES.INTERNAL_ERROR);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title text-text">Settings</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-caption text-text-muted">Account</h2>
        {session !== null && session !== undefined ? (
          <p className="text-body text-text">{session.user.name}</p>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="justify-start px-0"
          busy={busy}
          onClick={() => void logOut()}
        >
          Log out
        </Button>
      </section>
    </div>
  );
}
