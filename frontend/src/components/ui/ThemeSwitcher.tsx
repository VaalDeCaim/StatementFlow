"use client";

import {useTheme} from "next-themes";
import {Button} from "@heroui/react";
import {Sun, Moon} from "lucide-react";
import {useEffect, useState} from "react";

export function ThemeSwitcher() {
  const {setTheme, resolvedTheme} = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log("mounted", mounted);
  if (!mounted) {
    return (
      <Button
        isIconOnly
        variant="light"
        size="sm"
        aria-label="Toggle theme"
        className="min-w-9 min-h-9"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onPress={() => {
        const root = document.documentElement;
        root.classList.add("theme-transition");
        setTheme(isDark ? "light" : "dark");
        window.setTimeout(() => {
          root.classList.remove("theme-transition");
        }, 150);
      }}
      className="min-w-9 min-h-9"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-default-600" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 text-default-600" aria-hidden />
      )}
    </Button>
  );
}
