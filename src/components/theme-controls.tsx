"use client";

import React, { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type SchemePref = "system" | "light" | "dark";

export function ColorSchemeControl() {
  const [pref, setPref] = useState<SchemePref>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onMq);

    try {
      const stored = localStorage.getItem("color-scheme");
      if (stored === "light" || stored === "dark") setPref(stored);
      else setPref("system");
    } catch {
      setPref("system");
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "color-scheme") {
        const v = e.newValue;
        const next: SchemePref = v === "light" || v === "dark" ? v : "system";
        setPref(next);
        applyMeta(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function applyMeta(next: SchemePref) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute("content", next === "system" ? "light dark" : next);
    }
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  function selectScheme(next: SchemePref) {
    setPref(next);
    applyMeta(next);
    try {
      if (next === "system") localStorage.removeItem("color-scheme");
      else localStorage.setItem("color-scheme", next);
    } catch {
      // Ignore storage failures
    }
  }

  const options: Array<{ id: SchemePref; label: string; sub?: string; icon: React.ReactNode }> = [
    {
      id: "system",
      label: "System",
      sub: systemDark ? "Dark" : "Light",
      icon: <Monitor className="h-4 w-4" aria-hidden="true" />,
    },
    { id: "light", label: "Light", icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
    { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Color theme">
      {options.map((opt) => {
        const active = pref === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => selectScheme(opt.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer",
              active
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.sub ? <span className="text-[11px] opacity-75">({opt.sub})</span> : null}
          </button>
        );
      })}
    </div>
  );
}
