"use client";

import { useState } from "react";
import { Send, SkipForward } from "lucide-react";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AnswerInput({ onSubmit, onSkip, disabled, placeholder = "Type your answer..." }: AnswerInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-200 rounded-xl focus:border-[var(--primary)] focus:outline-none transition-colors"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex-1 btn btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          Submit Answer
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="px-6 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            Skip
          </button>
        )}
      </div>
    </form>
  );
}

export function clearAnswerInput() {
  // Utility to clear from parent - implement via ref if needed
}
