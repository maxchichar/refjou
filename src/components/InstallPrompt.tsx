"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "refjou-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const alreadyStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (alreadyStandalone || dismissed) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <p className="text-sm text-paper">
          <span className="mr-1">🔥</span>
          Install refjou for quicker daily check-ins.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={handleDismiss} className="text-sm text-muted hover:text-paper">
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="rounded-full bg-ember px-3 py-1.5 text-sm font-medium text-ink transition hover:opacity-90"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
