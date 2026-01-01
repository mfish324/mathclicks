/**
 * MathClicks Pipeline
 *
 * Complete image-to-problems pipeline that:
 * 1. Takes an image of math content
 * 2. Extracts mathematical concepts
 * 3. Generates practice problems at various difficulty levels
 * 4. Provides answer validation
 */

import { initializeClient } from './api/claude-client';
import { extractMathContent } from './lib/image-extraction';
import { generateProblems, generateAdaptiveProblems } from './lib/problem-generation';
import { validateAnswer, validateWithHintProgression } from './lib/answer-validation';
import {
  PipelineConfig,
  ImageExtractionResult,
  ProblemSet,
  Problem,
  ValidationResult,
  isExtractionError,
  GenerationOptions,
} from './types';

export interface PipelineResult {
  success: boolean;
  extraction?: ImageExtractionResult;
  problems?: ProblemSet;
  error?: string;
}

export class MathClicksPipeline {
  private initialized: boolean = false;
  private lastExtraction: ImageExtractionResult | null = null;

  constructor(private config: PipelineConfig) {}

  /**
   * Initialize the pipeline with API credentials
   */
  initialize(): void {
    initializeClient(this.config);
    this.initialized = true;
  }

  /**
   * Process an image and generate problems
   */
  async processImage(
    imagePath: string,
    options?: Partial<GenerationOptions>
  ): Promise<PipelineResult> {
    if (!this.initialized) {
      this.initialize();
    }

    // Step 1: Extract math content from image
    console.log('Step 1: Extracting math content from image...');
    const extraction = await extractMathContent(imagePath);

    if (isExtractionError(extraction)) {
      return {
        success: false,
        error: extraction.message,
      };
    }

    this.lastExtraction = extraction;
    console.log(`  Topic: ${extraction.topic}`);
    console.log(`  Grade Level: ${extraction.grade_level}`);
    console.log(`  Subtopics: ${extraction.subtopics.join(', ')}`);

    // Step 2: Generate problems
    console.log('\nStep 2: Generating practice problems...');

    let problems: ProblemSet;

    if (options?.tier) {
      // Generate for specific tier
      problems = await generateProblems(extraction, {
        tier: options.tier,
        count: options.count || 5,
        includeHints: true,
        includeCommonMistakes: true,
      });
    } else {
      // Generate adaptive problem set (all tiers)
      problems = await generateAdaptiveProblems(extraction, options?.count || 3);
    }

    console.log(`  Generated ${problems.problems.length} problems`);

    return {
      success: true,
      extraction,
      problems,
    };
  }

  /**
   * Validate a student's answer
   */
  checkAnswer(problem: Problem, studentAnswer: string): ValidationResult {
    return validateAnswer(problem, studentAnswer);
  }

  /**
   * Validate with hint progression for multiple attempts
   */
  checkAnswerWithHints(
    problem: Problem,
    studentAnswer: string,
    attemptNumber: number
  ): ValidationResult {
    return validateWithHintProgression(problem, studentAnswer, attemptNumber);
  }

  /**
   * Get the last extraction result (useful for re-generating problems)
   */
  getLastExtraction(): ImageExtractionResult | null {
    return this.lastExtraction;
  }

  /**
   * Generate additional problems from the last extraction
   */
  async generateMore(options: GenerationOptions): Promise<ProblemSet | null> {
    if (!this.lastExtraction) {
      console.error('No previous extraction. Call processImage first.');
      return null;
    }

    return generateProblems(this.lastExtraction, options);
  }
}

// Factory function for easy instantiation
export function createPipeline(apiKey: string, debug: boolean = false): MathClicksPipeline {
  return new MathClicksPipeline({
    apiKey,
    debug,
  });
}
