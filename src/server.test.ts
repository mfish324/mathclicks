import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validateAnswer, validateWithHintProgression } from './lib/answer-validation';

// We'll test the validation endpoints without starting the full server
// This avoids needing the Anthropic API key for tests

describe('API Endpoints (Unit)', () => {
  // Create a minimal test app with just the answer validation endpoint
  const app = express();
  app.use(express.json());

  app.post('/api/check-answer', (req, res) => {
    try {
      const { problem, studentAnswer, attemptNumber } = req.body;

      if (!problem || typeof studentAnswer !== 'string') {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const result = attemptNumber
        ? validateWithHintProgression(problem, studentAnswer, attemptNumber)
        : validateAnswer(problem, studentAnswer);

      let hintText: string | undefined;
      if (result.hint_to_show !== undefined && problem.hints?.[result.hint_to_show]) {
        hintText = problem.hints[result.hint_to_show];
      }

      res.json({
        correct: result.correct,
        feedback: result.feedback,
        error_type: result.error_type,
        hint_to_show: result.hint_to_show,
        hint_text: hintText,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal error' });
    }
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('POST /api/check-answer', () => {
    const validProblem = {
      id: 'test-1',
      tier: 1,
      problem_text: 'What is 2 + 2?',
      answer: '4',
      answer_type: 'integer',
      hints: ['Think about counting', 'Use your fingers', 'It rhymes with "door"'],
      solution_steps: ['2 + 2 = 4'],
    };

    it('returns 400 for missing problem', async () => {
      const response = await request(app)
        .post('/api/check-answer')
        .send({ studentAnswer: '4', attemptNumber: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing');
    });

    it('returns 400 for missing studentAnswer', async () => {
      const response = await request(app)
        .post('/api/check-answer')
        .send({ problem: validProblem, attemptNumber: 1 });

      expect(response.status).toBe(400);
    });

    it('validates correct answer', async () => {
      const response = await request(app)
        .post('/api/check-answer')
        .send({
          problem: validProblem,
          studentAnswer: '4',
          attemptNumber: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(true);
      expect(response.body.feedback).toBeTruthy();
    });

    it('validates incorrect answer with hint', async () => {
      const response = await request(app)
        .post('/api/check-answer')
        .send({
          problem: validProblem,
          studentAnswer: '5',
          attemptNumber: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(false);
      expect(response.body.hint_to_show).toBe(0);
      expect(response.body.hint_text).toBe('Think about counting');
    });

    it('progresses hints on subsequent attempts', async () => {
      const response1 = await request(app)
        .post('/api/check-answer')
        .send({
          problem: validProblem,
          studentAnswer: '5',
          attemptNumber: 2,
        });

      expect(response1.body.hint_to_show).toBe(1);
      expect(response1.body.hint_text).toBe('Use your fingers');

      const response2 = await request(app)
        .post('/api/check-answer')
        .send({
          problem: validProblem,
          studentAnswer: '5',
          attemptNumber: 3,
        });

      expect(response2.body.hint_to_show).toBe(2);
      expect(response2.body.hint_text).toBe('It rhymes with "door"');
    });

    it('handles expression equivalence', async () => {
      const expressionProblem = {
        ...validProblem,
        answer: '2x + 1',
        answer_type: 'expression',
      };

      const response = await request(app)
        .post('/api/check-answer')
        .send({
          problem: expressionProblem,
          studentAnswer: '1 + 2x',
          attemptNumber: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(true);
    });

    it('handles coordinate comparison', async () => {
      const coordinateProblem = {
        ...validProblem,
        answer: '(3, 4)',
        answer_type: 'coordinate',
      };

      const response = await request(app)
        .post('/api/check-answer')
        .send({
          problem: coordinateProblem,
          studentAnswer: '(3.0, 4.0)',
          attemptNumber: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.correct).toBe(true);
    });
  });
});

describe('Validation Edge Cases', () => {
  it('handles empty string answers', () => {
    const problem = {
      id: 'test',
      tier: 1,
      problem_text: 'Test',
      answer: '42',
      answer_type: 'integer' as const,
      hints: ['Hint'],
      solution_steps: ['Step'],
    };

    const result = validateAnswer(problem, '');
    expect(result.correct).toBe(false);
  });

  it('handles very long expressions', () => {
    const problem = {
      id: 'test',
      tier: 1,
      problem_text: 'Test',
      answer: 'x + x + x + x + x + x + x + x + x + x',
      answer_type: 'expression' as const,
      hints: ['Hint'],
      solution_steps: ['Step'],
    };

    const result = validateAnswer(problem, '10x');
    expect(result.correct).toBe(true);
  });

  it('handles special characters in answers', () => {
    const problem = {
      id: 'test',
      tier: 1,
      problem_text: 'Test',
      answer: '3.14159',
      answer_type: 'decimal' as const,
      hints: ['Hint'],
      solution_steps: ['Step'],
    };

    const result = validateAnswer(problem, '  3.14159  ');
    expect(result.correct).toBe(true);
  });
});
