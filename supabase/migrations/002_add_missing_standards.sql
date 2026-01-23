-- Add missing standards used by diagram problems

-- Grade 4 MD (Measurement & Data) standards
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('4.MD.A.3', 'Area and Perimeter', 'Apply the area and perimeter formulas for rectangles in real world and mathematical problems', 4, 'MD', 'Measurement & Data', ARRAY['Find the area of a rectangle with length 8 and width 3', 'Find the perimeter of a 5x7 rectangle']),
('4.MD.C.5', 'Angles', 'Recognize angles as geometric shapes formed where two rays share a common endpoint', 4, 'MD', 'Measurement & Data', ARRAY['Identify a 90 degree angle', 'Measure angles using a protractor'])
ON CONFLICT (code) DO NOTHING;

-- Grade 4 OA (Operations & Algebraic Thinking) - add missing
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('4.OA.A.3', 'Multi-step Word Problems', 'Solve multistep word problems posed with whole numbers using the four operations', 4, 'OA', 'Operations & Algebraic Thinking', ARRAY['A store has 45 apples. They sell 12, then get 28 more. How many do they have now?'])
ON CONFLICT (code) DO NOTHING;

-- Grade 6 G (Geometry) standards
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('6.G.A.1', 'Area of Polygons', 'Find the area of triangles, quadrilaterals, and polygons by composing and decomposing into rectangles and triangles', 6, 'G', 'Geometry', ARRAY['Find the area of a triangle with base 6 and height 8'])
ON CONFLICT (code) DO NOTHING;

-- Grade 8 F (Functions) standards
INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('8.F.B.4', 'Linear Functions', 'Construct a function to model a linear relationship between two quantities', 8, 'F', 'Functions', ARRAY['Write the equation of a line with slope 2 and y-intercept -1'])
ON CONFLICT (code) DO NOTHING;
