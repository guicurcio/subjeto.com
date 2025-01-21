// File: services/prettierService.ts
import prettier from "prettier";
import babelParser from "prettier/parser-babel";
import markdownParser from "prettier/parser-markdown";

// Minimal example for JS, TS, MD. Expand as you like.
type ParserType = "babel" | "markdown";

/**
 * Format code with Prettier in the browser.
 * @param code The code string to format
 * @param options Additional Prettier options
 * @returns A formatted code string
 */
export function formatWithPrettier(
  code: string,
  options?: prettier.Options & { parser?: ParserType }
): string {
  const parser = options?.parser ?? "babel";

  // Choose correct parser plugin
  const plugin = parser === "markdown" ? markdownParser : babelParser;

  return prettier.format(code, {
    parser,
    plugins: [plugin],
    singleQuote: true, // example default
    semi: true,
    ...options,
  });
}
