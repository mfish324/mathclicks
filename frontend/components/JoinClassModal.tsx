"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Check, AlertCircle, Loader2, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "mathclicks-teacher-sharing";

export function JoinClassModal({ isOpen, onClose }: JoinClassModalProps) {
  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [classInfo, setClassInfo] = useState<{ gradeLevel: number | null } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setStudentName("");
      setClassCode("");
      setError(null);
      setSuccess(false);
      setClassInfo(null);
    }
  }, [isOpen]);

  const handleJoin = async () => {
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

    setIsValidating(true);
    setError(null);

    try {
      // First, check if the class exists
      const checkResponse = await fetch(`/api/class/${cleanCode}/exists`);
      const checkResult = await checkResponse.json();

      if (!checkResult.exists) {
        setError("Class not found. Please check the code and try again.");
        setIsValidating(false);
        return;
      }

      // Class exists - save connection info to localStorage
      const studentId = crypto.randomUUID();
      const sharingState = {
        isSharing: true,
        studentName: studentName.trim(),
        classCode: cleanCode,
        studentId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sharingState));

      // Join the class
      await fetch("/api/class/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: cleanCode,
          session: {
            id: studentId,
            studentName: studentName.trim(),
            classCode: cleanCode,
            topic: "Not started",
            gradeLevel: checkResult.gradeLevel || 6,
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

      setClassInfo({ gradeLevel: checkResult.gradeLevel });
      setSuccess(true);

      // Redirect to practice page after showing success
      setTimeout(() => {
        router.push("/practice");
      }, 1500);
    } catch (err) {
      console.error("Error joining class:", err);
      setError("Could not connect. Please try again.");
    } finally {
      setIsValidating(false);
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
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Join Your Class</h2>
                  <p className="text-sm text-gray-500">Enter the code from your teacher</p>
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
                  <h3 className="text-lg font-semibold text-gray-800">Welcome, {studentName}!</h3>
                  <p className="text-gray-500 mt-1">
                    {classInfo?.gradeLevel
                      ? `You joined a Grade ${classInfo.gradeLevel} class`
                      : "You're connected to your class"}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Taking you to practice...</p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      autoComplete="off"
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-lg tracking-wider text-center uppercase"
                      autoComplete="off"
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
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

                  {/* Join button */}
                  <button
                    onClick={handleJoin}
                    disabled={isValidating}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking class...
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5" />
                        Join Class
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <p className="text-xs text-gray-400 text-center">
                    Your teacher will be able to see your progress and help when you need it
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
