"use client";

import { useState } from "react";

type GradeLevel = 4 | 5 | 6 | 7 | 8;
type WarmUpFocus = "addition" | "subtraction" | "multiplication" | "division" | "mixed";
type WarmUpDuration = 1 | 2 | 3 | 5;

interface WarmUpSettings {
  enabled: boolean;
  duration: WarmUpDuration;
  focus: WarmUpFocus;
  required: boolean;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: (gradeLevel: GradeLevel, warmUp: WarmUpSettings) => Promise<void>;
}

export function CreateClassModal({
  isOpen,
  onClose,
  onCreateClass,
}: CreateClassModalProps) {
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(6);
  const [warmUpEnabled, setWarmUpEnabled] = useState(false);
  const [warmUpDuration, setWarmUpDuration] = useState<WarmUpDuration>(2);
  const [warmUpFocus, setWarmUpFocus] = useState<WarmUpFocus>("mixed");
  const [warmUpRequired, setWarmUpRequired] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await onCreateClass(gradeLevel, {
        enabled: warmUpEnabled,
        duration: warmUpDuration,
        focus: warmUpFocus,
        required: warmUpRequired,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create class:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Class</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grade Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <p className="text-xs text-gray-500 mb-3">
                This limits problem difficulty to what&apos;s appropriate for this grade.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {([4, 5, 6, 7, 8] as GradeLevel[]).map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGradeLevel(grade)}
                    className={`py-3 px-4 rounded-lg font-medium text-lg transition-all ${
                      gradeLevel === grade
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {grade}th
                  </button>
                ))}
              </div>
            </div>

            {/* Warm-up Settings */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Daily Warm-up
                  </label>
                  <p className="text-xs text-gray-500">
                    Math facts practice before each session
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWarmUpEnabled(!warmUpEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    warmUpEnabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      warmUpEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {warmUpEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <div className="flex gap-2">
                      {([1, 2, 3, 5] as WarmUpDuration[]).map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setWarmUpDuration(min)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            warmUpDuration === min
                              ? "bg-blue-100 text-blue-700 ring-2 ring-blue-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {min} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Focus Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Focus Area
                    </label>
                    <select
                      value={warmUpFocus}
                      onChange={(e) => setWarmUpFocus(e.target.value as WarmUpFocus)}
                      className="w-full p-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="mixed">Mixed Operations</option>
                      <option value="addition">Addition</option>
                      <option value="subtraction">Subtraction</option>
                      <option value="multiplication">Multiplication</option>
                      <option value="division">Division</option>
                    </select>
                  </div>

                  {/* Required Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Required
                      </label>
                      <p className="text-xs text-gray-500">
                        Students must complete warm-up before lesson
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWarmUpRequired(!warmUpRequired)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        warmUpRequired ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          warmUpRequired ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isCreating ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
