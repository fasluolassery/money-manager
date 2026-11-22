import { ErrorState } from "@/components/ErrorState.js";
import { usePageTitle } from "@/lib/use-page-title.js";

export default function NotFoundPage() {
  usePageTitle("Not found");
  return <ErrorState message="This page doesn't exist." />;
}
