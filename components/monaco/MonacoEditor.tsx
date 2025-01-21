// File: components/monaco/MonacoEditor.tsx
"use client";

import React, { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

interface MonacoEditorProps {
  fileName: string;
  language: string;
  content: string;
  onContentChange: (newContent: string) => void;
}

export function MonacoEditor({
  fileName,
  language,
  content,
  onContentChange,
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // When user types, we pass up new content
    editor.onDidChangeModelContent(() => {
      const newVal = editor.getValue();
      onContentChange(newVal);
    });
  };

  // If the 'content' prop changes from outside, update the editor's value
  useEffect(() => {
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue();
      if (currentVal !== content) {
        editorRef.current.setValue(content);
      }
    }
  }, [content]);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      defaultLanguage={language}
      path={fileName}
      defaultValue={content}
      onMount={handleEditorDidMount}
    />
  );
}
