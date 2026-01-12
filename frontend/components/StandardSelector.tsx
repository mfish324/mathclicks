"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronDown, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import {
  STANDARDS_BY_GRADE,
  DOMAIN_NAMES,
  getStandardsForGrade,
  getAvailableGrades,
  getGradeName,
  type MathStandard,
} from "@/lib/math-standards";

interface StandardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (standard: MathStandard) => void;
  isLoading?: boolean;
}

export function StandardSelector({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
}: StandardSelectorProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const grades = getAvailableGrades();

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const handleGradeSelect = (grade: number) => {
    setSelectedGrade(grade);
    // Expand all domains by default when selecting a grade
    const standards = getStandardsForGrade(grade);
    const domains = new Set(standards.map((s) => s.domain));
    setExpandedDomains(domains);
  };

  const handleBack = () => {
    setSelectedGrade(null);
    setExpandedDomains(new Set());
  };

  // Group standards by domain
  const getStandardsByDomain = (grade: number) => {
    const standards = getStandardsForGrade(grade);
    const grouped = new Map<string, MathStandard[]>();

    for (const std of standards) {
      if (!grouped.has(std.domain)) {
        grouped.set(std.domain, []);
      }
      grouped.get(std.domain)!.push(std);
    }

    return Array.from(grouped.entries());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] max-w-2xl mx-auto bg-white rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedGrade !== null && (
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400 rotate-90" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {selectedGrade !== null
                      ? `${getGradeName(selectedGrade)} Standards`
                      : "Select a Math Standard"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedGrade !== null
                      ? "Choose a topic to practice"
                      : "Pick a grade level to get started"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-gray-600">Generating practice problems...</p>
                </div>
              ) : selectedGrade === null ? (
                // Grade selection
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {grades.map((grade) => (
                    <button
                      key={grade}
                      onClick={() => handleGradeSelect(grade)}
                      className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-colors text-left"
                    >
                      <div className="text-2xl font-bold text-gray-800">
                        {grade === 9 ? "Alg" : grade}
                      </div>
                      <div className="text-sm text-gray-500">{getGradeName(grade)}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {getStandardsForGrade(grade).length} standards
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                // Standards list grouped by domain
                <div className="space-y-3">
                  {getStandardsByDomain(selectedGrade).map(([domain, standards]) => (
                    <div key={domain} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleDomain(domain)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedDomains.has(domain) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-700">
                            {DOMAIN_NAMES[domain] || domain}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {standards.length} topics
                        </span>
                      </button>

                      <AnimatePresence>
                        {expandedDomains.has(domain) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y divide-gray-100">
                              {standards.map((std) => (
                                <button
                                  key={std.code}
                                  onClick={() => onSelect(std)}
                                  className="w-full p-3 hover:bg-blue-50 transition-colors text-left flex items-start gap-3"
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                        {std.code}
                                      </span>
                                      <span className="font-medium text-gray-800 truncate">
                                        {std.title}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                      {std.description}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-400 text-center">
                Standards aligned with Common Core State Standards for Mathematics
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
