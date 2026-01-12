/**
 * Common Core Math Standards Reference
 * Organized by grade level for easy teacher selection
 */

export interface MathStandard {
  code: string;
  title: string;
  description: string;
  gradeLevel: number;
  domain: string;
  examples?: string[];
}

export interface StandardCategory {
  domain: string;
  domainName: string;
  standards: MathStandard[];
}

export interface GradeStandards {
  grade: number;
  gradeName: string;
  categories: StandardCategory[];
}

// Grade 4 Standards
const GRADE_4_STANDARDS: MathStandard[] = [
  {
    code: '4.OA.A.1',
    title: 'Multiplicative Comparisons',
    description: 'Interpret a multiplication equation as a comparison',
    gradeLevel: 4,
    domain: 'OA',
    examples: ['35 = 5 × 7 means 35 is 5 times as many as 7'],
  },
  {
    code: '4.OA.A.2',
    title: 'Word Problems with Comparisons',
    description: 'Multiply or divide to solve word problems involving multiplicative comparison',
    gradeLevel: 4,
    domain: 'OA',
    examples: ['A red ribbon is 3 times as long as the blue ribbon. If the blue ribbon is 5 inches, how long is the red ribbon?'],
  },
  {
    code: '4.OA.B.4',
    title: 'Factors and Multiples',
    description: 'Find all factor pairs for whole numbers 1-100, recognize prime and composite',
    gradeLevel: 4,
    domain: 'OA',
    examples: ['Find all factors of 36', 'Is 17 prime or composite?'],
  },
  {
    code: '4.NBT.B.4',
    title: 'Multi-digit Addition & Subtraction',
    description: 'Fluently add and subtract multi-digit whole numbers using standard algorithm',
    gradeLevel: 4,
    domain: 'NBT',
    examples: ['3,452 + 1,789', '5,000 - 2,347'],
  },
  {
    code: '4.NBT.B.5',
    title: 'Multi-digit Multiplication',
    description: 'Multiply a whole number up to four digits by a one-digit number',
    gradeLevel: 4,
    domain: 'NBT',
    examples: ['2,345 × 6', '789 × 4'],
  },
  {
    code: '4.NF.A.1',
    title: 'Equivalent Fractions',
    description: 'Explain why fractions are equivalent using visual models',
    gradeLevel: 4,
    domain: 'NF',
    examples: ['Show why 1/2 = 2/4 = 3/6'],
  },
  {
    code: '4.NF.B.3',
    title: 'Adding & Subtracting Fractions',
    description: 'Add and subtract fractions with like denominators',
    gradeLevel: 4,
    domain: 'NF',
    examples: ['3/8 + 2/8', '5/6 - 1/6'],
  },
  {
    code: '4.NF.C.6',
    title: 'Decimals and Fractions',
    description: 'Use decimal notation for fractions with denominators 10 or 100',
    gradeLevel: 4,
    domain: 'NF',
    examples: ['Write 3/10 as a decimal', '0.62 = 62/100'],
  },
];

// Grade 5 Standards
const GRADE_5_STANDARDS: MathStandard[] = [
  {
    code: '5.OA.A.1',
    title: 'Order of Operations',
    description: 'Use parentheses, brackets, and braces in numerical expressions',
    gradeLevel: 5,
    domain: 'OA',
    examples: ['Evaluate: 2 × (3 + 4)', '(6 + 2) × 5 - 3'],
  },
  {
    code: '5.NBT.B.5',
    title: 'Multi-digit Multiplication',
    description: 'Fluently multiply multi-digit whole numbers using standard algorithm',
    gradeLevel: 5,
    domain: 'NBT',
    examples: ['234 × 56', '1,234 × 78'],
  },
  {
    code: '5.NBT.B.6',
    title: 'Multi-digit Division',
    description: 'Find whole-number quotients with up to four-digit dividends and two-digit divisors',
    gradeLevel: 5,
    domain: 'NBT',
    examples: ['1,344 ÷ 24', '2,856 ÷ 34'],
  },
  {
    code: '5.NBT.B.7',
    title: 'Decimal Operations',
    description: 'Add, subtract, multiply, and divide decimals to hundredths',
    gradeLevel: 5,
    domain: 'NBT',
    examples: ['3.45 + 2.7', '4.5 × 0.3', '7.2 ÷ 0.8'],
  },
  {
    code: '5.NF.A.1',
    title: 'Adding Unlike Fractions',
    description: 'Add and subtract fractions with unlike denominators',
    gradeLevel: 5,
    domain: 'NF',
    examples: ['1/3 + 1/4', '5/6 - 1/2'],
  },
  {
    code: '5.NF.B.4',
    title: 'Multiplying Fractions',
    description: 'Multiply a fraction by a whole number or another fraction',
    gradeLevel: 5,
    domain: 'NF',
    examples: ['3 × 2/5', '1/2 × 3/4'],
  },
  {
    code: '5.NF.B.7',
    title: 'Dividing Fractions',
    description: 'Divide unit fractions by whole numbers and whole numbers by unit fractions',
    gradeLevel: 5,
    domain: 'NF',
    examples: ['1/3 ÷ 4', '5 ÷ 1/2'],
  },
  {
    code: '5.G.A.1',
    title: 'Coordinate Plane',
    description: 'Graph points on the coordinate plane to solve problems',
    gradeLevel: 5,
    domain: 'G',
    examples: ['Plot (3, 5) on the coordinate plane'],
  },
];

// Grade 6 Standards
const GRADE_6_STANDARDS: MathStandard[] = [
  {
    code: '6.RP.A.1',
    title: 'Ratios',
    description: 'Understand ratio concepts and use ratio language',
    gradeLevel: 6,
    domain: 'RP',
    examples: ['The ratio of boys to girls is 3 to 2'],
  },
  {
    code: '6.RP.A.2',
    title: 'Unit Rates',
    description: 'Understand unit rate and use rate language',
    gradeLevel: 6,
    domain: 'RP',
    examples: ['If 12 apples cost $6, what is the cost per apple?'],
  },
  {
    code: '6.RP.A.3',
    title: 'Ratio & Rate Problems',
    description: 'Use ratio and rate reasoning to solve problems',
    gradeLevel: 6,
    domain: 'RP',
    examples: ['Percent problems', 'Unit rate comparisons', 'Equivalent ratios'],
  },
  {
    code: '6.NS.A.1',
    title: 'Dividing Fractions',
    description: 'Interpret and compute quotients of fractions',
    gradeLevel: 6,
    domain: 'NS',
    examples: ['2/3 ÷ 3/4', 'How many 1/4 cups in 3/4 cup?'],
  },
  {
    code: '6.NS.B.3',
    title: 'Decimal Operations',
    description: 'Fluently add, subtract, multiply, and divide multi-digit decimals',
    gradeLevel: 6,
    domain: 'NS',
    examples: ['12.34 × 5.6', '45.6 ÷ 1.2'],
  },
  {
    code: '6.NS.C.6',
    title: 'Negative Numbers',
    description: 'Understand and plot positive and negative numbers on a number line',
    gradeLevel: 6,
    domain: 'NS',
    examples: ['Plot -3 and 3 on a number line', 'What is the opposite of -5?'],
  },
  {
    code: '6.EE.A.2',
    title: 'Writing Expressions',
    description: 'Write, read, and evaluate expressions with variables',
    gradeLevel: 6,
    domain: 'EE',
    examples: ['Write an expression for "5 more than x"', 'Evaluate 3x + 2 when x = 4'],
  },
  {
    code: '6.EE.B.7',
    title: 'One-Step Equations',
    description: 'Solve one-step equations of the form x + p = q and px = q',
    gradeLevel: 6,
    domain: 'EE',
    examples: ['x + 5 = 12', '3x = 15'],
  },
];

// Grade 7 Standards
const GRADE_7_STANDARDS: MathStandard[] = [
  {
    code: '7.RP.A.1',
    title: 'Unit Rates with Fractions',
    description: 'Compute unit rates with ratios of fractions',
    gradeLevel: 7,
    domain: 'RP',
    examples: ['If 1/2 mile takes 1/4 hour, what is the speed in miles per hour?'],
  },
  {
    code: '7.RP.A.2',
    title: 'Proportional Relationships',
    description: 'Recognize and represent proportional relationships',
    gradeLevel: 7,
    domain: 'RP',
    examples: ['Is y = 3x proportional?', 'Find the constant of proportionality'],
  },
  {
    code: '7.RP.A.3',
    title: 'Percent Problems',
    description: 'Solve multi-step percent problems',
    gradeLevel: 7,
    domain: 'RP',
    examples: ['Tax and tip', 'Percent increase/decrease', 'Simple interest'],
  },
  {
    code: '7.NS.A.1',
    title: 'Adding & Subtracting Integers',
    description: 'Add and subtract rational numbers (positive and negative)',
    gradeLevel: 7,
    domain: 'NS',
    examples: ['-3 + 7', '5 - (-2)', '-4 - 6'],
  },
  {
    code: '7.NS.A.2',
    title: 'Multiplying & Dividing Integers',
    description: 'Multiply and divide rational numbers',
    gradeLevel: 7,
    domain: 'NS',
    examples: ['(-3) × 4', '(-12) ÷ (-3)', '(-2) × (-5)'],
  },
  {
    code: '7.EE.A.1',
    title: 'Combining Like Terms',
    description: 'Apply properties to add, subtract, factor, and expand expressions',
    gradeLevel: 7,
    domain: 'EE',
    examples: ['3x + 5x', '2(x + 4)', '6x + 12 = 6(x + 2)'],
  },
  {
    code: '7.EE.B.4a',
    title: 'Two-Step Equations',
    description: 'Solve word problems leading to equations of the form px + q = r',
    gradeLevel: 7,
    domain: 'EE',
    examples: ['2x + 5 = 17', '3x - 4 = 11'],
  },
  {
    code: '7.G.B.6',
    title: 'Area & Circumference',
    description: 'Solve problems involving area, circumference of circles',
    gradeLevel: 7,
    domain: 'G',
    examples: ['Find the area of a circle with radius 5', 'Find circumference given diameter'],
  },
];

// Grade 8 Standards
const GRADE_8_STANDARDS: MathStandard[] = [
  {
    code: '8.EE.A.1',
    title: 'Exponent Properties',
    description: 'Know and apply properties of integer exponents',
    gradeLevel: 8,
    domain: 'EE',
    examples: ['3² × 3⁵ = 3⁷', '(2³)² = 2⁶', '5⁰ = 1'],
  },
  {
    code: '8.EE.A.2',
    title: 'Square & Cube Roots',
    description: 'Use square root and cube root symbols',
    gradeLevel: 8,
    domain: 'EE',
    examples: ['√64 = 8', '∛27 = 3'],
  },
  {
    code: '8.EE.B.5',
    title: 'Graphing Proportional Relationships',
    description: 'Graph proportional relationships and interpret slope',
    gradeLevel: 8,
    domain: 'EE',
    examples: ['Compare two different proportional relationships'],
  },
  {
    code: '8.EE.B.6',
    title: 'Slope-Intercept Form',
    description: 'Use similar triangles to explain slope; derive y = mx + b',
    gradeLevel: 8,
    domain: 'EE',
    examples: ['Write equation of line with slope 2 and y-intercept 3'],
  },
  {
    code: '8.EE.C.7',
    title: 'Solving Linear Equations',
    description: 'Solve linear equations in one variable',
    gradeLevel: 8,
    domain: 'EE',
    examples: ['3x + 2 = 5x - 6', 'Equations with no solution or infinite solutions'],
  },
  {
    code: '8.EE.C.8',
    title: 'Systems of Equations',
    description: 'Solve systems of two linear equations',
    gradeLevel: 8,
    domain: 'EE',
    examples: ['y = 2x + 1 and y = -x + 7', 'Graphing and substitution methods'],
  },
  {
    code: '8.F.A.1',
    title: 'Understanding Functions',
    description: 'Understand that a function assigns exactly one output to each input',
    gradeLevel: 8,
    domain: 'F',
    examples: ['Is this relation a function?', 'Find f(3) given f(x) = 2x + 1'],
  },
  {
    code: '8.F.B.4',
    title: 'Linear Functions',
    description: 'Construct a function to model a linear relationship',
    gradeLevel: 8,
    domain: 'F',
    examples: ['Write a function for a real-world linear situation'],
  },
  {
    code: '8.G.B.7',
    title: 'Pythagorean Theorem',
    description: 'Apply the Pythagorean Theorem to find distances',
    gradeLevel: 8,
    domain: 'G',
    examples: ['Find the hypotenuse: a = 3, b = 4', 'Find distance between two points'],
  },
];

// High School Algebra Standards (commonly taught in 8th grade advanced or 9th)
const HS_ALGEBRA_STANDARDS: MathStandard[] = [
  {
    code: 'A.SSE.A.1',
    title: 'Interpreting Expressions',
    description: 'Interpret parts of an expression such as terms, factors, and coefficients',
    gradeLevel: 9,
    domain: 'A-SSE',
    examples: ['In 3x² + 5x - 2, identify the constant term'],
  },
  {
    code: 'A.SSE.A.2',
    title: 'Expression Structure',
    description: 'Use structure of expressions to identify ways to rewrite it',
    gradeLevel: 9,
    domain: 'A-SSE',
    examples: ['See x⁴ - y⁴ as (x²)² - (y²)²'],
  },
  {
    code: 'A.SSE.B.3',
    title: 'Factoring Quadratics',
    description: 'Factor quadratic expressions to reveal zeros',
    gradeLevel: 9,
    domain: 'A-SSE',
    examples: ['Factor x² + 5x + 6', 'Factor x² - 9'],
  },
  {
    code: 'A.REI.B.4',
    title: 'Solving Quadratics',
    description: 'Solve quadratic equations by factoring, completing square, quadratic formula',
    gradeLevel: 9,
    domain: 'A-REI',
    examples: ['Solve x² + 5x + 6 = 0', 'Use quadratic formula'],
  },
  {
    code: 'A.CED.A.1',
    title: 'Creating Equations',
    description: 'Create equations in one variable to solve problems',
    gradeLevel: 9,
    domain: 'A-CED',
    examples: ['Write an equation for: "Twice a number plus 5 equals 17"'],
  },
  {
    code: 'F.IF.C.7a',
    title: 'Graphing Linear & Quadratic',
    description: 'Graph linear and quadratic functions and show key features',
    gradeLevel: 9,
    domain: 'F-IF',
    examples: ['Graph y = x² - 4x + 3 and identify vertex, zeros'],
  },
  {
    code: 'F.BF.A.1',
    title: 'Building Functions',
    description: 'Write a function that describes a relationship',
    gradeLevel: 9,
    domain: 'F-BF',
    examples: ['Write a function for area of a square given side length'],
  },
];

// Domain name mappings
const DOMAIN_NAMES: Record<string, string> = {
  'OA': 'Operations & Algebraic Thinking',
  'NBT': 'Number & Operations in Base Ten',
  'NF': 'Number & Operations - Fractions',
  'G': 'Geometry',
  'RP': 'Ratios & Proportional Relationships',
  'NS': 'The Number System',
  'EE': 'Expressions & Equations',
  'F': 'Functions',
  'A-SSE': 'Seeing Structure in Expressions',
  'A-REI': 'Reasoning with Equations & Inequalities',
  'A-CED': 'Creating Equations',
  'F-IF': 'Interpreting Functions',
  'F-BF': 'Building Functions',
};

// All standards by grade
export const STANDARDS_BY_GRADE: Record<number, MathStandard[]> = {
  4: GRADE_4_STANDARDS,
  5: GRADE_5_STANDARDS,
  6: GRADE_6_STANDARDS,
  7: GRADE_7_STANDARDS,
  8: GRADE_8_STANDARDS,
  9: HS_ALGEBRA_STANDARDS,
};

/**
 * Get all standards for a specific grade level
 */
export function getStandardsForGrade(grade: number): MathStandard[] {
  return STANDARDS_BY_GRADE[grade] || [];
}

/**
 * Get standards organized by domain for a grade
 */
export function getStandardsByDomain(grade: number): StandardCategory[] {
  const standards = getStandardsForGrade(grade);
  const domains = new Map<string, MathStandard[]>();

  for (const std of standards) {
    if (!domains.has(std.domain)) {
      domains.set(std.domain, []);
    }
    domains.get(std.domain)!.push(std);
  }

  return Array.from(domains.entries()).map(([domain, stds]) => ({
    domain,
    domainName: DOMAIN_NAMES[domain] || domain,
    standards: stds,
  }));
}

/**
 * Get a specific standard by code
 */
export function getStandardByCode(code: string): MathStandard | null {
  for (const standards of Object.values(STANDARDS_BY_GRADE)) {
    const found = standards.find(s => s.code === code);
    if (found) return found;
  }
  return null;
}

/**
 * Search standards by keyword
 */
export function searchStandards(query: string, gradeFilter?: number): MathStandard[] {
  const lowerQuery = query.toLowerCase();
  let allStandards: MathStandard[] = [];

  if (gradeFilter) {
    allStandards = getStandardsForGrade(gradeFilter);
  } else {
    allStandards = Object.values(STANDARDS_BY_GRADE).flat();
  }

  return allStandards.filter(std =>
    std.code.toLowerCase().includes(lowerQuery) ||
    std.title.toLowerCase().includes(lowerQuery) ||
    std.description.toLowerCase().includes(lowerQuery) ||
    std.examples?.some(ex => ex.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all available grade levels
 */
export function getAvailableGrades(): number[] {
  return Object.keys(STANDARDS_BY_GRADE).map(Number).sort((a, b) => a - b);
}
