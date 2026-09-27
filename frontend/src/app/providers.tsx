"use client";

import type { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

import { LanguageProvider } from "@/i18n/language-provider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      <ThirdwebProvider>{children}</ThirdwebProvider>
    </LanguageProvider>
  );
}
