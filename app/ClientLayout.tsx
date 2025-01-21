"use client";

import React from "react";

import { WebContainerProvider } from "./providers/WebContainerProvider";
import { EventBusProvider } from "./providers/EventBusProvider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <WebContainerProvider>
        <EventBusProvider>
         {children}
        </EventBusProvider>
      </WebContainerProvider>
  );
}
