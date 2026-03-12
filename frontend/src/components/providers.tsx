"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(makeQueryClient);
  const router = useRouter();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HeroUIProvider
        navigate={(path) => router.push(String(path))}
        validationBehavior="native"
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}

