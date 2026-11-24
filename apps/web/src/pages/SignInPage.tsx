import { APP_NAME } from "@money-manager/shared";
import { lazy, Suspense, useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.js";
import { safeReturnTo } from "@/lib/auth-return-to.js";
import { useAuthSession } from "@/lib/auth-session.js";
import { usePageTitle } from "@/lib/use-page-title.js";

const EmptyIllustration = lazy(() => import("@/assets/illustrations/EmptyIllustration.js"));

/** Google sign-in (UI.md 3.9, DESIGN 7.1). */
export default function SignInPage() {
  usePageTitle("Sign in");
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("from"));
  const { data: session, isPending } = useAuthSession();
  const [busy, setBusy] = useState(false);

  if (!isPending && session !== null && session !== undefined) {
    return <Navigate to={returnTo} replace />;
  }

  async function continueWithGoogle() {
    setBusy(true);
    try {
      const { authClient, SIGN_IN_FAILED_MESSAGE } = await import("@/lib/auth-client.js");
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: returnTo,
        errorCallbackURL: `/sign-in?from=${encodeURIComponent(returnTo)}`,
      });
      if (error) {
        toast.error(SIGN_IN_FAILED_MESSAGE);
        setBusy(false);
      }
      // On success Better Auth redirects to Google; keep busy until navigation.
    } catch {
      const { SIGN_IN_FAILED_MESSAGE } = await import("@/lib/auth-client.js");
      toast.error(SIGN_IN_FAILED_MESSAGE);
      setBusy(false);
    }
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <img src="/icon.svg" alt="" width={64} height={64} className="size-16" />
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-text">{APP_NAME}</h1>
        <p className="text-body text-text-muted max-w-xs">Know exactly where your money goes.</p>
      </div>
      <Suspense fallback={<div className="h-32 w-32" aria-hidden />}>
        <EmptyIllustration className="text-primary h-32 w-32" aria-hidden="true" role="img" />
      </Suspense>
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full max-w-sm"
        busy={busy}
        onClick={() => void continueWithGoogle()}
      >
        Continue with Google
      </Button>
    </div>
  );
}
