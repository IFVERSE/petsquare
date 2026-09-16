"use client";

import { useState, useRef, useEffect } from "react";
import { Moon, Leaf, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const options = [
  { id: "nord-forest" as const, label: "Nord & Forest", icon: Leaf, hint: "Default — light & earthy" },
  { id: "midnight-oled" as const, label: "Midnight OLED", icon: Moon, hint: "True blacks, low glare" },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = options.find((o) => o.id === theme) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full text-sm text-navy/70 transition-colors hover:text-navy ${
          compact ? "" : ""
        }`}
      >
        <current.icon className="h-4 w-4" />
        {!compact && <span>Theme</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-paper-dim bg-paper shadow-[var(--shadow-card-hover)]">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setTheme(opt.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper-dim/50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-dim text-navy/70">
                <opt.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-navy">{opt.label}</span>
                <span className="block text-xs text-navy/50">{opt.hint}</span>
              </span>
              {theme === opt.id && <Check className="h-4 w-4 shrink-0 text-tangerine" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
