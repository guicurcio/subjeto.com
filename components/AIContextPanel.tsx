// components/AiContextPanel.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface AiContextPanelProps {
  context: string[]; 
  /**
   * Optionally, you might store additional info:
   *   - token usage
   *   - system prompts
   *   - role-based context, etc.
   */
}

/**
 * Displays a collapsible panel showing the AI's current context.
 */
export function AiContextPanel({ context }: AiContextPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="text-zinc-400 hover:text-zinc-200"
      >
        <Info className="h-5 w-5" />
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 p-3 rounded shadow-lg text-sm text-zinc-200">
          <p className="font-medium mb-2">AI Context</p>
          <ul className="list-disc list-inside">
            {context.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
