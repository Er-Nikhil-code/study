"use client";

import { useMemo } from "react";
import katex from "katex";

/**
 * Renders text that may contain LaTeX math notation.
 * - Inline math: $...$ 
 * - Display math: $$...$$
 * - Also renders bullet points and line breaks
 */
export default function MathRenderer({ text, className = "" }: { text: string; className?: string }) {
  const rendered = useMemo(() => {
    if (!text) return "";

    try {
      // Split on display math first ($$...$$), then inline math ($...$)
      // Process display math: $$...$$
      let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return `<div class="math-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<code>${math}</code>`;
        }
      });

      // Process inline math: $...$  (but not already processed $$)
      result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<code>${math}</code>`;
        }
      });

      // Normalize inline bullets and "Answer:" to ensure they start on a new line
      result = result.replace(/([^\n])\s*([•])\s/g, '$1\n$2 ');
      result = result.replace(/([^\n])\s*(Answer:)/g, '$1\n$2');

      // Convert bullet points (•, -, *) at the start of lines to proper list items
      const lines = result.split("\n");
      let inList = false;
      const processedLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        const isBullet = /^[•\-\*]\s/.test(trimmed);

        if (isBullet) {
          if (!inList) {
            processedLines.push('<ul class="math-list">');
            inList = true;
          }
          processedLines.push(`<li>${trimmed.replace(/^[•\-\*]\s/, "")}</li>`);
        } else {
          if (inList) {
            processedLines.push("</ul>");
            inList = false;
          }
          if (trimmed) {
            processedLines.push(`<p>${trimmed}</p>`);
          }
        }
      }
      if (inList) processedLines.push("</ul>");

      return processedLines.join("");
    } catch {
      return text;
    }
  }, [text]);

  return (
    <div
      className={`math-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
