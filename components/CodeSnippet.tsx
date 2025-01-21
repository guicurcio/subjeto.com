// components/CodeSnippet.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

// Example: if you're using react-syntax-highlighter
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
// Optionally import only the languages you need, e.g.:
// import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
// SyntaxHighlighter.registerLanguage("javascript", js);
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeSnippetProps {
  code: string;
  language?: string;
}

/**
 * Renders a code block with syntax highlighting and a "Copy" button.
 */
export function CodeSnippet({ code, language = "plaintext" }: CodeSnippetProps) {
  // Attempt to copy text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch((err) => console.error(err));
  };

  return (
    <div className="relative my-2">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-200"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ paddingTop: "2.5rem", borderRadius: "4px" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
