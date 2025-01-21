"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFloating, offset, flip, shift, Placement } from "@floating-ui/react";
import { Command } from "lucide-react"; // or from "@shadcn/ui" if you prefer
import { Command as ShadcnCommand } from "@/components/ui/command"; // The shadcn "Command" container
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Example "chat" content or logic you want inside the Command popover
function ChatContent() {
  const [value, setValue] = React.useState("");
  const handleSubmit = () => {
    // replace with your own logic
    alert(`You said: ${value}`);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-sm text-zinc-500 pb-1">Ask ChatGPT anything</p>
      <Input
        placeholder="Type your question..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
      />
      <Button onClick={handleSubmit} variant="default">
        Send
      </Button>
    </div>
  );
}

interface ChatCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: Placement;
}

/**
 * A Command-based popover that toggles open/closed.
 */
export function ChatCommand({
  open,
  onOpenChange,
  placement = "bottom-end",
}: ChatCommandProps) {
  // Setup floating-ui for positioning
  const { x, y, reference, floating, strategy, context } = useFloating({
    open,
    onOpenChange,
    middleware: [offset(6), flip(), shift()],
    placement,
  });

  return (
    <>
      {/* The button that toggles the popover */}
      <Button
        ref={reference}
        variant="ghost"
        size="sm"
        onClick={() => onOpenChange(!open)}
        className="gap-1"
      >
        <Command className="h-4 w-4" />
        <span>Chat</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={floating}
            style={{
              position: strategy,
              left: x ?? 0,
              top: y ?? 0,
              zIndex: 50, // ensure it's above most elements
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* ShadCN Command container */}
            <ShadcnCommand className="w-64 border border-zinc-700 bg-zinc-800 rounded-md shadow-lg overflow-hidden">
              <ChatContent />
            </ShadcnCommand>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
