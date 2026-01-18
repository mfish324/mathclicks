/**
 * Problem Normalizer
 * Converts raw problems from various sources to normalized internal format
 */

import type { AnswerType, LicenseType, ProblemSource } from '../types/database';
import type { RawProblem, NormalizedProblem, ImportConfig } from './types';

/**
 * Infer answer type from the answer string
 */
export function inferAnswerType(answer: string): AnswerType {
  const trimmed = answer.trim();

  // Check for coordinate format: (x, y)
  if (/^\s*\(\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)\s*$/.test(trimmed)) {
    return 'coordinate';
  }

  // Check for fraction format: a/b or -a/b
  if (/^-?\d+\s*\/\s*\d+$/.test(trimmed)) {
    return 'fraction';
  }

  // Check for mixed number: a b/c
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(trimmed)) {
    return 'fraction';
  }

  // Check for decimal
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return 'decimal';
  }

  // Check for integer
  if (/^-?\d+$/.test(trimmed)) {
    return 'integer';
  }

  // Check for true/false
  if (/^(true|false|yes|no)$/i.test(trimmed)) {
    return 'true_false';
  }

  // Check for multiple choice letter
  if (/^[A-Da-d]\.?$/.test(trimmed)) {
    return 'multiple_choice';
  }

  // Default to expression for anything else (equations, algebraic expressions)
  return 'expression';
}

/**
 * Normalize answer type string to enum value
 */
export function normalizeAnswerType(typeStr: string | undefined): AnswerType {
  if (!typeStr) return 'expression';

  const normalized = typeStr.toLowerCase().trim().replace(/[_-]/g, '_');

  const mapping: Record<string, AnswerType> = {
    'integer': 'integer',
    'int': 'integer',
    'whole_number': 'integer',
    'decimal': 'decimal',
    'dec': 'decimal',
    'fraction': 'fraction',
    'frac': 'fraction',
    'expression': 'expression',
    'expr': 'expression',
    'algebraic': 'expression',
    'coordinate': 'coordinate',
    'coord': 'coordinate',
    'point': 'coordinate',
    'multiple_choice': 'multiple_choice',
    'mc': 'multiple_choice',
    'choice': 'multiple_choice',
    'true_false': 'true_false',
    'tf': 'true_false',
    'boolean': 'true_false',
  };

  return mapping[normalized] || 'expression';
}

/**
 * Normalize license string to enum value
 */
export function normalizeLicense(licenseStr: string | undefined): LicenseType {
  if (!licenseStr) return 'public_domain';

  const normalized = licenseStr.toLowerCase().trim().replace(/[\s-]/g, '_');

  const mapping: Record<string, LicenseType> = {
    'public_domain': 'public_domain',
    'pd': 'public_domain',
    'cc0': 'cc0',
    'cc_0': 'cc0',
    'cc_by': 'cc_by',
    'ccby': 'cc_by',
    'cc_by_sa': 'cc_by_sa',
    'ccbysa': 'cc_by_sa',
    'cc_by_nc': 'cc_by_nc',
    'ccbync': 'cc_by_nc',
  };

  return mapping[normalized] || 'public_domain';
}

/**
 * Estimate difficulty tier based on problem characteristics
 */
export function estimateTier(problem: RawProblem): number {
  // If difficulty is provided, use it
  if (problem.difficulty && problem.difficulty >= 1 && problem.difficulty <= 5) {
    return Math.round(problem.difficulty);
  }

  let tier = 3; // Default to middle tier

  const text = problem.problemText.toLowerCase();
  const answer = problem.answer;

  // Check for complexity indicators
  const complexityFactors = {
    // Simpler problems
    simple: [
      /^what is/i,
      /^find the/i,
      /^solve:/i,
      /single.?digit/i,
    ],
    // Harder problems
    complex: [
      /multi.?step/i,
      /word problem/i,
      /explain/i,
      /justify/i,
      /prove/i,
      /compare and contrast/i,
      /real.?world/i,
    ],
  };

  // Check for simple patterns
  for (const pattern of complexityFactors.simple) {
    if (pattern.test(text)) {
      tier -= 1;
      break;
    }
  }

  // Check for complex patterns
  for (const pattern of complexityFactors.complex) {
    if (pattern.test(text)) {
      tier += 1;
      break;
    }
  }

  // Check answer complexity
  if (answer.length > 10) tier += 0.5;
  if (/[xy]/.test(answer)) tier += 0.5; // Variables in answer
  if (/\d{4,}/.test(answer)) tier += 0.5; // Large numbers

  // Check text length
  if (problem.problemText.length > 200) tier += 0.5;
  if (problem.problemText.length < 50) tier -= 0.5;

  // Clamp to valid range
  return Math.max(1, Math.min(5, Math.round(tier)));
}

/**
 * Generate basic hints if none provided
 */
export function generateBasicHints(problem: RawProblem): string[] {
  const hints: string[] = [];

  // Check answer type to provide type-specific hints
  const answerType = problem.answerType
    ? normalizeAnswerType(problem.answerType)
    : inferAnswerType(problem.answer);

  switch (answerType) {
    case 'fraction':
      hints.push('Express your answer as a fraction in simplest form.');
      hints.push('Make sure the numerator and denominator have no common factors.');
      break;
    case 'decimal':
      hints.push('Your answer should be a decimal number.');
      hints.push('Check your decimal point placement.');
      break;
    case 'integer':
      hints.push('Your answer should be a whole number.');
      break;
    case 'coordinate':
      hints.push('Express your answer as an ordered pair (x, y).');
      break;
    case 'expression':
      hints.push('Simplify your expression if possible.');
      break;
    default:
      hints.push('Read the problem carefully before answering.');
  }

  // Add a generic hint
  hints.push('Check your work by substituting your answer back into the problem.');

  return hints;
}

/**
 * Generate basic solution steps if none provided
 */
export function generateBasicSolutionSteps(problem: RawProblem): string[] {
  // We can't generate meaningful solution steps without understanding the problem
  // So we provide generic steps that at least show the answer
  return [
    'Read the problem carefully.',
    'Identify what is being asked.',
    'Set up the problem.',
    'Solve step by step.',
    `The answer is: ${problem.answer}`,
  ];
}

/**
 * Normalize a raw problem to the internal format
 */
export function normalizeProblem(
  raw: RawProblem,
  config: ImportConfig
): NormalizedProblem {
  // Determine answer type
  const answerType = raw.answerType
    ? normalizeAnswerType(raw.answerType)
    : inferAnswerType(raw.answer);

  // Determine tier
  const tier = estimateTier(raw);

  // Ensure hints exist
  const hints =
    raw.hints && raw.hints.length > 0
      ? raw.hints
      : generateBasicHints(raw);

  // Ensure solution steps exist
  const solutionSteps =
    raw.solutionSteps && raw.solutionSteps.length > 0
      ? raw.solutionSteps
      : generateBasicSolutionSteps(raw);

  // Build normalized problem
  const normalized: NormalizedProblem = {
    tier,
    problem_text: raw.problemText.trim(),
    answer: raw.answer.trim(),
    answer_type: answerType,
    solution_steps: solutionSteps,
    hints: hints.slice(0, 3), // Max 3 hints
    source: config.source,
    license: raw.license ? normalizeLicense(raw.license) : config.defaultLicense,
  };

  // Add optional fields
  if (raw.problemLatex) {
    normalized.problem_latex = raw.problemLatex;
  }

  if (raw.acceptableAnswers && raw.acceptableAnswers.length > 0) {
    normalized.acceptable_answers = raw.acceptableAnswers;
  }

  if (raw.commonMistakes && raw.commonMistakes.length > 0) {
    normalized.common_mistakes = raw.commonMistakes;
  }

  if (raw.topic) {
    normalized.topic = raw.topic;
  }

  if (raw.sourceUrl) {
    normalized.source_url = raw.sourceUrl;
  }

  if (raw.sourceReference) {
    normalized.source_reference = raw.sourceReference;
  }

  if (raw.attribution) {
    normalized.attribution = raw.attribution;
  }

  // Store standard code for later resolution
  if (raw.ccssCode) {
    normalized.primary_standard_code = raw.ccssCode;
  } else if (raw.standardCode) {
    normalized.primary_standard_code = raw.standardCode;
  }

  return normalized;
}

/**
 * Validate a normalized problem
 */
export function validateNormalizedProblem(problem: NormalizedProblem): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!problem.problem_text || problem.problem_text.trim().length === 0) {
    errors.push('Problem text is required');
  }

  if (!problem.answer || problem.answer.trim().length === 0) {
    errors.push('Answer is required');
  }

  if (problem.tier < 1 || problem.tier > 5) {
    errors.push('Tier must be between 1 and 5');
  }

  if (!problem.hints || problem.hints.length === 0) {
    errors.push('At least one hint is required');
  }

  if (!problem.solution_steps || problem.solution_steps.length === 0) {
    errors.push('At least one solution step is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
