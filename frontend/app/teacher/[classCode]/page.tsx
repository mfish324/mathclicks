"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  AlertCircle,
  Trophy,
  Clock,
  ArrowLeft,
  RefreshCw,
  User,
  CheckCircle,
  XCircle,
  Flame,
  Star,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";

interface StudentSession {
  id: string;
  studentName: string;
  classCode: string;
  topic: string;
  gradeLevel: number;
  problemsCompleted: number;
  problemsCorrect: number;
  currentProblemIndex: number;
  totalProblems: number;
  isActive: boolean;
  lastActivityAt: string;
  startedAt: string;
  level: number;
  totalXp: number;
  currentStreak: number;
  recentWork: RecentWork[];
  isStuck: boolean;
  needsHelp: boolean;
}

interface RecentWork {
  problemId: string;
  problemText: string;
  attempts: number;
  correct: boolean;
  canvasImageUrl?: string;
  timestamp: string;
}

interface ClassSummary {
  classCode: string;
  activeStudents: number;
  totalStudents: number;
  studentsNeedingHelp: number;
  recentAchievements: RecentAchievement[];
}

interface RecentAchievement {
  studentName: string;
  achievementName: string;
  achievementIcon: string;
  timestamp: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function TeacherDashboard() {
  const params = useParams();
  const router = useRouter();
  const classCode = params.classCode as string;

  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, studentsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/class/${classCode}/summary`),
        fetch(`${BACKEND_URL}/api/class/${classCode}/students`),
      ]);

      const summaryData = await summaryRes.json();
      const studentsData = await studentsRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
      if (studentsData.success) {
        setStudents(studentsData.data);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [classCode]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const copyClassCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading class data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Teacher Dashboard</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Class Code:</span>
                  <button
                    onClick={copyClassCode}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-mono text-sm hover:bg-indigo-200 transition-colors"
                  >
                    {classCode}
                    {copied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {lastUpdated && (
                <span>Updated {formatTime(lastUpdated.toISOString())}</span>
              )}
              <button
                onClick={fetchData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {summary.activeStudents}
                  </div>
                  <div className="text-sm text-gray-500">Active Now</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {summary.totalStudents}
                  </div>
                  <div className="text-sm text-gray-500">Total Students</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  summary.studentsNeedingHelp > 0 ? "bg-red-100" : "bg-gray-100"
                }`}>
                  <AlertCircle className={`w-5 h-5 ${
                    summary.studentsNeedingHelp > 0 ? "text-red-600" : "text-gray-400"
                  }`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {summary.studentsNeedingHelp}
                  </div>
                  <div className="text-sm text-gray-500">Need Help</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {summary.recentAchievements.length}
                  </div>
                  <div className="text-sm text-gray-500">Achievements</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Students</h2>
              </div>

              {students.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No students have joined yet.</p>
                  <p className="text-sm mt-2">
                    Share the class code <strong>{classCode}</strong> with your students.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <motion.button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedStudent?.id === student.id ? "bg-indigo-50" : ""
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Status indicator */}
                          <div className={`w-3 h-3 rounded-full ${
                            student.needsHelp || student.isStuck
                              ? "bg-red-500 animate-pulse"
                              : student.isActive
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`} />

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">
                                {student.studentName}
                              </span>
                              {student.currentStreak > 0 && (
                                <span className="flex items-center gap-1 text-xs text-orange-600">
                                  <Flame className="w-3 h-3" />
                                  {student.currentStreak}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.topic} • Grade {student.gradeLevel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Progress */}
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-gray-700">
                                {student.problemsCorrect}/{student.problemsCompleted}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatTime(student.lastActivityAt)}
                            </div>
                          </div>

                          {/* Level badge */}
                          <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-full">
                            <Star className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                            <span className="text-xs font-medium text-indigo-700">
                              Lv.{student.level}
                            </span>
                          </div>

                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      {/* Warning badges */}
                      {(student.needsHelp || student.isStuck) && (
                        <div className="mt-2 flex gap-2">
                          {student.needsHelp && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                              Requested help
                            </span>
                          )}
                          {student.isStuck && (
                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                              Stuck on problem
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Selected Student Details */}
            {selectedStudent && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-indigo-50">
                  <h3 className="font-semibold text-indigo-800">
                    {selectedStudent.studentName}
                  </h3>
                  <p className="text-sm text-indigo-600">
                    {selectedStudent.topic}
                  </p>
                </div>

                <div className="p-4 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-800">
                        {selectedStudent.totalXp}
                      </div>
                      <div className="text-xs text-gray-500">Total XP</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-800">
                        {Math.round(
                          (selectedStudent.problemsCorrect /
                            Math.max(selectedStudent.problemsCompleted, 1)) *
                            100
                        )}%
                      </div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                  </div>

                  {/* Recent Work */}
                  {selectedStudent.recentWork.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recent Work
                      </h4>
                      <div className="space-y-2">
                        {selectedStudent.recentWork.slice(0, 3).map((work, i) => (
                          <div
                            key={i}
                            className="p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700 truncate flex-1">
                                {work.problemText}
                              </span>
                              {work.correct ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {work.attempts} attempt{work.attempts !== 1 ? "s" : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            {summary && summary.recentAchievements.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Recent Achievements
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {summary.recentAchievements.slice(0, 5).map((achievement, i) => (
                    <div key={i} className="p-3 flex items-center gap-3">
                      <span className="text-xl">{achievement.achievementIcon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          {achievement.studentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {achievement.achievementName}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(achievement.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
