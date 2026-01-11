/**
 * Math Facts Generator
 * Generates grade-appropriate math facts for warm-ups, interleaving, and speed challenges
 */

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type GradeLevel = 4 | 5 | 6 | 7 | 8;

export interface MathFact {
  id: string;
  problem_text: string;
  answer: string;
  operation: Operation;
  difficulty: number; // 1-3 for simple tracking
  category: 'math_fact';
}

// Grade-specific number ranges for operations
const GRADE_CONFIGS: Record<GradeLevel, {
  addition: { max1: number; max2: number };
  subtraction: { max: number };
  multiplication: { max1: number; max2: number };
  division: { maxDivisor: number; maxQuotient: number };
  includeDecimals: boolean;
  includeNegatives: boolean;
}> = {
  4: {
    addition: { max1: 99, max2: 99 },
    subtraction: { max: 100 },
    multiplication: { max1: 9, max2: 9 },
    division: { maxDivisor: 9, maxQuotient: 9 },
    includeDecimals: false,
    includeNegatives: false,
  },
  5: {
    addition: { max1: 999, max2: 99 },
    subtraction: { max: 999 },
    multiplication: { max1: 12, max2: 12 },
    division: { maxDivisor: 12, maxQuotient: 12 },
    includeDecimals: false,
    includeNegatives: false,
  },
  6: {
    addition: { max1: 999, max2: 999 },
    subtraction: { max: 999 },
    multiplication: { max1: 15, max2: 12 },
    division: { maxDivisor: 12, maxQuotient: 15 },
    includeDecimals: true,
    includeNegatives: false,
  },
  7: {
    addition: { max1: 999, max2: 999 },
    subtraction: { max: 999 },
    multiplication: { max1: 15, max2: 15 },
    division: { maxDivisor: 15, maxQuotient: 15 },
    includeDecimals: true,
    includeNegatives: true,
  },
  8: {
    addition: { max1: 999, max2: 999 },
    subtraction: { max: 999 },
    multiplication: { max1: 20, max2: 15 },
    division: { maxDivisor: 15, maxQuotient: 20 },
    includeDecimals: true,
    includeNegatives: true,
  },
};

// Random integer between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a unique ID
function generateId(): string {
  return `mf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate an addition problem
function generateAddition(gradeLevel: GradeLevel): MathFact {
  const config = GRADE_CONFIGS[gradeLevel];
  let a = randInt(1, config.addition.max1);
  let b = randInt(1, config.addition.max2);

  // Occasionally use negative numbers for grades 7-8
  if (config.includeNegatives && Math.random() < 0.3) {
    if (Math.random() < 0.5) a = -a;
    else b = -b;
  }

  const answer = a + b;
  const displayB = b < 0 ? `(${b})` : b.toString();

  return {
    id: generateId(),
    problem_text: `${a} + ${displayB} = ?`,
    answer: answer.toString(),
    operation: 'addition',
    difficulty: Math.abs(a) > 100 || Math.abs(b) > 100 ? 2 : 1,
    category: 'math_fact',
  };
}

// Generate a subtraction problem
function generateSubtraction(gradeLevel: GradeLevel): MathFact {
  const config = GRADE_CONFIGS[gradeLevel];
  let a = randInt(1, config.subtraction.max);
  let b = randInt(1, a); // Ensure positive result for lower grades

  // Allow negative results for grades 7-8
  if (config.includeNegatives && Math.random() < 0.3) {
    b = randInt(1, config.subtraction.max);
  }

  const answer = a - b;

  return {
    id: generateId(),
    problem_text: `${a} - ${b} = ?`,
    answer: answer.toString(),
    operation: 'subtraction',
    difficulty: a > 100 ? 2 : 1,
    category: 'math_fact',
  };
}

// Generate a multiplication problem
function generateMultiplication(gradeLevel: GradeLevel): MathFact {
  const config = GRADE_CONFIGS[gradeLevel];
  let a = randInt(2, config.multiplication.max1);
  let b = randInt(2, config.multiplication.max2);

  // Occasionally use negative numbers for grades 7-8
  if (config.includeNegatives && Math.random() < 0.2) {
    if (Math.random() < 0.5) a = -a;
    else b = -b;
  }

  const answer = a * b;
  const displayA = a < 0 ? `(${a})` : a.toString();
  const displayB = b < 0 ? `(${b})` : b.toString();

  return {
    id: generateId(),
    problem_text: `${displayA} × ${displayB} = ?`,
    answer: answer.toString(),
    operation: 'multiplication',
    difficulty: Math.abs(a) > 10 || Math.abs(b) > 10 ? 2 : 1,
    category: 'math_fact',
  };
}

// Generate a division problem (always whole number results)
function generateDivision(gradeLevel: GradeLevel): MathFact {
  const config = GRADE_CONFIGS[gradeLevel];
  const divisor = randInt(2, config.division.maxDivisor);
  const quotient = randInt(1, config.division.maxQuotient);
  const dividend = divisor * quotient;

  // Occasionally use negative numbers for grades 7-8
  let displayDividend = dividend;
  if (config.includeNegatives && Math.random() < 0.2) {
    displayDividend = -dividend;
  }

  const answer = displayDividend / divisor;

  return {
    id: generateId(),
    problem_text: `${displayDividend} ÷ ${divisor} = ?`,
    answer: answer.toString(),
    operation: 'division',
    difficulty: divisor > 10 ? 2 : 1,
    category: 'math_fact',
  };
}

// Generate a decimal problem (grades 6+)
function generateDecimalProblem(gradeLevel: GradeLevel): MathFact {
  const operations: Operation[] = ['addition', 'subtraction', 'multiplication'];
  const op = operations[randInt(0, operations.length - 1)];

  // Simple decimals: one decimal place
  const a = (randInt(1, 99) / 10).toFixed(1);
  const b = (randInt(1, 99) / 10).toFixed(1);

  let answer: number;
  let problemText: string;

  switch (op) {
    case 'addition':
      answer = parseFloat(a) + parseFloat(b);
      problemText = `${a} + ${b} = ?`;
      break;
    case 'subtraction':
      const [larger, smaller] = parseFloat(a) >= parseFloat(b) ? [a, b] : [b, a];
      answer = parseFloat(larger) - parseFloat(smaller);
      problemText = `${larger} - ${smaller} = ?`;
      break;
    case 'multiplication':
      // Simpler: whole number × decimal
      const whole = randInt(2, 9);
      const dec = (randInt(1, 9) / 10).toFixed(1);
      answer = whole * parseFloat(dec);
      problemText = `${whole} × ${dec} = ?`;
      break;
    default:
      answer = parseFloat(a) + parseFloat(b);
      problemText = `${a} + ${b} = ?`;
  }

  return {
    id: generateId(),
    problem_text: problemText,
    answer: answer.toFixed(1).replace(/\.0$/, ''),
    operation: op,
    difficulty: 2,
    category: 'math_fact',
  };
}

/**
 * Generate a single math fact appropriate for the given grade level
 */
export function generateMathFact(
  gradeLevel: GradeLevel,
  operation?: Operation | 'mixed'
): MathFact {
  const config = GRADE_CONFIGS[gradeLevel];

  // Choose operation
  let selectedOp: Operation;
  if (operation && operation !== 'mixed') {
    selectedOp = operation;
  } else {
    const ops: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
    selectedOp = ops[randInt(0, ops.length - 1)];
  }

  // 20% chance of decimal problem for grades 6+
  if (config.includeDecimals && Math.random() < 0.2) {
    return generateDecimalProblem(gradeLevel);
  }

  switch (selectedOp) {
    case 'addition':
      return generateAddition(gradeLevel);
    case 'subtraction':
      return generateSubtraction(gradeLevel);
    case 'multiplication':
      return generateMultiplication(gradeLevel);
    case 'division':
      return generateDivision(gradeLevel);
  }
}

/**
 * Generate multiple math facts for warm-up or speed challenge
 */
export function generateMathFacts(
  gradeLevel: GradeLevel,
  count: number,
  operation?: Operation | 'mixed'
): MathFact[] {
  const facts: MathFact[] = [];
  const usedProblems = new Set<string>();

  while (facts.length < count) {
    const fact = generateMathFact(gradeLevel, operation);
    // Avoid duplicates
    if (!usedProblems.has(fact.problem_text)) {
      usedProblems.add(fact.problem_text);
      facts.push(fact);
    }
  }

  return facts;
}

/**
 * Generate facts for a timed warm-up session
 * Returns more than needed so students can keep going
 */
export function generateWarmUpFacts(
  gradeLevel: GradeLevel,
  durationMinutes: number,
  focus: Operation | 'mixed'
): MathFact[] {
  // Estimate ~15-20 problems per minute for basic facts
  const estimatedCount = durationMinutes * 20;
  return generateMathFacts(gradeLevel, estimatedCount, focus);
}

/**
 * Generate facts for a 60-second speed challenge
 * Returns plenty of problems so fast students don't run out
 */
export function generateSpeedChallengeFacts(gradeLevel: GradeLevel): MathFact[] {
  // Generate 40 problems - most students won't finish all in 60 seconds
  return generateMathFacts(gradeLevel, 40, 'mixed');
}

/**
 * Check if a student's answer is correct for a math fact
 */
export function checkMathFactAnswer(fact: MathFact, studentAnswer: string): boolean {
  const normalized = studentAnswer.trim().replace(/\s/g, '');
  const expected = fact.answer.trim();

  // Direct match
  if (normalized === expected) return true;

  // Handle decimal equivalence (e.g., "2" vs "2.0")
  const studentNum = parseFloat(normalized);
  const expectedNum = parseFloat(expected);

  if (!isNaN(studentNum) && !isNaN(expectedNum)) {
    return Math.abs(studentNum - expectedNum) < 0.001;
  }

  return false;
}

// Problem type compatible with main app
interface LessonProblem {
  id: string;
  tier: number;
  problem_text: string;
  problem_latex?: string;
  answer: string;
  answer_type: string;
  acceptable_answers?: string[];
  solution_steps: string[];
  hints: string[];
  common_mistakes?: string[];
  category?: 'lesson' | 'math_fact';
}

/**
 * Convert a MathFact to a Problem-compatible object for interleaving
 */
function mathFactToProblem(fact: MathFact): LessonProblem {
  return {
    id: fact.id,
    tier: fact.difficulty,
    problem_text: fact.problem_text,
    answer: fact.answer,
    answer_type: 'integer', // Math facts are always integers or simple decimals
    acceptable_answers: [fact.answer],
    solution_steps: ['Calculate the answer'],
    hints: ['Take your time and think through each step'],
    category: 'math_fact',
  };
}

/**
 * Interleave math facts into lesson problems
 * Inserts 1 math fact after every 3-4 lesson problems
 */
export function interleaveMathFacts<T extends LessonProblem>(
  lessonProblems: T[],
  gradeLevel: GradeLevel,
  interval: number = 3 // Insert a fact every N problems
): (T | LessonProblem)[] {
  if (lessonProblems.length === 0) return [];

  // Mark lesson problems with their category
  const markedLessons = lessonProblems.map(p => ({
    ...p,
    category: (p.category || 'lesson') as 'lesson' | 'math_fact',
  }));

  // Calculate how many facts we need
  const numFacts = Math.floor(lessonProblems.length / interval);
  if (numFacts === 0) return markedLessons;

  // Generate unique math facts
  const facts = generateMathFacts(gradeLevel, numFacts, 'mixed');

  // Interleave facts into the problem list
  const result: (T | LessonProblem)[] = [];
  let factIndex = 0;

  for (let i = 0; i < markedLessons.length; i++) {
    result.push(markedLessons[i]);

    // Insert a fact after every 'interval' problems (but not after the last problem)
    if ((i + 1) % interval === 0 && factIndex < facts.length && i < markedLessons.length - 1) {
      result.push(mathFactToProblem(facts[factIndex]));
      factIndex++;
    }
  }

  return result;
}

/**
 * Check if interleaving should be enabled for a session
 * Can be controlled by class settings in the future
 */
export function shouldInterleaveFacts(
  gradeLevel: number,
  classSettings?: { interleaveEnabled?: boolean }
): boolean {
  // Default: enable for grades 4-8
  if (classSettings?.interleaveEnabled !== undefined) {
    return classSettings.interleaveEnabled;
  }
  return gradeLevel >= 4 && gradeLevel <= 8;
}
