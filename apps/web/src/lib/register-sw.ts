import { registerSW } from "virtual:pwa-register";

type UpdateFn = (reloadPage?: boolean) => Promise<void>;

export function initServiceWorker(onUpdate: (updateSW: UpdateFn) => void): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      onUpdate(updateSW);
    },
    onOfflineReady() {
      // App shell is cached; no action needed (D-05: online-only app)
    },
  });
}
