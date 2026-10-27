"use client";

import React, { ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui";

export function Providers({ children }: { children: ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
