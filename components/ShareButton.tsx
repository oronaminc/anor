"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * Copy/share the short link for a shop (/s/{shortId}). Uses the native share
 * sheet on mobile when available, otherwise copies to the clipboard.
 */
export function ShareButton({
  shortId,
  name,
  label,
  copied: copiedLabel,
}: {
  shortId: number;
  name: string;
  label: string;
  copied: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = `${window.location.origin}/s/${shortId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // user cancelled or share failed → fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
    >
      {copied ? (
        <>
          <Check className="size-3.5" /> {copiedLabel}
        </>
      ) : (
        <>
          <Share2 className="size-3.5" /> {label}
        </>
      )}
    </button>
  );
}
