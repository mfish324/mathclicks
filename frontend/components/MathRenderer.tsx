"use client";

import katex from "katex";
import { useMemo } from "react";

interface MathRendererProps {
  text: string;
  latex?: string;
  className?: string;
}

// Check if the text is a word problem (has significant context beyond just math)
function isWordProblem(text: string, latex?: string): boolean {
  if (!latex) return false;

  // Word problems typically have:
  // - Multiple sentences or question words
  // - Names, objects, or real-world scenarios
  // - Text is significantly different from latex (not just formatting)

  const hasQuestionWord = /\b(how|what|find|solve|calculate|determine|if|when|where|who)\b/i.test(text);
  const hasMultipleSentences = (text.match(/[.!?]/g) || []).length >= 1;
  const hasNames = /\b[A-Z][a-z]+\b/.test(text) && !/^[A-Z]/.test(text); // Names in middle of text
  const hasRealWorldWords = /\b(dollars?|cents?|miles?|hours?|minutes?|feet|inches|pounds?|percent|sold|bought|paid|earned|cost|price|total|each|per|from|to|left|remaining)\b/i.test(text);

  // Text is substantially longer than what latex would represent
  const textLength = text.length;
  const isSubstantialText = textLength > 50;

  return (hasQuestionWord || hasMultipleSentences || hasNames || hasRealWorldWords) && isSubstantialText;
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
  const showBoth = isWordProblem(text, latex) && renderedLatex;

  return (
    <div className={combinedClass}>
      {showBoth ? (
        // Word problem: show context text AND the math expression
        <div className="space-y-4">
          <p className="text-lg text-gray-700 leading-relaxed text-left">{text}</p>
          <div
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            dangerouslySetInnerHTML={{ __html: renderedLatex }}
          />
        </div>
      ) : renderedLatex ? (
        // Pure math: just show the LaTeX
        <div dangerouslySetInnerHTML={{ __html: renderedLatex }} />
      ) : (
        // No LaTeX: show the text
        <p className="text-2xl font-medium">{text}</p>
      )}
    </div>
  );
}
