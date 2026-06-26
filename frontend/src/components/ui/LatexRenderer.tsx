"use client";

import { useEffect, useRef } from "react";

/**
 * Renders LaTeX math expressions using KaTeX.
 * Supports both inline ($...$) and display ($$...$$) math.
 * Falls back to raw text if KaTeX isn't loaded or rendering fails.
 */
interface LatexRendererProps {
  /** The LaTeX string to render (without $ delimiters) */
  content: string;
  /** Whether to render in display mode (centered, larger) vs inline */
  displayMode?: boolean;
  /** Additional CSS class */
  className?: string;
}

export default function LatexRenderer({
  content,
  displayMode = false,
  className = "",
}: LatexRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Dynamically import KaTeX to avoid SSR issues
    import("katex")
      .then((katex) => {
        if (!containerRef.current) return;
        try {
          containerRef.current.innerHTML = katex.default.renderToString(
            content,
            {
              displayMode,
              throwOnError: false,
              trust: true,
              strict: false,
            },
          );
        } catch {
          // Fallback: show raw LaTeX
          if (containerRef.current) {
            containerRef.current.textContent = content;
          }
        }
      })
      .catch(() => {
        // KaTeX not available, show raw text
        if (containerRef.current) {
          containerRef.current.textContent = content;
        }
      });
  }, [content, displayMode]);

  return (
    <span
      ref={containerRef}
      className={`latex-content ${className}`}
      suppressHydrationWarning
    >
      {content}
    </span>
  );
}

/**
 * Renders a content block that may contain TEXT, LATEX, or IMAGE types.
 * Used to display question content, options, and solutions.
 */
interface ContentBlock {
  type: "TEXT" | "LATEX" | "IMAGE";
  content?: string;
  asset_id?: string;
}

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

export function ContentBlockRenderer({
  blocks,
  className = "",
}: ContentBlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={`content-blocks space-y-2 ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "TEXT":
            return (
              <p key={index} className="leading-relaxed">
                {block.content || ""}
              </p>
            );
          case "LATEX":
            return (
              <div key={index} className="my-2">
                <LatexRenderer
                  content={block.content || ""}
                  displayMode
                  className="inherit"
                />
              </div>
            );
          case "IMAGE":
            return block.content ? (
              <img
                key={index}
                src={block.content}
                alt={`Content image ${index + 1}`}
                className="rounded-lg max-w-full h-auto border border-zinc-200 dark:border-white/10"
              />
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
}
