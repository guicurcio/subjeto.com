// providers/EventBusProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  PropsWithChildren,
} from "react";

type FileModifiedPayload = {
  filePath: string;
};

type Events = {
  fileModified: FileModifiedPayload;
};

type EventHandler<E> = (payload: E) => void;

export class EventBus {
  private listeners: Record<keyof Events, EventHandler<any>[]> = {
    fileModified: [],
  };

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    this.listeners[event].push(handler);
    return () => {
      // un-subscribe
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    for (const handler of this.listeners[event]) {
      handler(payload);
    }
  }
}

const EventBusContext = createContext<EventBus | null>(null);

export function EventBusProvider({ children }: PropsWithChildren<{}>) {
  const busRef = useRef<EventBus | null>(null);
  if (!busRef.current) {
    busRef.current = new EventBus();
  }

  return (
    <EventBusContext.Provider value={busRef.current}>
      {children}
    </EventBusContext.Provider>
  );
}

export function useEventBus() {
  const ctx = useContext(EventBusContext);
  if (!ctx) {
    throw new Error("useEventBus must be used within EventBusProvider");
  }
  return ctx;
}
