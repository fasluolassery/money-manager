import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Non-blocking banner shown when the browser goes offline (UI.md 5.1). */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-surface-muted px-4 py-2 text-label text-text-muted shadow-card"
    >
      <WifiOff className="icon-content" aria-hidden />
      You're offline — changes won't save until you reconnect.
    </div>
  );
}
