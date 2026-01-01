// Types mirroring the mathclicks backend

export type AnswerType =
  | "integer"
  | "decimal"
  | "fraction"
  | "expression"
  | "coordinate"
  | "multiple_choice"
  | "true_false";

export type ErrorType =
  | "sign_error"
  | "arithmetic_error"
  | "incomplete_solution"
  | "wrong_operation"
  | "order_of_operations"
  | "fraction_error"
  | "decimal_error"
  | "unit_error"
  | "unknown";

export interface Problem {
  id: string;
  tier: number;
  problem_text: string;
  problem_latex?: string;
  answer: string;
  answer_type: AnswerType;
  acceptable_answers?: string[];
  solution_steps: string[];
  hints: string[];
  common_mistakes?: string[];
}

export interface ProblemSet {
  topic: string;
  problems: Problem[];
  generated_at: string;
}

export interface ExtractedContent {
  equations?: string[];
  examples_shown?: (string | { problem?: string; steps?: string[]; solution?: string })[];
  concepts?: string[];
  word_problems?: string[];
  definitions?: string[];
  graphs_described?: string[];
}

export interface ImageExtractionResult {
  topic: string;
  subtopics: string[];
  grade_level: number;
  standards: string[];
  extracted_content: ExtractedContent;
  difficulty_baseline: number;
}

export interface ValidationResult {
  correct: boolean;
  student_answer: string;
  correct_answer: string;
  feedback: string;
  error_type?: ErrorType;
  hint_to_show?: number;
}

// API request/response types
export interface ProcessImageResponse {
  success: boolean;
  data?: {
    extraction: ImageExtractionResult;
    problems: ProblemSet;
  };
  error?: string;
}

export interface CheckAnswerRequest {
  problem: Problem;
  studentAnswer: string;
  attemptNumber: number;
}

export interface CheckAnswerResponse {
  correct: boolean;
  feedback: string;
  error_type?: ErrorType;
  hint_to_show?: number;
  hint_text?: string;
}

// Session state
export interface PracticeSession {
  extraction: ImageExtractionResult;
  problems: Problem[];
  currentIndex: number;
  attempts: Record<string, number>;
  results: Record<string, boolean>;
}
