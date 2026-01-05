"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Check, Users, AlertCircle, Loader2 } from "lucide-react";

interface ShareWithTeacherProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (studentName: string, classCode: string) => void;
  currentStudentName?: string;
  currentClassCode?: string;
}

export function ShareWithTeacher({
  isOpen,
  onClose,
  onConnect,
  currentStudentName = "",
  currentClassCode = "",
}: ShareWithTeacherProps) {
  const [studentName, setStudentName] = useState(currentStudentName);
  const [classCode, setClassCode] = useState(currentClassCode);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudentName(currentStudentName);
      setClassCode(currentClassCode);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, currentStudentName, currentClassCode]);

  const handleConnect = async () => {
    if (!studentName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!classCode.trim()) {
      setError("Please enter the class code");
      return;
    }

    // Validate class code format (6 alphanumeric characters)
    const cleanCode = classCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanCode.length !== 6) {
      setError("Class code should be 6 characters");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Try to join the class
      const response = await fetch("/api/class/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: cleanCode,
          session: {
            id: crypto.randomUUID(),
            studentName: studentName.trim(),
            classCode: cleanCode,
            topic: "Math Practice",
            gradeLevel: 5,
            problemsCompleted: 0,
            problemsCorrect: 0,
            currentProblemIndex: 0,
            totalProblems: 0,
            isActive: true,
            lastActivityAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            level: 1,
            totalXp: 0,
            currentStreak: 0,
            recentWork: [],
            isStuck: false,
            needsHelp: false,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onConnect(studentName.trim(), cleanCode);
          onClose();
        }, 1000);
      } else {
        setError(result.error || "Failed to connect to class");
      }
    } catch (err) {
      console.error("Error connecting to class:", err);
      setError("Could not connect. Please try again.");
    } finally {
      setIsConnecting(false);
    }
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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Share with Teacher</h2>
                  <p className="text-sm text-gray-500">Let your teacher see your progress</p>
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
            <div className="p-4 space-y-4">
              {success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Connected!</h3>
                  <p className="text-gray-500 mt-1">Your teacher can now see your progress</p>
                </motion.div>
              ) : (
                <>
                  {/* Name input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      autoComplete="off"
                    />
                  </div>

                  {/* Class code input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Code
                    </label>
                    <input
                      type="text"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-lg tracking-wider text-center uppercase"
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      Ask your teacher for the class code
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Connect button */}
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5" />
                        Connect to Class
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <p className="text-xs text-gray-400 text-center">
                    Your teacher will see your name, progress, and work. They can help if you get stuck!
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
