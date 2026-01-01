import { z } from 'zod';

// ============================================
// Extracted Content Types (from image analysis)
// ============================================

// Allow flexible example format (string or object)
const ExampleSchema = z.union([
  z.string(),
  z.object({
    problem: z.string().optional(),
    steps: z.array(z.string()).optional(),
    solution: z.string().optional(),
  }).passthrough(),
]);

// Helper to coerce empty strings/null to empty array
const coerceToArray = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? [] : val),
  z.array(z.string())
);

const coerceToExampleArray = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? [] : val),
  z.array(ExampleSchema)
);

export const ExtractedContentSchema = z.object({
  equations: coerceToArray.optional(),
  examples_shown: coerceToExampleArray.optional(),
  concepts: coerceToArray.optional(),
  word_problems: coerceToArray.optional(),
  definitions: coerceToArray.optional(),
  graphs_described: coerceToArray.optional(),
});

export const ImageExtractionResultSchema = z.object({
  topic: z.string(),
  subtopics: z.array(z.string()),
  grade_level: z.number().min(6).max(8),
  standards: z.array(z.string()),
  extracted_content: ExtractedContentSchema,
  difficulty_baseline: z.number().min(1).max(5),
});

export const ImageExtractionErrorSchema = z.object({
  error: z.literal(true),
  message: z.string(),
  suggestion: z.string().optional(),
});

export type ExtractedContent = z.infer<typeof ExtractedContentSchema>;
export type ImageExtractionResult = z.infer<typeof ImageExtractionResultSchema>;
export type ImageExtractionError = z.infer<typeof ImageExtractionErrorSchema>;
export type ImageExtractionResponse = ImageExtractionResult | ImageExtractionError;

// ============================================
// Problem Generation Types
// ============================================

export const AnswerTypeSchema = z.enum([
  'integer',
  'decimal',
  'fraction',
  'expression',
  'coordinate',
  'multiple_choice',
  'true_false',
]);

export const ProblemSchema = z.object({
  id: z.string(),
  tier: z.number().min(1).max(5),
  problem_text: z.string(),
  problem_latex: z.string().optional(),
  answer: z.string(),
  answer_type: AnswerTypeSchema,
  acceptable_answers: z.array(z.string()).optional(), // equivalent forms
  solution_steps: z.array(z.string()),
  hints: z.array(z.string()).min(1).max(3),
  common_mistakes: z.array(z.string()).optional(),
});

export const ProblemSetSchema = z.object({
  topic: z.string(),
  problems: z.array(ProblemSchema),
  generated_at: z.string(),
});

export type AnswerType = z.infer<typeof AnswerTypeSchema>;
export type Problem = z.infer<typeof ProblemSchema>;
export type ProblemSet = z.infer<typeof ProblemSetSchema>;

// ============================================
// Answer Validation Types
// ============================================

export const ErrorTypeSchema = z.enum([
  'sign_error',
  'arithmetic_error',
  'incomplete_solution',
  'wrong_operation',
  'order_of_operations',
  'fraction_error',
  'decimal_error',
  'unit_error',
  'unknown',
]);

export const ValidationResultSchema = z.object({
  correct: z.boolean(),
  student_answer: z.string(),
  correct_answer: z.string(),
  feedback: z.string(),
  error_type: ErrorTypeSchema.optional(),
  hint_to_show: z.number().optional(), // 0-indexed hint to reveal
});

export type ErrorType = z.infer<typeof ErrorTypeSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================
// Pipeline Configuration
// ============================================

export interface PipelineConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  debug?: boolean;
}

export interface GenerationOptions {
  tier: number;
  count: number;
  includeHints?: boolean;
  includeCommonMistakes?: boolean;
}

// ============================================
// Helper function to check if extraction was successful
// ============================================

export function isExtractionError(
  result: ImageExtractionResponse
): result is ImageExtractionError {
  return 'error' in result && result.error === true;
}
