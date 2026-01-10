/**
 * Review Problems Generator
 * Provides problems for students to practice while their image is being analyzed
 */

import { listSessions, getSession } from './session-storage';

export interface ReviewProblem {
  id: string;
  question: string;
  answer: string;
  answerType: 'integer' | 'decimal';
}

/**
 * Generate random basic math problems (mixed operations)
 */
function generateBasicMathProblems(count: number): ReviewProblem[] {
  const problems: ReviewProblem[] = [];
  const operations = ['+', '-', '×', '÷'] as const;

  for (let i = 0; i < count; i++) {
    const op = operations[Math.floor(Math.random() * operations.length)];
    let a: number, b: number, answer: number, question: string;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        answer = a + b;
        question = `${a} + ${b} = ?`;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 30;
        b = Math.floor(Math.random() * 30) + 1;
        answer = a - b;
        question = `${a} - ${b} = ?`;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        question = `${a} × ${b} = ?`;
        break;
      case '÷':
        b = Math.floor(Math.random() * 12) + 1;
        answer = Math.floor(Math.random() * 12) + 1;
        a = b * answer; // Ensure clean division
        question = `${a} ÷ ${b} = ?`;
        break;
    }

    problems.push({
      id: `review-${Date.now()}-${i}`,
      question,
      answer: answer.toString(),
      answerType: 'integer',
    });
  }

  return problems;
}

/**
 * Get review problems from previous sessions
 */
function getProblemsFromPreviousSessions(count: number): ReviewProblem[] {
  const sessions = listSessions();
  const reviewProblems: ReviewProblem[] = [];

  // Collect problems from previous sessions
  for (const sessionSummary of sessions) {
    const session = getSession(sessionSummary.id);
    if (!session?.problems) continue;

    for (const problem of session.problems) {
      // Only include problems with simple answer types for quick review
      if (['integer', 'decimal', 'fraction'].includes(problem.answer_type)) {
        reviewProblems.push({
          id: `prev-${problem.id}`,
          question: problem.problem_text,
          answer: problem.answer,
          answerType: problem.answer_type === 'fraction' ? 'decimal' : problem.answer_type as 'integer' | 'decimal',
        });
      }
    }

    // Stop if we have enough problems
    if (reviewProblems.length >= count * 2) break;
  }

  // Shuffle and return requested count
  const shuffled = reviewProblems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Check if there are any previous sessions with problems
 */
export function hasPreviousSessions(): boolean {
  const sessions = listSessions();
  return sessions.length > 0;
}

/**
 * Get review problems
 * - If previous sessions exist, returns problems from them
 * - If no sessions, returns basic math facts
 */
export function getReviewProblems(count: number = 10): ReviewProblem[] {
  const sessions = listSessions();

  if (sessions.length > 0) {
    const previousProblems = getProblemsFromPreviousSessions(count);
    if (previousProblems.length >= Math.min(3, count)) {
      return previousProblems;
    }
  }

  // Fall back to basic math problems
  return generateBasicMathProblems(count);
}

/**
 * Simple answer validation for review problems
 * More lenient than the full validation - accepts numeric equivalents
 */
export function checkReviewAnswer(problem: ReviewProblem, studentAnswer: string): boolean {
  const correct = problem.answer.trim().toLowerCase();
  const student = studentAnswer.trim().toLowerCase();

  // Direct match
  if (correct === student) return true;

  // Numeric comparison
  const correctNum = parseFloat(correct);
  const studentNum = parseFloat(student);

  if (!isNaN(correctNum) && !isNaN(studentNum)) {
    return Math.abs(correctNum - studentNum) < 0.01;
  }

  return false;
}
