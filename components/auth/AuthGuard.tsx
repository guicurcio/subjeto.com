// C:\Users\gigi\webs\subjeto.com\components\auth\AuthGuard.tsx
"use client";

import { useAuthenticationStatus, useNhostClient } from "@nhost/react";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const nhost = useNhostClient();

  if (isLoading) {
    return <div className=""></div>;
  }

  // Always render the children (no modal).
  return <>{children}</>;
}
