-- Add Algebra I graphing inequalities standard (used by grade 9 diagram problems)

INSERT INTO standards (code, title, description, grade_level, domain, domain_name, examples) VALUES
('A.REI.D.12', 'Graphing Linear Inequalities', 'Graph the solutions to a linear inequality in two variables as a half-plane, and graph the solution set to a system of linear inequalities', 9, 'A-REI', 'Reasoning with Equations & Inequalities', ARRAY['Graph y > x + 1', 'Find a point that satisfies both y ≥ x - 2 and y < -x + 4'])
ON CONFLICT (code) DO NOTHING;
