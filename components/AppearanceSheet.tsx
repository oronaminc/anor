"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Palette, X } from "lucide-react";

import { AppearancePanel } from "@/components/AppearancePanel";

export function AppearanceSheet() {
  const t = useTranslations("appearance");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("title")}
        className="inline-flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted active:scale-95"
      >
        <Palette className="size-5" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("title")}
              className="relative w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
              variants={{
                hidden: { y: 40, opacity: 0 },
                visible: { y: 0, opacity: 1 },
              }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("title")}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  autoFocus
                >
                  <X className="size-5" />
                </button>
              </div>
              <AppearancePanel />
            </motion.div>
          </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
