"use client";

import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("wb_theme") : null;
    if (saved === "dark") setIsDark(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("wb_theme", next ? "dark" : "light");
      }
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}
