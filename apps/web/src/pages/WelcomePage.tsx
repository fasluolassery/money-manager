import { useMe } from "@/features/users/api.js";
import { WelcomeForm } from "@/features/users/components/WelcomeForm.js";
import { usePageTitle } from "@/lib/use-page-title.js";

/** First sign-in setup (Spec Rule 13, UI.md 3.9). `RequireAuth` has already loaded `me`. */
export default function WelcomePage() {
  usePageTitle("Welcome");
  const { data: me } = useMe();

  if (me === undefined) {
    return <div className="text-body text-text-muted p-4" aria-busy="true" />;
  }
  return <WelcomeForm me={me} />;
}
