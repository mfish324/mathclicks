-- Seed Math Standards from math-standards.ts
-- Run this after schema.sql to populate the standards table

-- Domain name lookup (for reference)
-- OA = Operations & Algebraic Thinking
-- NBT = Number & Operations in Base Ten
-- NF = Number & Operations - Fractions
-- G = Geometry
-- RP = Ratios & Proportional Relationships
-- NS = The Number System
-- EE = Expressions & Equations
-- F = Functions
-- A-SSE = Seeing Structure in Expressions
-- A-REI = Reasoning with Equations & Inequalities
-- A-CED = Creating Equations
-- F-IF = Interpreting Functions
-- F-BF = Building Functions

-- Clear existing standards (for re-seeding)
TRUNCATE standards CASCADE;

-- ============================================
-- Grade 4 Standards
-- ============================================
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('4.OA.A.1', 'Multiplicative Comparisons', 'Interpret a multiplication equation as a comparison', 4, 'OA', 'Operations & Algebraic Thinking', ARRAY['35 = 5 × 7 means 35 is 5 times as many as 7']),
('4.OA.A.2', 'Word Problems with Comparisons', 'Multiply or divide to solve word problems involving multiplicative comparison', 4, 'OA', 'Operations & Algebraic Thinking', ARRAY['A red ribbon is 3 times as long as the blue ribbon. If the blue ribbon is 5 inches, how long is the red ribbon?']),
('4.OA.B.4', 'Factors and Multiples', 'Find all factor pairs for whole numbers 1-100, recognize prime and composite', 4, 'OA', 'Operations & Algebraic Thinking', ARRAY['Find all factors of 36', 'Is 17 prime or composite?']),
('4.NBT.B.4', 'Multi-digit Addition & Subtraction', 'Fluently add and subtract multi-digit whole numbers using standard algorithm', 4, 'NBT', 'Number & Operations in Base Ten', ARRAY['3,452 + 1,789', '5,000 - 2,347']),
('4.NBT.B.5', 'Multi-digit Multiplication', 'Multiply a whole number up to four digits by a one-digit number', 4, 'NBT', 'Number & Operations in Base Ten', ARRAY['2,345 × 6', '789 × 4']),
('4.NF.A.1', 'Equivalent Fractions', 'Explain why fractions are equivalent using visual models', 4, 'NF', 'Number & Operations - Fractions', ARRAY['Show why 1/2 = 2/4 = 3/6']),
('4.NF.B.3', 'Adding & Subtracting Fractions', 'Add and subtract fractions with like denominators', 4, 'NF', 'Number & Operations - Fractions', ARRAY['3/8 + 2/8', '5/6 - 1/6']),
('4.NF.C.6', 'Decimals and Fractions', 'Use decimal notation for fractions with denominators 10 or 100', 4, 'NF', 'Number & Operations - Fractions', ARRAY['Write 3/10 as a decimal', '0.62 = 62/100']);

-- ============================================
-- Grade 5 Standards
-- ============================================
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('5.OA.A.1', 'Order of Operations', 'Use parentheses, brackets, and braces in numerical expressions', 5, 'OA', 'Operations & Algebraic Thinking', ARRAY['Evaluate: 2 × (3 + 4)', '(6 + 2) × 5 - 3']),
('5.NBT.B.5', 'Multi-digit Multiplication', 'Fluently multiply multi-digit whole numbers using standard algorithm', 5, 'NBT', 'Number & Operations in Base Ten', ARRAY['234 × 56', '1,234 × 78']),
('5.NBT.B.6', 'Multi-digit Division', 'Find whole-number quotients with up to four-digit dividends and two-digit divisors', 5, 'NBT', 'Number & Operations in Base Ten', ARRAY['1,344 ÷ 24', '2,856 ÷ 34']),
('5.NBT.B.7', 'Decimal Operations', 'Add, subtract, multiply, and divide decimals to hundredths', 5, 'NBT', 'Number & Operations in Base Ten', ARRAY['3.45 + 2.7', '4.5 × 0.3', '7.2 ÷ 0.8']),
('5.NF.A.1', 'Adding Unlike Fractions', 'Add and subtract fractions with unlike denominators', 5, 'NF', 'Number & Operations - Fractions', ARRAY['1/3 + 1/4', '5/6 - 1/2']),
('5.NF.B.4', 'Multiplying Fractions', 'Multiply a fraction by a whole number or another fraction', 5, 'NF', 'Number & Operations - Fractions', ARRAY['3 × 2/5', '1/2 × 3/4']),
('5.NF.B.7', 'Dividing Fractions', 'Divide unit fractions by whole numbers and whole numbers by unit fractions', 5, 'NF', 'Number & Operations - Fractions', ARRAY['1/3 ÷ 4', '5 ÷ 1/2']),
('5.G.A.1', 'Coordinate Plane', 'Graph points on the coordinate plane to solve problems', 5, 'G', 'Geometry', ARRAY['Plot (3, 5) on the coordinate plane']);

-- ============================================
-- Grade 6 Standards
-- ============================================
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('6.RP.A.1', 'Ratios', 'Understand ratio concepts and use ratio language', 6, 'RP', 'Ratios & Proportional Relationships', ARRAY['The ratio of boys to girls is 3 to 2']),
('6.RP.A.2', 'Unit Rates', 'Understand unit rate and use rate language', 6, 'RP', 'Ratios & Proportional Relationships', ARRAY['If 12 apples cost $6, what is the cost per apple?']),
('6.RP.A.3', 'Ratio & Rate Problems', 'Use ratio and rate reasoning to solve problems', 6, 'RP', 'Ratios & Proportional Relationships', ARRAY['Percent problems', 'Unit rate comparisons', 'Equivalent ratios']),
('6.NS.A.1', 'Dividing Fractions', 'Interpret and compute quotients of fractions', 6, 'NS', 'The Number System', ARRAY['2/3 ÷ 3/4', 'How many 1/4 cups in 3/4 cup?']),
('6.NS.B.3', 'Decimal Operations', 'Fluently add, subtract, multiply, and divide multi-digit decimals', 6, 'NS', 'The Number System', ARRAY['12.34 × 5.6', '45.6 ÷ 1.2']),
('6.NS.C.6', 'Negative Numbers', 'Understand and plot positive and negative numbers on a number line', 6, 'NS', 'The Number System', ARRAY['Plot -3 and 3 on a number line', 'What is the opposite of -5?']),
('6.EE.A.2', 'Writing Expressions', 'Write, read, and evaluate expressions with variables', 6, 'EE', 'Expressions & Equations', ARRAY['Write an expression for "5 more than x"', 'Evaluate 3x + 2 when x = 4']),
('6.EE.B.7', 'One-Step Equations', 'Solve one-step equations of the form x + p = q and px = q', 6, 'EE', 'Expressions & Equations', ARRAY['x + 5 = 12', '3x = 15']);

-- ============================================
-- Grade 7 Standards
-- ============================================
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('7.RP.A.1', 'Unit Rates with Fractions', 'Compute unit rates with ratios of fractions', 7, 'RP', 'Ratios & Proportional Relationships', ARRAY['If 1/2 mile takes 1/4 hour, what is the speed in miles per hour?']),
('7.RP.A.2', 'Proportional Relationships', 'Recognize and represent proportional relationships', 7, 'RP', 'Ratios & Proportional Relationships', ARRAY['Is y = 3x proportional?', 'Find the constant of proportionality']),
('7.RP.A.3', 'Percent Problems', 'Solve multi-step percent problems', 7, 'RP', 'Ratios & Proportional Relationships', ARRAY['Tax and tip', 'Percent increase/decrease', 'Simple interest']),
('7.NS.A.1', 'Adding & Subtracting Integers', 'Add and subtract rational numbers (positive and negative)', 7, 'NS', 'The Number System', ARRAY['-3 + 7', '5 - (-2)', '-4 - 6']),
('7.NS.A.2', 'Multiplying & Dividing Integers', 'Multiply and divide rational numbers', 7, 'NS', 'The Number System', ARRAY['(-3) × 4', '(-12) ÷ (-3)', '(-2) × (-5)']),
('7.EE.A.1', 'Combining Like Terms', 'Apply properties to add, subtract, factor, and expand expressions', 7, 'EE', 'Expressions & Equations', ARRAY['3x + 5x', '2(x + 4)', '6x + 12 = 6(x + 2)']),
('7.EE.B.4a', 'Two-Step Equations', 'Solve word problems leading to equations of the form px + q = r', 7, 'EE', 'Expressions & Equations', ARRAY['2x + 5 = 17', '3x - 4 = 11']),
('7.G.B.6', 'Area & Circumference', 'Solve problems involving area, circumference of circles', 7, 'G', 'Geometry', ARRAY['Find the area of a circle with radius 5', 'Find circumference given diameter']);

-- ============================================
-- Grade 8 Standards
-- ============================================
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('8.EE.A.1', 'Exponent Properties', 'Know and apply properties of integer exponents', 8, 'EE', 'Expressions & Equations', ARRAY['3² × 3⁵ = 3⁷', '(2³)² = 2⁶', '5⁰ = 1']),
('8.EE.A.2', 'Square & Cube Roots', 'Use square root and cube root symbols', 8, 'EE', 'Expressions & Equations', ARRAY['√64 = 8', '∛27 = 3']),
('8.EE.B.5', 'Graphing Proportional Relationships', 'Graph proportional relationships and interpret slope', 8, 'EE', 'Expressions & Equations', ARRAY['Compare two different proportional relationships']),
('8.EE.B.6', 'Slope-Intercept Form', 'Use similar triangles to explain slope; derive y = mx + b', 8, 'EE', 'Expressions & Equations', ARRAY['Write equation of line with slope 2 and y-intercept 3']),
('8.EE.C.7', 'Solving Linear Equations', 'Solve linear equations in one variable', 8, 'EE', 'Expressions & Equations', ARRAY['3x + 2 = 5x - 6', 'Equations with no solution or infinite solutions']),
('8.EE.C.8', 'Systems of Equations', 'Solve systems of two linear equations', 8, 'EE', 'Expressions & Equations', ARRAY['y = 2x + 1 and y = -x + 7', 'Graphing and substitution methods']),
('8.F.A.1', 'Understanding Functions', 'Understand that a function assigns exactly one output to each input', 8, 'F', 'Functions', ARRAY['Is this relation a function?', 'Find f(3) given f(x) = 2x + 1']),
('8.F.B.4', 'Linear Functions', 'Construct a function to model a linear relationship', 8, 'F', 'Functions', ARRAY['Write a function for a real-world linear situation']),
('8.G.B.7', 'Pythagorean Theorem', 'Apply the Pythagorean Theorem to find distances', 8, 'G', 'Geometry', ARRAY['Find the hypotenuse: a = 3, b = 4', 'Find distance between two points']);

-- ============================================
-- High School Algebra Standards (Grade 9)
-- ============================================
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('A.SSE.A.1', 'Interpreting Expressions', 'Interpret parts of an expression such as terms, factors, and coefficients', 9, 'A-SSE', 'Seeing Structure in Expressions', ARRAY['In 3x² + 5x - 2, identify the constant term']),
('A.SSE.A.2', 'Expression Structure', 'Use structure of expressions to identify ways to rewrite it', 9, 'A-SSE', 'Seeing Structure in Expressions', ARRAY['See x⁴ - y⁴ as (x²)² - (y²)²']),
('A.SSE.B.3', 'Factoring Quadratics', 'Factor quadratic expressions to reveal zeros', 9, 'A-SSE', 'Seeing Structure in Expressions', ARRAY['Factor x² + 5x + 6', 'Factor x² - 9']),
('A.REI.B.4', 'Solving Quadratics', 'Solve quadratic equations by factoring, completing square, quadratic formula', 9, 'A-REI', 'Reasoning with Equations & Inequalities', ARRAY['Solve x² + 5x + 6 = 0', 'Use quadratic formula']),
('A.CED.A.1', 'Creating Equations', 'Create equations in one variable to solve problems', 9, 'A-CED', 'Creating Equations', ARRAY['Write an equation for: "Twice a number plus 5 equals 17"']),
('F.IF.C.7a', 'Graphing Linear & Quadratic', 'Graph linear and quadratic functions and show key features', 9, 'F-IF', 'Interpreting Functions', ARRAY['Graph y = x² - 4x + 3 and identify vertex, zeros']),
('F.BF.A.1', 'Building Functions', 'Write a function that describes a relationship', 9, 'F-BF', 'Building Functions', ARRAY['Write a function for area of a square given side length']);

-- ============================================
-- EngageNY Crosswalk (common mappings)
-- ============================================
-- Note: EngageNY uses module-lesson format like "G5-M3-L12" for Grade 5, Module 3, Lesson 12
-- This table maps those to CCSS standards

INSERT INTO standards_crosswalk (external_code, external_source, internal_standard_id, notes) VALUES
-- Grade 4 mappings
('G4-M1', 'engage_ny', (SELECT id FROM standards WHERE code = '4.NBT.B.4'), 'Grade 4 Module 1: Place Value and Multi-digit Operations'),
('G4-M3', 'engage_ny', (SELECT id FROM standards WHERE code = '4.OA.A.1'), 'Grade 4 Module 3: Multi-digit Multiplication'),
('G4-M5', 'engage_ny', (SELECT id FROM standards WHERE code = '4.NF.A.1'), 'Grade 4 Module 5: Fraction Equivalence'),
('G4-M6', 'engage_ny', (SELECT id FROM standards WHERE code = '4.NF.C.6'), 'Grade 4 Module 6: Decimal Fractions'),

-- Grade 5 mappings
('G5-M1', 'engage_ny', (SELECT id FROM standards WHERE code = '5.NBT.B.5'), 'Grade 5 Module 1: Place Value and Decimal Fractions'),
('G5-M2', 'engage_ny', (SELECT id FROM standards WHERE code = '5.NBT.B.6'), 'Grade 5 Module 2: Multi-digit Whole Number and Decimal Operations'),
('G5-M3', 'engage_ny', (SELECT id FROM standards WHERE code = '5.NF.A.1'), 'Grade 5 Module 3: Addition and Subtraction of Fractions'),
('G5-M4', 'engage_ny', (SELECT id FROM standards WHERE code = '5.NF.B.4'), 'Grade 5 Module 4: Multiplication and Division of Fractions'),
('G5-M6', 'engage_ny', (SELECT id FROM standards WHERE code = '5.G.A.1'), 'Grade 5 Module 6: Coordinate Plane'),

-- Grade 6 mappings
('G6-M1', 'engage_ny', (SELECT id FROM standards WHERE code = '6.RP.A.1'), 'Grade 6 Module 1: Ratios and Unit Rates'),
('G6-M2', 'engage_ny', (SELECT id FROM standards WHERE code = '6.NS.A.1'), 'Grade 6 Module 2: Arithmetic Operations'),
('G6-M3', 'engage_ny', (SELECT id FROM standards WHERE code = '6.NS.C.6'), 'Grade 6 Module 3: Rational Numbers'),
('G6-M4', 'engage_ny', (SELECT id FROM standards WHERE code = '6.EE.A.2'), 'Grade 6 Module 4: Expressions and Equations'),

-- Grade 7 mappings
('G7-M1', 'engage_ny', (SELECT id FROM standards WHERE code = '7.RP.A.1'), 'Grade 7 Module 1: Ratios and Proportional Relationships'),
('G7-M2', 'engage_ny', (SELECT id FROM standards WHERE code = '7.NS.A.1'), 'Grade 7 Module 2: Rational Numbers'),
('G7-M3', 'engage_ny', (SELECT id FROM standards WHERE code = '7.EE.A.1'), 'Grade 7 Module 3: Expressions and Equations'),
('G7-M4', 'engage_ny', (SELECT id FROM standards WHERE code = '7.RP.A.3'), 'Grade 7 Module 4: Percent and Proportional Relationships'),

-- Grade 8 mappings
('G8-M1', 'engage_ny', (SELECT id FROM standards WHERE code = '8.EE.A.1'), 'Grade 8 Module 1: Integer Exponents'),
('G8-M4', 'engage_ny', (SELECT id FROM standards WHERE code = '8.EE.B.6'), 'Grade 8 Module 4: Linear Equations'),
('G8-M5', 'engage_ny', (SELECT id FROM standards WHERE code = '8.F.A.1'), 'Grade 8 Module 5: Functions'),
('G8-M7', 'engage_ny', (SELECT id FROM standards WHERE code = '8.G.B.7'), 'Grade 8 Module 7: Pythagorean Theorem');

-- Verify insertion
SELECT grade_level, COUNT(*) as count FROM standards GROUP BY grade_level ORDER BY grade_level;
