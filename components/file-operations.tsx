"use client";

import { useState } from "react";
import { File } from "../types/editor";

interface FileOperationsProps {
  onSave: (file: File) => void;
  onLoad: (file: File) => void;
}

export function FileOperations({ onSave, onLoad }: FileOperationsProps) {
  const [fileName] = useState("");
  const handleSaveClick = () => {
    // Example: saving the currently open file
    const newFile: File = {
      id: Date.now().toString(),
      name: fileName || "untitled.txt",
      content: "",
      type: "code",
    };
    onSave(newFile);
  };

  const handleLoadClick = () => {
    // Example: loading a dummy file
    const loadedFile: File = {
      id: Date.now().toString(),
      name: "example.txt",
      content: "Hello from loaded file",
      type: "code",
    };
    onLoad(loadedFile);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSaveClick}
        className="text-xs px-2 py-1 hover:bg-zinc-800 rounded text-zinc-300"
      >
        Save
      </button>
      <button
        onClick={handleLoadClick}
        className="text-xs px-2 py-1 hover:bg-zinc-800 rounded text-zinc-300"
      >
        Load
      </button>
    </div>
  );
}
