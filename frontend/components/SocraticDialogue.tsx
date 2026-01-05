"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, CheckCircle, ArrowRight, Mic, Keyboard } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";

interface SocraticQuestion {
  question: string;
  category: "understanding" | "process" | "reasoning" | "connection";
  encouragement: string;
}

interface DialogueMessage {
  role: "ai" | "student";
  content: string;
  isVoice?: boolean;
}

interface SocraticDialogueProps {
  question: SocraticQuestion;
  onRespond: (response: string, isVoice?: boolean) => Promise<void>;
  onReadyToSubmit: () => void;
  isLoading?: boolean;
  feedback?: string;
  followUpQuestion?: string;
  readyToSubmit?: boolean;
}

type InputMode = "text" | "voice";

export function SocraticDialogue({
  question,
  onRespond,
  onReadyToSubmit,
  isLoading = false,
  feedback,
  followUpQuestion,
  readyToSubmit = false,
}: SocraticDialogueProps) {
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [hasResponded, setHasResponded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("voice"); // Default to voice

  const handleSubmitResponse = async (text?: string, isVoice = false) => {
    const studentResponse = (text || response).trim();
    if (!studentResponse || isLoading) return;

    setMessages((prev) => [...prev, { role: "student", content: studentResponse, isVoice }]);
    setResponse("");
    setHasResponded(true);

    await onRespond(studentResponse, isVoice);
  };

  const handleVoiceTranscript = async (transcript: string) => {
    await handleSubmitResponse(transcript, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  // Category icons/colors
  const categoryStyles = {
    understanding: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    process: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    reasoning: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
    connection: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  };

  const style = categoryStyles[question.category];

  return (
    <div className="space-y-4">
      {/* Encouragement Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 bg-green-50 border border-green-200 rounded-lg"
      >
        <p className="text-sm text-green-700 text-center">{question.encouragement}</p>
      </motion.div>

      {/* AI Question */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-4 rounded-xl ${style.bg} border ${style.border}`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} border ${style.border}`}>
            <MessageCircle className={`w-4 h-4 ${style.text}`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${style.text}`}>{question.question}</p>
          </div>
        </div>
      </motion.div>

      {/* Conversation History */}
      <AnimatePresence>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === "student" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-lg ${
              msg.role === "student"
                ? "bg-indigo-50 border border-indigo-200 ml-8"
                : "bg-gray-50 border border-gray-200 mr-8"
            }`}
          >
            {msg.isVoice && (
              <div className="flex items-center gap-1 text-xs text-indigo-400 mb-1">
                <Mic className="w-3 h-3" />
                <span>Voice response</span>
              </div>
            )}
            <p className={`text-sm ${msg.role === "student" ? "text-indigo-700" : "text-gray-700"}`}>
              {msg.content}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* AI Feedback after response */}
      {feedback && hasResponded && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
        >
          <p className="text-sm text-emerald-700">{feedback}</p>
        </motion.div>
      )}

      {/* Follow-up Question */}
      {followUpQuestion && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-4 rounded-xl ${style.bg} border ${style.border}`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} border ${style.border}`}>
              <MessageCircle className={`w-4 h-4 ${style.text}`} />
            </div>
            <p className={`font-medium ${style.text}`}>{followUpQuestion}</p>
          </div>
        </motion.div>
      )}

      {/* Ready to Submit */}
      {readyToSubmit && !followUpQuestion ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Great thinking! Ready to submit your answer.</span>
          </div>
          <button
            onClick={onReadyToSubmit}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Continue to Answer
          </button>
        </motion.div>
      ) : (
        /* Response Input */
        !hasResponded || followUpQuestion ? (
          <div className="space-y-3">
            {/* Input Mode Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setInputMode("voice")}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    inputMode === "voice"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  } disabled:opacity-50`}
                >
                  <Mic className="w-4 h-4" />
                  Speak
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    inputMode === "text"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  } disabled:opacity-50`}
                >
                  <Keyboard className="w-4 h-4" />
                  Type
                </button>
              </div>
            </div>

            {/* Voice or Text Input */}
            <AnimatePresence mode="wait">
              {inputMode === "voice" ? (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <VoiceRecorder
                    onTranscript={handleVoiceTranscript}
                    disabled={isLoading}
                    placeholder="Tap the microphone to explain your thinking..."
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell me what you're thinking..."
                    disabled={isLoading}
                    rows={2}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors resize-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSubmitResponse()}
                    disabled={isLoading || !response.trim()}
                    className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Share My Thinking
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null
      )}
    </div>
  );
}
