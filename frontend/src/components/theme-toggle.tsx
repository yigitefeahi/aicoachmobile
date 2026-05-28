"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "aicoach-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    document.documentElement.dataset.theme = initialTheme;
    const frame = window.requestAnimationFrame(() => {
      setTheme(initialTheme);
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (pathname.startsWith("/interview/presence")) {
    return null;
  }

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      <span>{mounted && theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
