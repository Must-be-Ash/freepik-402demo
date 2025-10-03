"use client";

import { CDPReactProvider } from "@coinbase/cdp-react";
import { CDP_CONFIG, APP_CONFIG } from "@/lib/config";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CDPReactProvider config={CDP_CONFIG} app={APP_CONFIG}>
      {children}
    </CDPReactProvider>
  );
}