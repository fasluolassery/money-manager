import { usePageTitle } from "@/lib/use-page-title.js";

export default function WelcomePage() {
  usePageTitle("Welcome");
  return <div>Welcome</div>;
}
