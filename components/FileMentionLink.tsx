"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Renders a clickable mention like "@someFile.js"
 * with an onClick that triggers e.g. openFile() in your editor.
 */
interface FileMentionLinkProps {
  mention: string; // e.g. '@someFile.js'
  onClick: (fileName: string) => void;
  className?: string;
}

export function FileMentionLink({ mention, onClick, className }: FileMentionLinkProps) {
  const handleClick = () => {
    // Remove the '@' if present
    const fileName = mention.replace(/^@/, "");
    onClick(fileName);
  };

  return (
    <span
      className={cn("underline cursor-pointer text-blue-400", className)}
      onClick={handleClick}
    >
      {mention}
    </span>
  );
}
