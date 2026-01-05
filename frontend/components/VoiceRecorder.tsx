"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square, Loader2, RotateCcw, Check } from "lucide-react";

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  onRecordingComplete?: (audioBlob: Blob, transcript: string) => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds, default 60
  placeholder?: string;
}

type RecordingState = "idle" | "recording" | "processing" | "done";

export function VoiceRecorder({
  onTranscript,
  onRecordingComplete,
  disabled = false,
  maxDuration = 60,
  placeholder = "Tap the microphone to explain your thinking...",
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(maxDuration);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Voice recording is not supported in this browser. Please type your response instead.");
      return;
    }

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setTimeLeft(maxDuration);
    audioChunksRef.current = [];

    try {
      // Start speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
        setInterimTranscript(interim);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone access and try again.");
        } else if (event.error !== "aborted") {
          setError("Voice recognition error. Please try again or type your response.");
        }
        setState("idle");
      };

      recognition.onend = () => {
        // Recognition ended - this happens automatically or when stopped
        if (state === "recording") {
          setState("processing");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Also try to record audio for playback (optional)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      } catch (audioError) {
        // Audio recording is optional, speech recognition can work without it
        console.warn("Could not start audio recording:", audioError);
      }

      setState("recording");

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not start voice recording. Please try again or type your response.");
      setState("idle");
    }
  }, [isSupported, maxDuration]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setState("processing");

    // Give a moment for final results to come in
    setTimeout(() => {
      setState("done");
    }, 500);
  }, []);

  const handleConfirm = useCallback(() => {
    const finalTranscript = transcript.trim();
    if (finalTranscript) {
      onTranscript(finalTranscript);

      // If we have audio, also send that
      if (onRecordingComplete && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob, finalTranscript);
      }
    }

    // Reset state
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
  }, [transcript, onTranscript, onRecordingComplete]);

  const handleRetry = useCallback(() => {
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render based on state
  if (!isSupported) {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
        Voice recording not supported in this browser. Please type your response.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-sm text-gray-500 mb-3">{placeholder}</p>
            <button
              onClick={startRecording}
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 flex items-center justify-center mx-auto transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-8 h-8" />
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </motion.div>
        )}

        {state === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center"
          >
            {/* Recording indicator */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 rounded-full bg-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Recording...</span>
              <span className="text-sm text-gray-500">{formatTime(timeLeft)}</span>
            </div>

            {/* Live transcript preview */}
            <div className="min-h-[60px] p-3 bg-gray-50 rounded-lg mb-3 text-left">
              <p className="text-sm text-gray-700">
                {transcript}
                <span className="text-gray-400">{interimTranscript}</span>
                {!transcript && !interimTranscript && (
                  <span className="text-gray-400 italic">Listening...</span>
                )}
              </p>
            </div>

            {/* Stop button */}
            <button
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center mx-auto transition-all"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
            <p className="text-xs text-gray-500 mt-2">Tap to stop</p>
          </motion.div>
        )}

        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Processing...</p>
          </motion.div>
        )}

        {state === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Transcript preview */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800">
                {transcript || <span className="italic text-gray-400">No speech detected. Try again?</span>}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Re-record
              </button>
              <button
                onClick={handleConfirm}
                disabled={!transcript.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Use This
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
