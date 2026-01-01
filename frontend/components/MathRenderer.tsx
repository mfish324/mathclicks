"use client";

import katex from "katex";
import { useMemo } from "react";

interface MathRendererProps {
  text: string;
  latex?: string;
  className?: string;
}

export function MathRenderer({ text, latex, className = "" }: MathRendererProps) {
  const renderedLatex = useMemo(() => {
    if (!latex) return null;
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return null;
    }
  }, [latex]);

  const combinedClass = `math-display ${className}`.trim();

  return (
    <div className={combinedClass}>
      {renderedLatex ? (
        <div dangerouslySetInnerHTML={{ __html: renderedLatex }} />
      ) : (
        <p className="text-2xl font-medium">{text}</p>
      )}
    </div>
  );
}
