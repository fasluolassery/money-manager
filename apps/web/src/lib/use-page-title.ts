import { useEffect } from "react";

/** Sets the browser tab title. Format: "Page · Outgo"; Home omits the page name. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Outgo` : "Outgo";
  }, [title]);
}
