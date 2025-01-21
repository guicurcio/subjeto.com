// File: services/eslintService.ts

import { ESLint } from "eslint";
import * as monaco from "monaco-editor";

// Create a single ESLint instance (reused)
const eslint = new ESLint({
  baseConfig: {
    parserOptions: { ecmaVersion: 2020, sourceType: "module" },
    env: { browser: true, es2021: true },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": "warn",
      // add more rules as needed
    },
  },
  useEslintrc: false, // if you want to load .eslintrc, set true
});

/**
 * Runs ESLint on the given code (only 1 file).
 * @param code The code to lint
 * @param fileName e.g. "index.js"
 * @returns The array of LintResult (should have 1 item)
 */
export async function lintCode(code: string, fileName: string) {
  // ESLint expects a param "filePath" if you want plugin-based decisions
  const results = await eslint.lintText(code, { filePath: fileName });
  return results;
}

/**
 * Convert ESLint messages to Monaco markers and set them on the editor
 */
export function setMarkersFromESLint(
  editor: monaco.editor.IStandaloneCodeEditor,
  results: ESLint.LintResult[]
) {
  const markers: monaco.editor.IMarkerData[] = [];
  if (results && results.length > 0) {
    const { messages } = results[0];
    for (const msg of messages) {
      markers.push({
        severity:
          msg.severity === 2
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        message: msg.message,
        startLineNumber: msg.line,
        startColumn: msg.column,
        endLineNumber: msg.endLine || msg.line,
        endColumn: msg.endColumn || msg.column + 1,
      });
    }
  }

  const model = editor.getModel();
  if (model) {
    monaco.editor.setModelMarkers(model, "eslint", markers);
  }
}
