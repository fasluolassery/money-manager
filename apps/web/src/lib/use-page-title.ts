import { useEffect } from "react";

/** Sets the browser tab title. Format: "Page · Money Manager"; Home omits the page name. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Money Manager` : "Money Manager";
  }, [title]);
}
