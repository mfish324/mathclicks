/**
 * Common Core Math Standards Reference (Frontend)
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

// Grade 4 Standards
const GRADE_4_STANDARDS: MathStandard[] = [
  { code: '4.OA.A.1', title: 'Multiplicative Comparisons', description: 'Interpret a multiplication equation as a comparison', gradeLevel: 4, domain: 'OA' },
  { code: '4.OA.A.2', title: 'Word Problems with Comparisons', description: 'Multiply or divide to solve word problems involving multiplicative comparison', gradeLevel: 4, domain: 'OA' },
  { code: '4.OA.B.4', title: 'Factors and Multiples', description: 'Find all factor pairs for whole numbers 1-100, recognize prime and composite', gradeLevel: 4, domain: 'OA' },
  { code: '4.NBT.B.4', title: 'Multi-digit Addition & Subtraction', description: 'Fluently add and subtract multi-digit whole numbers', gradeLevel: 4, domain: 'NBT' },
  { code: '4.NBT.B.5', title: 'Multi-digit Multiplication', description: 'Multiply a whole number up to four digits by a one-digit number', gradeLevel: 4, domain: 'NBT' },
  { code: '4.NF.A.1', title: 'Equivalent Fractions', description: 'Explain why fractions are equivalent using visual models', gradeLevel: 4, domain: 'NF' },
  { code: '4.NF.B.3', title: 'Adding & Subtracting Fractions', description: 'Add and subtract fractions with like denominators', gradeLevel: 4, domain: 'NF' },
  { code: '4.NF.C.6', title: 'Decimals and Fractions', description: 'Use decimal notation for fractions with denominators 10 or 100', gradeLevel: 4, domain: 'NF' },
];

// Grade 5 Standards
const GRADE_5_STANDARDS: MathStandard[] = [
  { code: '5.OA.A.1', title: 'Order of Operations', description: 'Use parentheses, brackets, and braces in numerical expressions', gradeLevel: 5, domain: 'OA' },
  { code: '5.NBT.B.5', title: 'Multi-digit Multiplication', description: 'Fluently multiply multi-digit whole numbers', gradeLevel: 5, domain: 'NBT' },
  { code: '5.NBT.B.6', title: 'Multi-digit Division', description: 'Find whole-number quotients with up to four-digit dividends', gradeLevel: 5, domain: 'NBT' },
  { code: '5.NBT.B.7', title: 'Decimal Operations', description: 'Add, subtract, multiply, and divide decimals to hundredths', gradeLevel: 5, domain: 'NBT' },
  { code: '5.NF.A.1', title: 'Adding Unlike Fractions', description: 'Add and subtract fractions with unlike denominators', gradeLevel: 5, domain: 'NF' },
  { code: '5.NF.B.4', title: 'Multiplying Fractions', description: 'Multiply a fraction by a whole number or another fraction', gradeLevel: 5, domain: 'NF' },
  { code: '5.NF.B.7', title: 'Dividing Fractions', description: 'Divide unit fractions by whole numbers and vice versa', gradeLevel: 5, domain: 'NF' },
  { code: '5.G.A.1', title: 'Coordinate Plane', description: 'Graph points on the coordinate plane to solve problems', gradeLevel: 5, domain: 'G' },
];

// Grade 6 Standards
const GRADE_6_STANDARDS: MathStandard[] = [
  { code: '6.RP.A.1', title: 'Ratios', description: 'Understand ratio concepts and use ratio language', gradeLevel: 6, domain: 'RP' },
  { code: '6.RP.A.2', title: 'Unit Rates', description: 'Understand unit rate and use rate language', gradeLevel: 6, domain: 'RP' },
  { code: '6.RP.A.3', title: 'Ratio & Rate Problems', description: 'Use ratio and rate reasoning to solve problems', gradeLevel: 6, domain: 'RP' },
  { code: '6.NS.A.1', title: 'Dividing Fractions', description: 'Interpret and compute quotients of fractions', gradeLevel: 6, domain: 'NS' },
  { code: '6.NS.B.3', title: 'Decimal Operations', description: 'Fluently add, subtract, multiply, and divide multi-digit decimals', gradeLevel: 6, domain: 'NS' },
  { code: '6.NS.C.6', title: 'Negative Numbers', description: 'Understand and plot positive and negative numbers', gradeLevel: 6, domain: 'NS' },
  { code: '6.EE.A.2', title: 'Writing Expressions', description: 'Write, read, and evaluate expressions with variables', gradeLevel: 6, domain: 'EE' },
  { code: '6.EE.B.7', title: 'One-Step Equations', description: 'Solve one-step equations of the form x + p = q', gradeLevel: 6, domain: 'EE' },
];

// Grade 7 Standards
const GRADE_7_STANDARDS: MathStandard[] = [
  { code: '7.RP.A.1', title: 'Unit Rates with Fractions', description: 'Compute unit rates with ratios of fractions', gradeLevel: 7, domain: 'RP' },
  { code: '7.RP.A.2', title: 'Proportional Relationships', description: 'Recognize and represent proportional relationships', gradeLevel: 7, domain: 'RP' },
  { code: '7.RP.A.3', title: 'Percent Problems', description: 'Solve multi-step percent problems (tax, tip, interest)', gradeLevel: 7, domain: 'RP' },
  { code: '7.NS.A.1', title: 'Adding & Subtracting Integers', description: 'Add and subtract rational numbers', gradeLevel: 7, domain: 'NS' },
  { code: '7.NS.A.2', title: 'Multiplying & Dividing Integers', description: 'Multiply and divide rational numbers', gradeLevel: 7, domain: 'NS' },
  { code: '7.EE.A.1', title: 'Combining Like Terms', description: 'Apply properties to add, subtract, factor expressions', gradeLevel: 7, domain: 'EE' },
  { code: '7.EE.B.4a', title: 'Two-Step Equations', description: 'Solve equations of the form px + q = r', gradeLevel: 7, domain: 'EE' },
  { code: '7.G.B.6', title: 'Area & Circumference', description: 'Solve problems involving area and circumference of circles', gradeLevel: 7, domain: 'G' },
];

// Grade 8 Standards
const GRADE_8_STANDARDS: MathStandard[] = [
  { code: '8.EE.A.1', title: 'Exponent Properties', description: 'Know and apply properties of integer exponents', gradeLevel: 8, domain: 'EE' },
  { code: '8.EE.A.2', title: 'Square & Cube Roots', description: 'Use square root and cube root symbols', gradeLevel: 8, domain: 'EE' },
  { code: '8.EE.B.5', title: 'Graphing Proportional Relationships', description: 'Graph proportional relationships and interpret slope', gradeLevel: 8, domain: 'EE' },
  { code: '8.EE.B.6', title: 'Slope-Intercept Form', description: 'Derive y = mx + b and understand slope', gradeLevel: 8, domain: 'EE' },
  { code: '8.EE.C.7', title: 'Solving Linear Equations', description: 'Solve linear equations in one variable', gradeLevel: 8, domain: 'EE' },
  { code: '8.EE.C.8', title: 'Systems of Equations', description: 'Solve systems of two linear equations', gradeLevel: 8, domain: 'EE' },
  { code: '8.F.A.1', title: 'Understanding Functions', description: 'Understand that a function assigns one output to each input', gradeLevel: 8, domain: 'F' },
  { code: '8.F.B.4', title: 'Linear Functions', description: 'Construct a function to model a linear relationship', gradeLevel: 8, domain: 'F' },
  { code: '8.G.B.7', title: 'Pythagorean Theorem', description: 'Apply the Pythagorean Theorem to find distances', gradeLevel: 8, domain: 'G' },
];

// High School Algebra (9th grade / advanced 8th)
const HS_ALGEBRA_STANDARDS: MathStandard[] = [
  { code: 'A.SSE.A.1', title: 'Interpreting Expressions', description: 'Interpret parts of an expression (terms, factors, coefficients)', gradeLevel: 9, domain: 'A-SSE' },
  { code: 'A.SSE.A.2', title: 'Expression Structure', description: 'Use structure of expressions to rewrite them', gradeLevel: 9, domain: 'A-SSE' },
  { code: 'A.SSE.B.3', title: 'Factoring Quadratics', description: 'Factor quadratic expressions to reveal zeros', gradeLevel: 9, domain: 'A-SSE' },
  { code: 'A.REI.B.4', title: 'Solving Quadratics', description: 'Solve quadratics by factoring, completing square, formula', gradeLevel: 9, domain: 'A-REI' },
  { code: 'A.CED.A.1', title: 'Creating Equations', description: 'Create equations in one variable to solve problems', gradeLevel: 9, domain: 'A-CED' },
  { code: 'F.IF.C.7a', title: 'Graphing Linear & Quadratic', description: 'Graph linear and quadratic functions with key features', gradeLevel: 9, domain: 'F-IF' },
  { code: 'F.BF.A.1', title: 'Building Functions', description: 'Write a function that describes a relationship', gradeLevel: 9, domain: 'F-BF' },
];

// All standards by grade
export const STANDARDS_BY_GRADE: Record<number, MathStandard[]> = {
  4: GRADE_4_STANDARDS,
  5: GRADE_5_STANDARDS,
  6: GRADE_6_STANDARDS,
  7: GRADE_7_STANDARDS,
  8: GRADE_8_STANDARDS,
  9: HS_ALGEBRA_STANDARDS,
};

// Domain display names
export const DOMAIN_NAMES: Record<string, string> = {
  'OA': 'Operations & Algebraic Thinking',
  'NBT': 'Number & Operations in Base Ten',
  'NF': 'Fractions',
  'G': 'Geometry',
  'RP': 'Ratios & Proportions',
  'NS': 'The Number System',
  'EE': 'Expressions & Equations',
  'F': 'Functions',
  'A-SSE': 'Expressions',
  'A-REI': 'Equations & Inequalities',
  'A-CED': 'Creating Equations',
  'F-IF': 'Interpreting Functions',
  'F-BF': 'Building Functions',
};

export function getStandardsForGrade(grade: number): MathStandard[] {
  return STANDARDS_BY_GRADE[grade] || [];
}

export function getAvailableGrades(): number[] {
  return [4, 5, 6, 7, 8, 9];
}

export function getGradeName(grade: number): string {
  if (grade === 9) return 'Algebra I';
  return `Grade ${grade}`;
}
