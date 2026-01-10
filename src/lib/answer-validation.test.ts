import { describe, it, expect } from 'vitest';
import { validateAnswer, validateWithHintProgression, isEquivalentAnswer } from './answer-validation';
import { Problem } from '../types';

// Helper to create a test problem
function createProblem(
  answer: string,
  answerType: Problem['answer_type'],
  hints: string[] = ['Hint 1', 'Hint 2', 'Hint 3']
): Problem {
  return {
    id: 'test-problem',
    tier: 1,
    problem_text: 'Test problem',
    answer,
    answer_type: answerType,
    hints,
    solution_steps: ['Step 1'],
  };
}

describe('Answer Validation', () => {
  describe('Integer answers', () => {
    const problem = createProblem('42', 'integer');

    it('accepts exact match', () => {
      const result = validateAnswer(problem, '42');
      expect(result.correct).toBe(true);
    });

    it('accepts match with spaces', () => {
      const result = validateAnswer(problem, ' 42 ');
      expect(result.correct).toBe(true);
    });

    it('rejects incorrect answer', () => {
      const result = validateAnswer(problem, '43');
      expect(result.correct).toBe(false);
    });

    it('handles negative numbers', () => {
      const negativeProblem = createProblem('-7', 'integer');
      expect(validateAnswer(negativeProblem, '-7').correct).toBe(true);
      expect(validateAnswer(negativeProblem, '7').correct).toBe(false);
    });
  });

  describe('Decimal answers', () => {
    const problem = createProblem('3.14', 'decimal');

    it('accepts exact match', () => {
      const result = validateAnswer(problem, '3.14');
      expect(result.correct).toBe(true);
    });

    it('accepts equivalent decimals', () => {
      expect(validateAnswer(problem, '3.140').correct).toBe(true);
      expect(validateAnswer(problem, '3.1400').correct).toBe(true);
    });

    it('accepts values within tolerance', () => {
      expect(validateAnswer(problem, '3.1401').correct).toBe(true);
      expect(validateAnswer(problem, '3.1399').correct).toBe(true);
    });

    it('rejects values outside tolerance', () => {
      expect(validateAnswer(problem, '3.15').correct).toBe(false);
      expect(validateAnswer(problem, '3.13').correct).toBe(false);
    });
  });

  describe('Fraction answers', () => {
    const problem = createProblem('1/2', 'fraction');

    it('accepts exact match', () => {
      expect(validateAnswer(problem, '1/2').correct).toBe(true);
    });

    it('accepts equivalent fractions', () => {
      expect(validateAnswer(problem, '2/4').correct).toBe(true);
      expect(validateAnswer(problem, '3/6').correct).toBe(true);
      expect(validateAnswer(problem, '50/100').correct).toBe(true);
    });

    it('accepts decimal equivalent', () => {
      expect(validateAnswer(problem, '0.5').correct).toBe(true);
    });

    it('handles negative fractions', () => {
      const negativeProblem = createProblem('-3/4', 'fraction');
      expect(validateAnswer(negativeProblem, '-3/4').correct).toBe(true);
      expect(validateAnswer(negativeProblem, '-0.75').correct).toBe(true);
    });
  });

  describe('Mixed number answers', () => {
    it('accepts mixed number format "1 1/2"', () => {
      const problem = createProblem('1 1/2', 'fraction');
      expect(validateAnswer(problem, '1 1/2').correct).toBe(true);
    });

    it('accepts decimal equivalent of mixed number', () => {
      const problem = createProblem('1 1/2', 'fraction');
      expect(validateAnswer(problem, '1.5').correct).toBe(true);
    });

    it('accepts improper fraction equivalent of mixed number', () => {
      const problem = createProblem('1 1/2', 'fraction');
      expect(validateAnswer(problem, '3/2').correct).toBe(true);
    });

    it('handles larger mixed numbers', () => {
      const problem = createProblem('2 3/4', 'fraction');
      expect(validateAnswer(problem, '2 3/4').correct).toBe(true);
      expect(validateAnswer(problem, '2.75').correct).toBe(true);
      expect(validateAnswer(problem, '11/4').correct).toBe(true);
    });

    it('handles negative mixed numbers', () => {
      const problem = createProblem('-2 1/4', 'fraction');
      expect(validateAnswer(problem, '-2 1/4').correct).toBe(true);
      expect(validateAnswer(problem, '-2.25').correct).toBe(true);
      expect(validateAnswer(problem, '-9/4').correct).toBe(true);
    });

    it('does not confuse mixed numbers with simple fractions', () => {
      // "11/2" should be 5.5, not confused with "1 1/2" = 1.5
      const problem = createProblem('11/2', 'fraction');
      expect(validateAnswer(problem, '5.5').correct).toBe(true);
      expect(validateAnswer(problem, '1.5').correct).toBe(false);
    });

    it('accepts mixed number when answer is decimal', () => {
      const problem = createProblem('1.5', 'decimal');
      expect(validateAnswer(problem, '1 1/2').correct).toBe(true);
    });

    it('accepts mixed number when answer is improper fraction', () => {
      const problem = createProblem('3/2', 'fraction');
      expect(validateAnswer(problem, '1 1/2').correct).toBe(true);
    });
  });

  describe('Repeating decimal tolerance', () => {
    it('accepts reasonable decimal approximations for 1/3', () => {
      const problem = createProblem('1/3', 'fraction');
      expect(validateAnswer(problem, '0.333').correct).toBe(true);
      expect(validateAnswer(problem, '0.33').correct).toBe(true);
    });

    it('accepts reasonable decimal approximations for 2/3', () => {
      const problem = createProblem('2/3', 'fraction');
      expect(validateAnswer(problem, '0.667').correct).toBe(true);
      expect(validateAnswer(problem, '0.67').correct).toBe(true);
    });

    it('accepts reasonable decimal approximations for 1/6', () => {
      const problem = createProblem('1/6', 'fraction');
      expect(validateAnswer(problem, '0.167').correct).toBe(true);
      expect(validateAnswer(problem, '0.17').correct).toBe(true);
    });

    it('still rejects clearly wrong approximations', () => {
      const problem = createProblem('1/3', 'fraction');
      expect(validateAnswer(problem, '0.4').correct).toBe(false);
      expect(validateAnswer(problem, '0.3').correct).toBe(false);
    });
  });

  describe('Coordinate answers', () => {
    const problem = createProblem('(3, 4)', 'coordinate');

    it('accepts exact match', () => {
      expect(validateAnswer(problem, '(3, 4)').correct).toBe(true);
    });

    it('accepts match without spaces', () => {
      expect(validateAnswer(problem, '(3,4)').correct).toBe(true);
    });

    it('accepts match with extra spaces', () => {
      expect(validateAnswer(problem, '( 3 , 4 )').correct).toBe(true);
    });

    it('accepts match without parentheses', () => {
      expect(validateAnswer(problem, '3, 4').correct).toBe(true);
    });

    it('accepts numeric equivalents', () => {
      const decimalProblem = createProblem('(3.0, 4.0)', 'coordinate');
      expect(validateAnswer(decimalProblem, '(3, 4)').correct).toBe(true);
    });

    it('accepts values within tolerance', () => {
      expect(validateAnswer(problem, '(3.0005, 4.0005)').correct).toBe(true);
    });

    it('rejects reversed coordinates', () => {
      expect(validateAnswer(problem, '(4, 3)').correct).toBe(false);
    });

    it('handles negative coordinates', () => {
      const negativeProblem = createProblem('(-2, 5)', 'coordinate');
      expect(validateAnswer(negativeProblem, '(-2, 5)').correct).toBe(true);
      expect(validateAnswer(negativeProblem, '(2, 5)').correct).toBe(false);
    });

    it('handles fraction coordinates', () => {
      const fractionProblem = createProblem('(1/2, 3/4)', 'coordinate');
      expect(validateAnswer(fractionProblem, '(0.5, 0.75)').correct).toBe(true);
    });
  });

  describe('Expression answers', () => {
    describe('basic equivalence', () => {
      const problem = createProblem('2x + 1', 'expression');

      it('accepts exact match', () => {
        expect(validateAnswer(problem, '2x + 1').correct).toBe(true);
      });

      it('accepts match without spaces', () => {
        expect(validateAnswer(problem, '2x+1').correct).toBe(true);
      });

      it('accepts commutative equivalent', () => {
        expect(validateAnswer(problem, '1 + 2x').correct).toBe(true);
      });

      it('rejects different expression', () => {
        expect(validateAnswer(problem, '2x + 2').correct).toBe(false);
        expect(validateAnswer(problem, '3x + 1').correct).toBe(false);
      });
    });

    describe('combining like terms', () => {
      it('recognizes combined terms', () => {
        const problem = createProblem('3x + 2x', 'expression');
        expect(validateAnswer(problem, '5x').correct).toBe(true);
      });

      it('recognizes expanded terms', () => {
        const problem = createProblem('5x', 'expression');
        expect(validateAnswer(problem, '3x + 2x').correct).toBe(true);
        expect(validateAnswer(problem, 'x + x + x + x + x').correct).toBe(true);
      });

      it('handles constants', () => {
        const problem = createProblem('x + x + 1', 'expression');
        expect(validateAnswer(problem, '2x + 1').correct).toBe(true);
      });
    });

    describe('sign handling', () => {
      it('handles negative terms', () => {
        const problem = createProblem('-x + 5', 'expression');
        expect(validateAnswer(problem, '5 - x').correct).toBe(true);
      });

      it('handles subtraction', () => {
        const problem = createProblem('x - 3', 'expression');
        expect(validateAnswer(problem, '-3 + x').correct).toBe(true);
      });
    });

    describe('powers and exponents', () => {
      it('handles quadratic terms', () => {
        const problem = createProblem('x^2 + 2x + 1', 'expression');
        expect(validateAnswer(problem, '2x + x^2 + 1').correct).toBe(true);
        expect(validateAnswer(problem, '1 + 2x + x^2').correct).toBe(true);
      });

      it('distinguishes different powers', () => {
        const problem = createProblem('x^2 + 1', 'expression');
        expect(validateAnswer(problem, 'x^3 + 1').correct).toBe(false);
      });
    });

    describe('multiple variables', () => {
      it('handles multiple variables', () => {
        const problem = createProblem('2x + 3y', 'expression');
        expect(validateAnswer(problem, '3y + 2x').correct).toBe(true);
      });

      it('keeps variables separate', () => {
        const problem = createProblem('x + y', 'expression');
        expect(validateAnswer(problem, '2x').correct).toBe(false);
      });
    });
  });

  describe('Multiple choice answers', () => {
    const problem = createProblem('B', 'multiple_choice');

    it('accepts exact match', () => {
      expect(validateAnswer(problem, 'B').correct).toBe(true);
    });

    it('is case insensitive', () => {
      expect(validateAnswer(problem, 'b').correct).toBe(true);
    });

    it('rejects incorrect choice', () => {
      expect(validateAnswer(problem, 'A').correct).toBe(false);
      expect(validateAnswer(problem, 'C').correct).toBe(false);
    });
  });

  describe('True/False answers', () => {
    const trueProblem = createProblem('true', 'true_false');
    const falseProblem = createProblem('false', 'true_false');

    it('accepts exact match', () => {
      expect(validateAnswer(trueProblem, 'true').correct).toBe(true);
      expect(validateAnswer(falseProblem, 'false').correct).toBe(true);
    });

    it('is case insensitive', () => {
      expect(validateAnswer(trueProblem, 'TRUE').correct).toBe(true);
      expect(validateAnswer(trueProblem, 'True').correct).toBe(true);
    });

    it('rejects incorrect answer', () => {
      expect(validateAnswer(trueProblem, 'false').correct).toBe(false);
      expect(validateAnswer(falseProblem, 'true').correct).toBe(false);
    });
  });

  describe('Acceptable answers', () => {
    it('accepts any of the acceptable answers', () => {
      const problem: Problem = {
        ...createProblem('1/2', 'fraction'),
        acceptable_answers: ['0.5', '50%', '.5'],
      };

      expect(validateAnswer(problem, '1/2').correct).toBe(true);
      expect(validateAnswer(problem, '0.5').correct).toBe(true);
      expect(validateAnswer(problem, '50%').correct).toBe(true);
      expect(validateAnswer(problem, '.5').correct).toBe(true);
    });
  });

  describe('Error type detection', () => {
    it('detects sign errors', () => {
      const problem = createProblem('5', 'integer');
      const result = validateAnswer(problem, '-5');
      expect(result.correct).toBe(false);
      expect(result.error_type).toBe('sign_error');
    });

    it('detects arithmetic errors (double/half)', () => {
      const problem = createProblem('10', 'integer');
      const result = validateAnswer(problem, '20');
      expect(result.correct).toBe(false);
      expect(result.error_type).toBe('arithmetic_error');
    });
  });

  describe('Feedback generation', () => {
    it('provides positive feedback for correct answers', () => {
      const problem = createProblem('42', 'integer');
      const result = validateAnswer(problem, '42');
      expect(result.correct).toBe(true);
      expect(result.feedback).toBeTruthy();
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('provides helpful feedback for incorrect answers', () => {
      const problem = createProblem('42', 'integer');
      const result = validateAnswer(problem, '43');
      expect(result.correct).toBe(false);
      expect(result.feedback).toBeTruthy();
    });
  });
});

describe('Hint Progression', () => {
  const problem = createProblem('42', 'integer', ['Hint 1', 'Hint 2', 'Hint 3']);

  it('shows first hint on first attempt', () => {
    const result = validateWithHintProgression(problem, '41', 1);
    expect(result.correct).toBe(false);
    expect(result.hint_to_show).toBe(0);
  });

  it('progresses hints with attempts', () => {
    expect(validateWithHintProgression(problem, '41', 2).hint_to_show).toBe(1);
    expect(validateWithHintProgression(problem, '41', 3).hint_to_show).toBe(2);
  });

  it('caps at last hint', () => {
    expect(validateWithHintProgression(problem, '41', 4).hint_to_show).toBe(2);
    expect(validateWithHintProgression(problem, '41', 10).hint_to_show).toBe(2);
  });

  it('does not show hints for correct answers', () => {
    const result = validateWithHintProgression(problem, '42', 1);
    expect(result.correct).toBe(true);
    expect(result.hint_to_show).toBeUndefined();
  });
});

describe('isEquivalentAnswer', () => {
  it('checks equivalence for expressions', () => {
    expect(isEquivalentAnswer('2x + 1', '1 + 2x', 'expression')).toBe(true);
    expect(isEquivalentAnswer('2x + 1', '2x + 2', 'expression')).toBe(false);
  });

  it('checks equivalence for coordinates', () => {
    expect(isEquivalentAnswer('(3, 4)', '(3,4)', 'coordinate')).toBe(true);
    expect(isEquivalentAnswer('(3, 4)', '(4, 3)', 'coordinate')).toBe(false);
  });

  it('checks equivalence for fractions', () => {
    expect(isEquivalentAnswer('1/2', '2/4', 'fraction')).toBe(true);
    expect(isEquivalentAnswer('1/2', '0.5', 'fraction')).toBe(true);
  });
});
