"use client";

import { useState } from "react";
import { GraduationCap, BookOpen, CheckCircle2, RefreshCw, Calculator, FileText, Lightbulb, Pencil, Check, Loader2 } from "lucide-react";
import type { ImageExtractionResult } from "@/lib/types";
import { MathRenderer } from "./MathRenderer";

interface ExtractionVerificationProps {
  extraction: ImageExtractionResult;
  onConfirm: (extraction: ImageExtractionResult) => void;
  onRetry: () => void;
  isConfirming?: boolean;
}

export function ExtractionVerification({ extraction, onConfirm, onRetry, isConfirming = false }: ExtractionVerificationProps) {
  const { topic, subtopics, grade_level, standards, extracted_content } = extraction;
  const { examples_shown, concepts, definitions } = extracted_content;

  // Editable copies of the content most likely to be misread from the photo
  const [equations, setEquations] = useState<string[]>(extracted_content.equations ?? []);
  const [wordProblems, setWordProblems] = useState<string[]>(extracted_content.word_problems ?? []);
  const [editingEquation, setEditingEquation] = useState<number | null>(null);
  const [editingWordProblem, setEditingWordProblem] = useState<number | null>(null);
  const [hasEdits, setHasEdits] = useState(false);

  // Check if we have any content to show
  const hasEquations = equations.length > 0;
  const hasExamples = examples_shown && examples_shown.length > 0;
  const hasConcepts = concepts && concepts.length > 0;
  const hasWordProblems = wordProblems.length > 0;
  const hasDefinitions = definitions && definitions.length > 0;
  const hasContent = hasEquations || hasExamples || hasConcepts || hasWordProblems || hasDefinitions;

  const updateEquation = (index: number, value: string) => {
    setEquations((prev) => prev.map((eq, i) => (i === index ? value : eq)));
    setHasEdits(true);
  };

  const updateWordProblem = (index: number, value: string) => {
    setWordProblems((prev) => prev.map((wp, i) => (i === index ? value : wp)));
    setHasEdits(true);
  };

  const handleConfirm = () => {
    if (isConfirming) return;
    onConfirm({
      ...extraction,
      extracted_content: {
        ...extracted_content,
        ...(extracted_content.equations ? { equations } : {}),
        ...(extracted_content.word_problems ? { word_problems: wordProblems } : {}),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{topic}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Grade {grade_level}
                </span>
                {standards.slice(0, 2).map((standard, i) => (
                  <span key={i} className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Prompt */}
          <div className="text-center text-gray-600 pb-4 border-b">
            <p className="text-lg">Here&apos;s what we found in your image. Does this look correct?</p>
            {(hasEquations || hasWordProblems) && (
              <p className="text-sm text-gray-400 mt-1">
                Tap the pencil to fix anything we misread.
              </p>
            )}
          </div>

          {/* Subtopics */}
          {subtopics.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Skills Covered
              </h3>
              <div className="flex flex-wrap gap-2">
                {subtopics.map((subtopic, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                    {subtopic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equations */}
          {hasEquations && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Equations Found
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                {equations.map((eq, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {editingEquation === i ? (
                      <>
                        <input
                          type="text"
                          value={eq}
                          autoFocus
                          onChange={(e) => updateEquation(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") setEditingEquation(null);
                          }}
                          onBlur={() => setEditingEquation(null)}
                          className="flex-1 text-lg font-mono px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                        <button
                          onClick={() => setEditingEquation(null)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Done"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-lg">
                          <MathRenderer text={eq} />
                        </div>
                        <button
                          onClick={() => setEditingEquation(i)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit equation"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {hasExamples && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Examples Shown
              </h3>
              <div className="space-y-3">
                {examples_shown!.map((example, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl">
                    {typeof example === "string" ? (
                      <MathRenderer text={example} />
                    ) : (
                      <div className="space-y-2">
                        {example.problem && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">Problem:</span>
                            <div><MathRenderer text={example.problem} /></div>
                          </div>
                        )}
                        {example.steps && example.steps.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">Steps:</span>
                            <ol className="list-decimal list-inside text-sm text-gray-600">
                              {example.steps.map((step, j) => (
                                <li key={j}><MathRenderer text={step} /></li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {example.solution && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">Solution:</span>
                            <div className="font-medium"><MathRenderer text={example.solution} /></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concepts */}
          {hasConcepts && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-500" />
                Key Concepts
              </h3>
              <ul className="bg-gray-50 p-4 rounded-xl space-y-2">
                {concepts!.map((concept, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Word Problems */}
          {hasWordProblems && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Word Problems
              </h3>
              <div className="space-y-2">
                {wordProblems.map((wp, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl text-gray-700">
                    {editingWordProblem === i ? (
                      <div className="flex items-start gap-2">
                        <textarea
                          value={wp}
                          autoFocus
                          rows={3}
                          onChange={(e) => updateWordProblem(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditingWordProblem(null);
                          }}
                          onBlur={() => setEditingWordProblem(null)}
                          className="flex-1 px-3 py-2 border-2 border-orange-400 rounded-lg focus:outline-none focus:border-orange-500 bg-white resize-y"
                        />
                        <button
                          onClick={() => setEditingWordProblem(null)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Done"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="flex-1">{wp}</span>
                        <button
                          onClick={() => setEditingWordProblem(i)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Edit word problem"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Definitions */}
          {hasDefinitions && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-500" />
                Definitions
              </h3>
              <div className="space-y-2">
                {definitions!.map((def, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl text-gray-700">
                    {def}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No content warning */}
          {!hasContent && (
            <div className="text-center py-8 text-gray-500">
              <p>We extracted the topic but didn&apos;t find specific equations or examples.</p>
              <p className="text-sm mt-2">We&apos;ll generate practice problems based on the topic.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 rounded-b-2xl border-t flex gap-4">
          <button
            onClick={onRetry}
            disabled={isConfirming}
            className="flex-1 px-6 py-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
            Try Different Image
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating Problems...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {hasEdits ? "Save Fixes - Start Practice!" : "Looks Good - Start Practice!"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
