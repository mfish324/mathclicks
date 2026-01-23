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

export type ProblemCategory = "lesson" | "math_fact";

export type ProblemSource =
  | "ai_generated"
  | "public_domain"
  | "engage_ny"
  | "illustrative_math"
  | "teacher_created";

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
  category?: ProblemCategory; // lesson problems vs interleaved math facts
  source?: ProblemSource; // where this problem came from
  diagram_type?: DiagramType; // type of visual diagram if needed
  diagram_data?: DiagramData; // structured data for rendering diagram
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
  canvasImage?: string;  // Base64 PNG of student's work (optional)
}

export interface CheckAnswerResponse {
  correct: boolean;
  feedback: string;
  error_type?: ErrorType;
  hint_to_show?: number;
  hint_text?: string;
}

// Problem attempt tracking (includes canvas work)
export interface ProblemAttempt {
  problemId: string;
  attemptNumber: number;
  answer?: string;
  canvasImage?: string;  // Base64 PNG of student's work
  canvasUsed: boolean;
  timestamp: string;
  correct?: boolean;
  feedback?: string;
  // Socratic dialogue (for Phase 2)
  aiQuestion?: string;
  studentResponse?: string;
  voiceRecording?: string;  // Base64 audio (for Phase 3)
  voiceTranscript?: string;
}

// Session state
export interface PracticeSession {
  extraction: ImageExtractionResult;
  problems: Problem[];
  currentIndex: number;
  attempts: Record<string, number>;
  results: Record<string, boolean>;
  // Canvas work stored per problem
  problemAttempts?: Record<string, ProblemAttempt[]>;
}

// ============ Mastery and Adaptive Selection Types ============

export interface MasteryUpdate {
  previousTier: number;
  newTier: number;
  tierChanged: boolean;
  direction: "up" | "down" | "none";
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface StudentMastery {
  id: string;
  student_id: string;
  standard_id: string;
  current_tier: number;
  problems_attempted: number;
  problems_correct: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  last_tier_change_at: string | null;
  times_tier_up: number;
  times_tier_down: number;
  avg_time_seconds: number | null;
  last_practiced_at: string | null;
}

export interface MasterySummary {
  totalStandardsPracticed: number;
  averageTier: number;
  totalProblemsAttempted: number;
  totalProblemsCorrect: number;
  overallAccuracy: number;
  strongestStandards: Array<{ standardId: string; tier: number; accuracy: number }>;
  weakestStandards: Array<{ standardId: string; tier: number; accuracy: number }>;
}

export interface SelectedProblem {
  problem: Problem;
  source: "stored" | "ai_generated";
  problemId?: string;
}

export interface SelectionResult {
  problems: SelectedProblem[];
  metadata: {
    requested: number;
    storedCount: number;
    aiGeneratedCount: number;
    studentTier: number;
    standardCode: string;
  };
}

export interface SelectProblemsRequest {
  standardCode: string;
  studentId?: string;
  count?: number;
  preferStored?: boolean;
  tierOverride?: number;
  maxTier?: number;
}

export interface RecordAttemptRequest {
  studentId: string;
  standardCode: string;
  studentAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  hintsUsed?: number;
  sessionId?: string;
  errorType?: ErrorType;
  feedbackGiven?: string;
}

export interface MathStandard {
  code: string;
  title: string;
  description: string;
  gradeLevel: number;
  domain: string;
  examples?: string[];
}

// ============ Diagram Types ============

export type DiagramType =
  | "coordinate_plane"
  | "geometry"
  | "number_line"
  | "bar_model"
  | "area_model"
  | "tape_diagram"
  | "angle"
  | "circle_graph";

export interface Point2D {
  x: number;
  y: number;
  label?: string;
  color?: string;
  style?: "solid" | "hollow" | "cross";
}

export interface LineSegment {
  start: [number, number];
  end: [number, number];
  label?: string;
  color?: string;
  style?: "solid" | "dashed" | "dotted";
  showLength?: boolean;
}

export interface CoordinatePlaneDiagram {
  gridRange?: { xMin: number; xMax: number; yMin: number; yMax: number };
  showGrid?: boolean;
  showAxes?: boolean;
  points?: Point2D[];
  lines?: LineSegment[];
  functions?: Array<{ equation: string; color?: string; domain?: [number, number] }>;
  vectors?: Array<{ start: [number, number]; end: [number, number]; label?: string; color?: string }>;
  polygons?: Array<{ vertices: [number, number][]; fill?: string; stroke?: string; label?: string }>;
}

export interface GeometryShape {
  type: "triangle" | "rectangle" | "square" | "circle" | "polygon" | "parallelogram" | "trapezoid";
  vertices?: [number, number][];
  center?: [number, number];
  radius?: number;
  width?: number;
  height?: number;
  sideLabels?: string[];
  angleLabels?: string[];
  vertexLabels?: string[];
  showMeasurements?: boolean;
  fill?: string;
  stroke?: string;
}

export interface AngleMarker {
  vertex: [number, number];
  ray1End: [number, number];
  ray2End: [number, number];
  measure?: number;
  label?: string;
  showArc?: boolean;
}

export interface GeometryDiagram {
  shapes?: GeometryShape[];
  angles?: AngleMarker[];
  lines?: LineSegment[];
  points?: Point2D[];
  labels?: Array<{ position: [number, number]; text: string }>;
}

export interface NumberLineDiagram {
  min: number;
  max: number;
  step?: number;
  showTicks?: boolean;
  points?: Array<{ value: number; label?: string; color?: string; style?: "solid" | "hollow" }>;
  intervals?: Array<{ start: number; end: number; label?: string; color?: string; open?: [boolean, boolean] }>;
  arrows?: Array<{ from: number; to: number; label?: string; color?: string }>;
}

export interface BarModelDiagram {
  total?: number;
  parts: Array<{ value: number; label?: string; color?: string; unknown?: boolean }>;
  showTotal?: boolean;
  orientation?: "horizontal" | "vertical";
  comparisonBars?: Array<{ parts: Array<{ value: number; label?: string; color?: string }> }>;
}

export interface AreaModelDiagram {
  width: number;
  height: number;
  partitionsX?: number[];
  partitionsY?: number[];
  labelsTop?: string[];
  labelsSide?: string[];
  highlightCells?: [number, number][];
  cellLabels?: Array<{ row: number; col: number; label: string }>;
}

export interface TapeDiagramDiagram {
  tapes: Array<{
    label?: string;
    segments: Array<{ value: number; label?: string; color?: string; unknown?: boolean }>;
  }>;
  showBraces?: boolean;
}

export interface AngleDiagram {
  vertex: [number, number];
  rays: Array<{ angle: number; length: number; label?: string }>;
  measure?: number;
  showArc?: boolean;
  label?: string;
}

export interface CircleGraphDiagram {
  sections: Array<{ value: number; label?: string; color?: string }>;
  showPercents?: boolean;
  showValues?: boolean;
  title?: string;
}

export type DiagramData =
  | CoordinatePlaneDiagram
  | GeometryDiagram
  | NumberLineDiagram
  | BarModelDiagram
  | AreaModelDiagram
  | TapeDiagramDiagram
  | AngleDiagram
  | CircleGraphDiagram;
