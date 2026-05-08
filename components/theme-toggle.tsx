"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "skillbridge-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem(storageKey);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    const frame = window.requestAnimationFrame(() => {
      setTheme(initialTheme);
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  };

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const isDark = theme === "dark";

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className="fixed right-4 top-4 z-50 flex h-12 w-24 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm transition hover:bg-[var(--surface-hover)]"
      onClick={toggleTheme}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`theme-toggle-icon flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-strong)] shadow-md transition-transform ${
          isReady && isDark ? "translate-x-12" : "translate-x-0"
        }`}
      />
    </button>
  );
}
