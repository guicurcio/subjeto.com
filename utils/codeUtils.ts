// utils/codeUtils.ts
export interface CodeBlock {
    /** Detected code content */
    code: string;
    /** Language if present (e.g., ```js) */
    language?: string;
    /** The full matched string from original text */
    fullMatch: string;
  }
  
  /**
   * Find code blocks in the message text. Looks for triple backticks or single backticks.
   * Example:
   *   ```js
   *   console.log("Hello");
   *   ```
   * Or single-backtick inline code:
   *   `const foo = 123;`
   */
  export function detectCodeBlocks(text: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
  
    // Regex to match triple-backtick code blocks with optional language
    const tripleRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = tripleRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const language = match[1]?.trim() || "plaintext";
      const code = match[2]?.trim() || "";
      codeBlocks.push({ code, language, fullMatch });
    }
  
    // Regex to match single-backtick inline code (very basic, no multiline support)
    const inlineRegex = /`([^`]+)`/g;
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      const fullMatch = inlineMatch[0];
      const code = inlineMatch[1]?.trim() || "";
      codeBlocks.push({ code, language: "plaintext", fullMatch });
    }
  
    return codeBlocks;
  }
  
  /**
   * Replaces recognized code blocks in the text with placeholders or
   * a known token so you can render them separately.
   *
   * Example: "Here is some code ```js\nconsole.log(123)\n``` okay?"
   * becomes something like:
   * "Here is some code [[CODEBLOCK_0]] okay?"
   */
  export function replaceCodeBlocks(text: string, codeBlocks: CodeBlock[]): string {
    let result = text;
    codeBlocks.forEach((block, index) => {
      result = result.replace(block.fullMatch, `[[CODEBLOCK_${index}]]`);
    });
    return result;
  }
  