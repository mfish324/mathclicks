/**
 * Quick test for answer validation improvements
 */

import { validateAnswer } from './lib/answer-validation';
import { Problem } from './types';

function createProblem(answer: string, answerType: Problem['answer_type']): Problem {
  return {
    id: 'test',
    tier: 1,
    problem_text: 'Test question',
    answer,
    answer_type: answerType,
    hints: ['hint 1'],
    solution_steps: ['step 1'],
  };
}

function test(name: string, result: boolean, expected: boolean = true) {
  const status = result === expected ? '✓' : '✗';
  console.log(`${status} ${name}: ${result} (expected ${expected})`);
}

console.log('=== Coordinate Comparison Tests ===\n');

// Coordinate tests
const coordProblem = createProblem('(3.0, 4.0)', 'coordinate');
test('(3, 4) matches (3.0, 4.0)', validateAnswer(coordProblem, '(3, 4)').correct);
test('(3.0001, 4) matches with tolerance', validateAnswer(coordProblem, '(3.0001, 4)').correct);
test('( 3 , 4 ) matches with spaces', validateAnswer(coordProblem, '( 3 , 4 )').correct);
test('(4, 3) does NOT match (reversed)', validateAnswer(coordProblem, '(4, 3)').correct, false);
test('3, 4 matches without parens', validateAnswer(coordProblem, '3, 4').correct);

const fracCoord = createProblem('(1/2, 3/4)', 'coordinate');
test('(0.5, 0.75) matches fraction coord', validateAnswer(fracCoord, '(0.5, 0.75)').correct);

console.log('\n=== Expression Equivalence Tests ===\n');

// Basic commutativity
const expr1 = createProblem('2x + 1', 'expression');
test('2x + 1 = 2x + 1 (identical)', validateAnswer(expr1, '2x + 1').correct);
test('1 + 2x = 2x + 1 (commutative)', validateAnswer(expr1, '1 + 2x').correct);
test('2x+1 = 2x + 1 (no spaces)', validateAnswer(expr1, '2x+1').correct);

// Combining like terms
const expr2 = createProblem('3x + 2x', 'expression');
test('5x = 3x + 2x (combined)', validateAnswer(expr2, '5x').correct);

const expr3 = createProblem('x + x + 1', 'expression');
test('2x + 1 = x + x + 1', validateAnswer(expr3, '2x + 1').correct);

// Sign handling
const expr4 = createProblem('-x + 5', 'expression');
test('5 - x = -x + 5', validateAnswer(expr4, '5 - x').correct);

// Powers
const expr5 = createProblem('x^2 + 2x + 1', 'expression');
test('2x + x^2 + 1 = x^2 + 2x + 1 (reordered)', validateAnswer(expr5, '2x + x^2 + 1').correct);
test('1 + 2x + x^2 = x^2 + 2x + 1', validateAnswer(expr5, '1 + 2x + x^2').correct);

// Multiple variables
const expr6 = createProblem('2x + 3y', 'expression');
test('3y + 2x = 2x + 3y', validateAnswer(expr6, '3y + 2x').correct);

console.log('\n=== Negative Tests (should NOT match) ===\n');

test('2x + 2 ≠ 2x + 1', validateAnswer(expr1, '2x + 2').correct, false);
test('3x + 1 ≠ 2x + 1', validateAnswer(expr1, '3x + 1').correct, false);
test('x^3 + 2x + 1 ≠ x^2 + 2x + 1', validateAnswer(expr5, 'x^3 + 2x + 1').correct, false);

console.log('\n=== Done ===');
