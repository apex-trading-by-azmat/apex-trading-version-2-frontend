"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "icon";
}

export function ThemeToggle({ className, variant = "pill" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme || theme || "dark";
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);

    // Explicitly toggle classes and data attributes for instant synchronous feedback
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (nextTheme === "dark") {
        root.classList.remove("light");
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          variant === "icon"
            ? "w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground"
            : "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-mono text-muted-foreground",
          className
        )}
        title="Toggle theme"
      >
        <Moon className="w-3.5 h-3.5 text-primary" />
        {variant !== "icon" && <span className="hidden sm:inline">Theme</span>}
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "w-8 h-8 rounded-lg border border-border bg-card hover:bg-secondary flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground cursor-pointer shadow-sm",
          className
        )}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-warning" />
        ) : (
          <Moon className="w-4 h-4 text-primary" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-mono transition-colors text-muted-foreground hover:text-foreground cursor-pointer shadow-sm",
        className
      )}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-warning" />
          <span className="hidden sm:inline font-semibold">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline font-semibold">Dark</span>
        </>
      )}
    </button>
  );
}
