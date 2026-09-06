"use client";

import type { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}
