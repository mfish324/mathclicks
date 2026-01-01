// MathClicks Core Pipeline
// Export all public APIs

export { initializeClient, getClient } from './api/claude-client';
export { MathClicksPipeline, createPipeline } from './pipeline';

export { extractMathContent, extractMathContentFromUrl } from './lib/image-extraction';

export {
  generateProblems,
  generateAdaptiveProblems,
  generateSingleProblem,
} from './lib/problem-generation';

export {
  validateAnswer,
  validateWithHintProgression,
  validateAnswers,
  isEquivalentAnswer,
} from './lib/answer-validation';

export * from './types';
