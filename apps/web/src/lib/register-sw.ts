import { registerSW } from "virtual:pwa-register";

export function initServiceWorker(onUpdate: () => void): void {
  registerSW({
    onNeedRefresh() {
      onUpdate();
    },
    onOfflineReady() {
      // App shell is cached; no action needed (D-05: online-only app)
    },
  });
}
