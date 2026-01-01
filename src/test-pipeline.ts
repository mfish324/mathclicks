/**
 * MathClicks Pipeline Test Runner
 *
 * Run with: npm run test:pipeline <image-path>
 *
 * Example: npm run test:pipeline ./test-images/equations.png
 */

import * as path from 'path';
import * as fs from 'fs';
import { config as loadEnv } from 'dotenv';
import { createPipeline } from './pipeline';
import { Problem } from './types';

// Load environment variables
loadEnv();

async function runTest(imagePath: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('Create a .env file with: ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  // Resolve image path
  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Image file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('MathClicks Pipeline Test');
  console.log('='.repeat(60));
  console.log(`Image: ${resolvedPath}`);
  console.log('');

  // Create and run pipeline
  const pipeline = createPipeline(apiKey, true);

  try {
    const result = await pipeline.processImage(resolvedPath, { count: 3 });

    if (!result.success) {
      console.error('\nPipeline failed:', result.error);
      process.exit(1);
    }

    // Display extraction results
    console.log('\n' + '='.repeat(60));
    console.log('EXTRACTION RESULTS');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result.extraction, null, 2));

    // Display generated problems
    console.log('\n' + '='.repeat(60));
    console.log('GENERATED PROBLEMS');
    console.log('='.repeat(60));

    if (result.problems) {
      for (const problem of result.problems.problems) {
        console.log(`\n--- Problem ${problem.id} (Tier ${problem.tier}) ---`);
        console.log(`Question: ${problem.problem_text}`);
        if (problem.problem_latex) {
          console.log(`LaTeX: ${problem.problem_latex}`);
        }
        console.log(`Answer: ${problem.answer} (${problem.answer_type})`);
        console.log(`Solution Steps:`);
        problem.solution_steps.forEach((step, i) => {
          console.log(`  ${i + 1}. ${step}`);
        });
        console.log(`Hints:`);
        problem.hints.forEach((hint, i) => {
          console.log(`  ${i + 1}. ${hint}`);
        });
        if (problem.common_mistakes?.length) {
          console.log(`Common Mistakes:`);
          problem.common_mistakes.forEach((mistake) => {
            console.log(`  - ${mistake}`);
          });
        }
      }

      // Test answer validation with first problem
      if (result.problems.problems.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('ANSWER VALIDATION TEST');
        console.log('='.repeat(60));

        const testProblem = result.problems.problems[0];
        console.log(`\nTesting problem: ${testProblem.problem_text}`);
        console.log(`Correct answer: ${testProblem.answer}`);

        // Test correct answer
        const correctResult = pipeline.checkAnswer(testProblem, testProblem.answer);
        console.log(`\nSubmitting correct answer "${testProblem.answer}":`);
        console.log(`  Correct: ${correctResult.correct}`);
        console.log(`  Feedback: ${correctResult.feedback}`);

        // Test wrong answer
        const wrongResult = pipeline.checkAnswer(testProblem, '999');
        console.log(`\nSubmitting wrong answer "999":`);
        console.log(`  Correct: ${wrongResult.correct}`);
        console.log(`  Feedback: ${wrongResult.feedback}`);
        console.log(`  Error type: ${wrongResult.error_type}`);
        if (wrongResult.hint_to_show !== undefined && testProblem.hints[wrongResult.hint_to_show]) {
          console.log(`  Hint: ${testProblem.hints[wrongResult.hint_to_show]}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\nError running pipeline:', error);
    process.exit(1);
  }
}

// Interactive answer testing mode
async function interactiveTest(imagePath: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const pipeline = createPipeline(apiKey, false);
  const result = await pipeline.processImage(imagePath, { tier: 3, count: 5 });

  if (!result.success || !result.problems) {
    console.error('Failed to process image');
    process.exit(1);
  }

  console.log('\nGenerated Problems:');
  result.problems.problems.forEach((p, i) => {
    console.log(`${i + 1}. ${p.problem_text}`);
  });

  // In a real app, this would be interactive
  // For now, just validate all problems with correct answers
  console.log('\nValidating all problems with correct answers:');
  result.problems.problems.forEach((problem) => {
    const validation = pipeline.checkAnswer(problem, problem.answer);
    console.log(`  ${problem.id}: ${validation.correct ? 'PASS' : 'FAIL'}`);
  });
}

// Main entry point
const args = process.argv.slice(2);
const imagePath = args[0];

if (!imagePath) {
  console.log('Usage: npm run test:pipeline <image-path>');
  console.log('');
  console.log('Options:');
  console.log('  npm run test:pipeline ./test-images/equations.png');
  console.log('  npm run test:pipeline ./my-whiteboard-photo.jpg');
  console.log('');
  console.log('Create test images by:');
  console.log('  1. Drawing equations in MS Paint and saving as PNG');
  console.log('  2. Taking a photo of a whiteboard');
  console.log('  3. Screenshotting online math content');
  process.exit(0);
}

runTest(imagePath);
