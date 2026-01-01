import { Problem, ValidationResult, ErrorType } from '../types';

// Normalize answer for comparison
function normalizeAnswer(answer: string): string {
  let normalized = answer.trim().toLowerCase();

  // Remove "x=" or "y=" prefix
  normalized = normalized.replace(/^[a-z]\s*=\s*/, '');

  // Remove spaces around operators
  normalized = normalized.replace(/\s+/g, '');

  // Normalize fractions: remove spaces, handle mixed numbers
  // "1 1/2" -> "3/2" or "1.5" (we'll keep original form for now)

  // Remove trailing zeros after decimal
  if (normalized.includes('.')) {
    normalized = normalized.replace(/\.?0+$/, '');
  }

  // Handle negative signs
  normalized = normalized.replace(/^-\s+/, '-');
  normalized = normalized.replace(/\+-/, '-');
  normalized = normalized.replace(/-\+/, '-');

  return normalized;
}

// Convert fraction to decimal for comparison
function fractionToDecimal(fraction: string): number | null {
  // Handle mixed numbers: "1 1/2" -> 1.5
  const mixedMatch = fraction.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return sign * (Math.abs(whole) + num / den);
  }

  // Handle simple fractions: "3/4" -> 0.75
  const fractionMatch = fraction.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den === 0) return null;
    return num / den;
  }

  return null;
}

// Check if two numbers are approximately equal
function approximatelyEqual(a: number, b: number, tolerance: number = 0.001): boolean {
  return Math.abs(a - b) <= tolerance;
}

// Parse a numeric string (handles fractions, decimals, integers)
function parseNumeric(value: string): number | null {
  const normalized = normalizeAnswer(value);

  // Try as fraction first
  const fractionValue = fractionToDecimal(normalized);
  if (fractionValue !== null) {
    return fractionValue;
  }

  // Try as number
  const num = parseFloat(normalized);
  if (!isNaN(num)) {
    return num;
  }

  return null;
}

// Normalize coordinates for comparison
function normalizeCoordinate(coord: string): string {
  // Remove parentheses and spaces, normalize format
  return coord.replace(/[\(\)\s]/g, '').replace(/,+/g, ',');
}

// Parse coordinate string into numeric values
// Supports formats: "(3, 4)", "(3,4)", "3,4", "(3.5, -2)", "(1/2, 3/4)"
function parseCoordinate(coord: string): { x: number; y: number } | null {
  // Remove parentheses and normalize
  const cleaned = coord.replace(/[\(\)\s]/g, '');

  // Split by comma - need to handle negative numbers carefully
  // Match pattern: value,value where value can be negative, fraction, or decimal
  const match = cleaned.match(/^(-?[\d./]+),(-?[\d./]+)$/);
  if (!match) {
    return null;
  }

  const xStr = match[1];
  const yStr = match[2];

  const x = parseNumeric(xStr);
  const y = parseNumeric(yStr);

  if (x === null || y === null) {
    return null;
  }

  return { x, y };
}

// Check if two coordinates are approximately equal
function coordinatesMatch(
  studentCoord: string,
  correctCoord: string,
  tolerance: number = 0.001
): boolean {
  const student = parseCoordinate(studentCoord);
  const correct = parseCoordinate(correctCoord);

  if (student === null || correct === null) {
    return false;
  }

  return approximatelyEqual(student.x, correct.x, tolerance) &&
         approximatelyEqual(student.y, correct.y, tolerance);
}

// ============================================================================
// Expression Equivalence Checking
// ============================================================================

// Represents a term in a polynomial (e.g., 3x^2 has coefficient 3, variable 'x', power 2)
interface Term {
  coefficient: number;
  variables: Map<string, number>; // variable name -> exponent
}

// Tokenize expression into raw tokens
function tokenizeExpression(expr: string): string[] {
  // Normalize the expression
  let normalized = expr.replace(/\s+/g, '');

  // Handle implicit multiplication: 2x -> 2*x, xy -> x*y, 3(x) -> 3*(x)
  normalized = normalized.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
  normalized = normalized.replace(/([a-zA-Z])(\d)/g, '$1^$2'); // x2 -> x^2 (common shorthand)
  normalized = normalized.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
  normalized = normalized.replace(/(\))(\d)/g, '$1^$2');
  normalized = normalized.replace(/(\))\(/g, ')*(');
  normalized = normalized.replace(/(\))([a-zA-Z])/g, '$1*$2');

  // Split into tokens while preserving operators
  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if ('+-*/^()'.includes(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      // Handle negative sign at start or after operator/open paren
      if (char === '-' && (tokens.length === 0 ||
          ['+', '-', '*', '/', '^', '('].includes(tokens[tokens.length - 1]))) {
        current = '-';
      } else {
        tokens.push(char);
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

// Parse a simple term (no parentheses) into coefficient and variables
function parseTerm(termStr: string): Term | null {
  if (!termStr || termStr === '+') return null;

  const term: Term = {
    coefficient: 1,
    variables: new Map()
  };

  // Handle pure numbers
  const numMatch = termStr.match(/^-?\d+\.?\d*$/);
  if (numMatch) {
    term.coefficient = parseFloat(termStr);
    return term;
  }

  // Handle fractions as coefficients
  const fracMatch = termStr.match(/^(-?\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den !== 0) {
      term.coefficient = num / den;
      return term;
    }
  }

  // Parse coefficient and variables: matches patterns like -3x^2y, 2x, -x, xy
  let remaining = termStr;

  // Extract leading coefficient (including negative sign)
  const coeffMatch = remaining.match(/^(-?\d*\.?\d*)/);
  if (coeffMatch && coeffMatch[1]) {
    if (coeffMatch[1] === '-') {
      term.coefficient = -1;
    } else if (coeffMatch[1] !== '') {
      term.coefficient = parseFloat(coeffMatch[1]);
    }
    remaining = remaining.slice(coeffMatch[1].length);
  }

  // Parse variables and their exponents
  const varPattern = /([a-zA-Z])(?:\^(\d+))?/g;
  let varMatch;

  while ((varMatch = varPattern.exec(remaining)) !== null) {
    const varName = varMatch[1].toLowerCase();
    const exponent = varMatch[2] ? parseInt(varMatch[2], 10) : 1;
    const currentExp = term.variables.get(varName) || 0;
    term.variables.set(varName, currentExp + exponent);
  }

  return term;
}

// Convert variables map to a canonical string key for grouping like terms
function getVariableKey(variables: Map<string, number>): string {
  const sorted = Array.from(variables.entries())
    .filter(([, exp]) => exp !== 0)
    .sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([v, e]) => e === 1 ? v : `${v}^${e}`).join('');
}

// Parse expression into a list of terms (handles + and - only, not nested parens)
function parseSimpleExpression(expr: string): Term[] {
  const terms: Term[] = [];

  // Normalize and split by + and - while keeping the sign
  let normalized = expr.replace(/\s+/g, '');

  // Handle implicit multiplication
  normalized = normalized.replace(/(\d)([a-zA-Z])/g, '$1*$2');

  // Split into terms, preserving signs
  const termStrings: string[] = [];
  let current = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if ((char === '+' || char === '-') && i > 0 && normalized[i - 1] !== '^' && normalized[i - 1] !== '*' && normalized[i - 1] !== '/') {
      if (current) {
        termStrings.push(current);
      }
      current = char === '-' ? '-' : '';
    } else {
      current += char;
    }
  }

  if (current) {
    termStrings.push(current);
  }

  // Parse each term string
  for (const termStr of termStrings) {
    // Handle coefficient*variable format (e.g., "3*x")
    const parts = termStr.split('*').filter(p => p);
    let coefficient = 1;
    const variables = new Map<string, number>();

    for (const part of parts) {
      const parsed = parseTerm(part);
      if (parsed) {
        coefficient *= parsed.coefficient;
        for (const [v, e] of parsed.variables) {
          const current = variables.get(v) || 0;
          variables.set(v, current + e);
        }
      }
    }

    terms.push({ coefficient, variables });
  }

  return terms;
}

// Combine like terms in a list
function combineTerms(terms: Term[]): Map<string, number> {
  const combined = new Map<string, number>();

  for (const term of terms) {
    const key = getVariableKey(term.variables);
    const current = combined.get(key) || 0;
    combined.set(key, current + term.coefficient);
  }

  return combined;
}

// Check if two expressions are equivalent
function expressionsMatch(expr1: string, expr2: string, tolerance: number = 0.001): boolean {
  try {
    // Parse both expressions
    const terms1 = parseSimpleExpression(expr1);
    const terms2 = parseSimpleExpression(expr2);

    // Combine like terms
    const combined1 = combineTerms(terms1);
    const combined2 = combineTerms(terms2);

    // Get all unique variable keys
    const allKeys = new Set([...combined1.keys(), ...combined2.keys()]);

    // Compare coefficients for each term
    for (const key of allKeys) {
      const coeff1 = combined1.get(key) || 0;
      const coeff2 = combined2.get(key) || 0;

      // Skip zero coefficients
      if (Math.abs(coeff1) < tolerance && Math.abs(coeff2) < tolerance) {
        continue;
      }

      if (!approximatelyEqual(coeff1, coeff2, tolerance)) {
        return false;
      }
    }

    return true;
  } catch {
    // If parsing fails, fall back to string comparison
    return false;
  }
}

// Evaluate expression at a given point (for verification)
// This provides a secondary check for expression equivalence
function evaluateExpression(expr: string, values: Map<string, number>): number | null {
  try {
    let evalStr = expr.replace(/\s+/g, '');

    // Handle implicit multiplication
    evalStr = evalStr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    evalStr = evalStr.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
    evalStr = evalStr.replace(/([a-zA-Z])\(/g, '$1*(');
    evalStr = evalStr.replace(/\)([a-zA-Z])/g, ')*$1');
    evalStr = evalStr.replace(/\)\(/g, ')*(');

    // Replace variables with values
    for (const [variable, value] of values) {
      evalStr = evalStr.replace(new RegExp(variable, 'gi'), `(${value})`);
    }

    // Replace ^ with ** for JavaScript
    evalStr = evalStr.replace(/\^/g, '**');

    // Safe evaluation (only math operations)
    if (!/^[\d+\-*/().**\s]+$/.test(evalStr)) {
      return null;
    }

    // Use Function constructor for safer eval
    const result = new Function(`return ${evalStr}`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// Check expression equivalence using both algebraic and numerical methods
function expressionsEquivalent(expr1: string, expr2: string): boolean {
  // First try algebraic comparison
  if (expressionsMatch(expr1, expr2)) {
    return true;
  }

  // Fall back to numerical evaluation at multiple test points
  // This catches cases the algebraic parser might miss
  const testValues: Map<string, number>[] = [
    new Map([['x', 1], ['y', 1]]),
    new Map([['x', 2], ['y', 3]]),
    new Map([['x', -1], ['y', 2]]),
    new Map([['x', 0.5], ['y', -1]]),
  ];

  let allMatch = true;
  let anyEvaluated = false;

  for (const values of testValues) {
    const result1 = evaluateExpression(expr1, values);
    const result2 = evaluateExpression(expr2, values);

    if (result1 !== null && result2 !== null) {
      anyEvaluated = true;
      if (!approximatelyEqual(result1, result2, 0.0001)) {
        allMatch = false;
        break;
      }
    }
  }

  // Only return true if we successfully evaluated at least some test points
  return anyEvaluated && allMatch;
}

// Check if student answer matches correct answer
function answersMatch(
  studentAnswer: string,
  correctAnswer: string,
  answerType: string,
  acceptableAnswers?: string[]
): boolean {
  const normalizedStudent = normalizeAnswer(studentAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Direct match
  if (normalizedStudent === normalizedCorrect) {
    return true;
  }

  // Check acceptable answers
  if (acceptableAnswers) {
    for (const acceptable of acceptableAnswers) {
      if (normalizeAnswer(acceptable) === normalizedStudent) {
        return true;
      }
    }
  }

  // Type-specific comparisons
  switch (answerType) {
    case 'integer':
    case 'decimal': {
      const studentNum = parseNumeric(studentAnswer);
      const correctNum = parseNumeric(correctAnswer);
      if (studentNum !== null && correctNum !== null) {
        return approximatelyEqual(studentNum, correctNum);
      }
      break;
    }

    case 'fraction': {
      const studentNum = parseNumeric(studentAnswer);
      const correctNum = parseNumeric(correctAnswer);
      if (studentNum !== null && correctNum !== null) {
        return approximatelyEqual(studentNum, correctNum);
      }
      // Also check if equivalent fractions
      // e.g., "2/4" should equal "1/2"
      break;
    }

    case 'coordinate': {
      // First try string comparison for exact matches
      const normalizedStudentCoord = normalizeCoordinate(studentAnswer);
      const normalizedCorrectCoord = normalizeCoordinate(correctAnswer);
      if (normalizedStudentCoord === normalizedCorrectCoord) {
        return true;
      }
      // Then try numeric comparison with tolerance
      if (coordinatesMatch(studentAnswer, correctAnswer)) {
        return true;
      }
      break;
    }

    case 'expression': {
      // Use algebraic equivalence checking with numerical verification fallback
      if (expressionsEquivalent(studentAnswer, correctAnswer)) {
        return true;
      }
      break;
    }
  }

  return false;
}

// Attempt to identify the type of error made
function identifyErrorType(
  studentAnswer: string,
  correctAnswer: string,
  problem: Problem
): ErrorType {
  const studentNum = parseNumeric(studentAnswer);
  const correctNum = parseNumeric(correctAnswer);

  if (studentNum !== null && correctNum !== null) {
    // Check for sign error
    if (approximatelyEqual(Math.abs(studentNum), Math.abs(correctNum))) {
      return 'sign_error';
    }

    // Check if student's answer is double or half (common with coefficients)
    if (approximatelyEqual(studentNum * 2, correctNum) ||
        approximatelyEqual(studentNum, correctNum * 2)) {
      return 'arithmetic_error';
    }

    // Check for order of operations issues (rough heuristic)
    // This is a simplification - real detection would need more context
  }

  // Check common mistakes from problem definition
  if (problem.common_mistakes) {
    for (const mistake of problem.common_mistakes) {
      if (mistake.toLowerCase().includes('sign')) {
        // Heuristic: if sign error mentioned and answer differs by sign
        if (studentNum !== null && correctNum !== null &&
            approximatelyEqual(studentNum, -correctNum)) {
          return 'sign_error';
        }
      }
    }
  }

  return 'unknown';
}

// Generate feedback based on the error
function generateFeedback(
  correct: boolean,
  errorType: ErrorType | undefined,
  problem: Problem
): string {
  if (correct) {
    const praises = [
      'Correct!',
      'Great job!',
      'That\'s right!',
      'Perfect!',
      'Excellent work!',
    ];
    return praises[Math.floor(Math.random() * praises.length)];
  }

  // Error-specific feedback
  switch (errorType) {
    case 'sign_error':
      return 'Almost there! Check your positive and negative signs carefully.';
    case 'arithmetic_error':
      return 'Good approach, but double-check your arithmetic.';
    case 'incomplete_solution':
      return 'You\'re on the right track, but the solution isn\'t complete yet.';
    case 'wrong_operation':
      return 'Think about which operation you should use here.';
    case 'order_of_operations':
      return 'Remember the order of operations (PEMDAS).';
    case 'fraction_error':
      return 'Check your work with fractions - make sure denominators are handled correctly.';
    case 'decimal_error':
      return 'Watch your decimal places!';
    default:
      return 'Not quite right. Try reviewing the solution steps.';
  }
}

// Main validation function
export function validateAnswer(
  problem: Problem,
  studentAnswer: string
): ValidationResult {
  const correct = answersMatch(
    studentAnswer,
    problem.answer,
    problem.answer_type,
    problem.acceptable_answers
  );

  let errorType: ErrorType | undefined;
  let hintToShow: number | undefined;

  if (!correct) {
    errorType = identifyErrorType(studentAnswer, problem.answer, problem);
    hintToShow = 0; // Start with first hint
  }

  const feedback = generateFeedback(correct, errorType, problem);

  return {
    correct,
    student_answer: studentAnswer,
    correct_answer: problem.answer,
    feedback,
    error_type: errorType,
    hint_to_show: hintToShow,
  };
}

// Validate with progressive hints (for multiple attempts)
export function validateWithHintProgression(
  problem: Problem,
  studentAnswer: string,
  attemptNumber: number // 1-indexed
): ValidationResult {
  const result = validateAnswer(problem, studentAnswer);

  if (!result.correct && problem.hints.length > 0) {
    // Progress through hints with each incorrect attempt
    const hintIndex = Math.min(attemptNumber - 1, problem.hints.length - 1);
    result.hint_to_show = hintIndex;
  }

  return result;
}

// Batch validate multiple answers
export function validateAnswers(
  problems: Problem[],
  studentAnswers: string[]
): ValidationResult[] {
  return problems.map((problem, index) => {
    const answer = studentAnswers[index] ?? '';
    return validateAnswer(problem, answer);
  });
}

// Check if answer is equivalent (for use in UI before submission)
export function isEquivalentAnswer(
  answer1: string,
  answer2: string,
  answerType: string
): boolean {
  return answersMatch(answer1, answer2, answerType);
}
