-- Add Algebra I (Grade 9) standards missing from the original seed

INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('A.REI.B.3', 'Linear Equations & Inequalities', 'Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters', 9, 'A-REI', 'Reasoning with Equations & Inequalities', ARRAY['Solve 3x + 7 = 22', 'Solve -2x + 5 < 11']),
('A.REI.C.6', 'Systems of Linear Equations', 'Solve systems of linear equations exactly and approximately, focusing on pairs of linear equations in two variables', 9, 'A-REI', 'Reasoning with Equations & Inequalities', ARRAY['Solve y = 2x + 1 and y = -x + 7', 'Solve x + y = 10 and x - y = 4']),
('A.APR.A.1', 'Polynomial Operations', 'Add, subtract, and multiply polynomials', 9, 'A-APR', 'Arithmetic with Polynomials & Rational Expressions', ARRAY['Simplify (3x² + 2x) + (x² - 5x)', 'Multiply (x + 3)(x - 5)']),
('N.RN.A.2', 'Radicals & Rational Exponents', 'Rewrite expressions involving radicals and rational exponents using the properties of exponents', 9, 'N-RN', 'The Real Number System', ARRAY['Evaluate 8^(2/3)', 'Simplify √50']),
('F.IF.A.2', 'Function Notation', 'Use function notation, evaluate functions for inputs in their domains, and interpret statements that use function notation', 9, 'F-IF', 'Interpreting Functions', ARRAY['If f(x) = 3x - 2, find f(4)', 'If f(x) = 2x + 1 and f(a) = 9, find a']),
('F.IF.B.6', 'Average Rate of Change', 'Calculate and interpret the average rate of change of a function over a specified interval', 9, 'F-IF', 'Interpreting Functions', ARRAY['Find the average rate of change of f(x) = x² from x = 1 to x = 3']),
('F.LE.A.2', 'Linear & Exponential Models', 'Construct linear and exponential functions given a graph, a description of a relationship, or input-output pairs', 9, 'F-LE', 'Linear, Quadratic & Exponential Models', ARRAY['A population doubles every year starting at 50. Write the function.']),
('S.ID.C.7', 'Interpreting Linear Models', 'Interpret the slope and intercept of a linear model in the context of the data', 9, 'S-ID', 'Interpreting Categorical & Quantitative Data', ARRAY['In C = 15h + 40, what does 15 represent?'])
ON CONFLICT (code) DO NOTHING;
