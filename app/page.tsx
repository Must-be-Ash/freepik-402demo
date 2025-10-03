"use client";

import Providers from "@/components/Providers";
import ClientApp from "@/components/ClientApp";

export default function Home() {
  return (
    <Providers>
      <ClientApp />
    </Providers>
  );
}