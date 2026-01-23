-- Delete diagram problems that were imported without proper standard links
DELETE FROM problems
WHERE diagram_type IS NOT NULL
AND primary_standard_id IS NULL;
