import { v4 as uuidv4 } from 'uuid';
import { getClient, getModel, getConfig } from '../api/claude-client';
import {
  ImageExtractionResult,
  Problem,
  ProblemSet,
  ProblemSchema,
  GenerationOptions,
} from '../types';
import { z } from 'zod';

const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: 'Below grade level, single-step problems. Use simple whole numbers. Very straightforward.',
  2: 'Below grade level, simple two-step problems. Use small whole numbers.',
  3: 'Grade level appropriate. Match the complexity shown in the lesson. Standard difficulty.',
  4: 'Above grade level, more complex. Add extra steps or larger numbers. Requires careful thinking.',
  5: 'Challenge level, multi-step problems. Combine concepts. May require multiple strategies.',
};

function buildGenerationPrompt(
  extraction: ImageExtractionResult,
  options: GenerationOptions
): string {
  const { tier, count, includeHints = true, includeCommonMistakes = true } = options;

  const contentSummary = [];
  if (extraction.extracted_content.equations?.length) {
    contentSummary.push(`Equations shown: ${extraction.extracted_content.equations.join(', ')}`);
  }
  if (extraction.extracted_content.examples_shown?.length) {
    contentSummary.push(`Worked examples: ${extraction.extracted_content.examples_shown.join('; ')}`);
  }
  if (extraction.extracted_content.concepts?.length) {
    contentSummary.push(`Key concepts: ${extraction.extracted_content.concepts.join(', ')}`);
  }
  if (extraction.extracted_content.word_problems?.length) {
    contentSummary.push(`Word problems shown: ${extraction.extracted_content.word_problems.join('; ')}`);
  }

  return `You are generating practice problems for a middle school math student based on their classroom lesson.

LESSON CONTEXT:
- Topic: ${extraction.topic}
- Subtopics: ${extraction.subtopics.join(', ')}
- Grade Level: ${extraction.grade_level}
- Standards: ${extraction.standards.join(', ')}
- Content from lesson:
${contentSummary.map(s => `  * ${s}`).join('\n')}

GENERATION REQUIREMENTS:
- Difficulty Tier: ${tier} (${DIFFICULTY_DESCRIPTIONS[tier]})
- Number of Problems: ${count}
- Problems must directly relate to the lesson content
- Each problem must have exactly ONE correct answer
- Vary the problem structures (don't just change numbers)
- Use realistic numbers appropriate for middle school

For EACH problem, provide:
1. "problem_text": Clear problem statement in plain English
2. "problem_latex": The math expression in LaTeX format (for rendering)
3. "answer": The correct answer (as a string)
4. "answer_type": One of: "integer", "decimal", "fraction", "expression", "coordinate"
5. "acceptable_answers": Array of equivalent correct forms (e.g., ["8", "8.0", "x=8"])
6. "solution_steps": Array of step-by-step solution (3-5 steps typically)
${includeHints ? '7. "hints": Array of 3 progressive hints (vague → specific)' : ''}
${includeCommonMistakes ? '8. "common_mistakes": Array of 2-3 common student errors' : ''}

ANSWER TYPE GUIDELINES:
- "integer": Whole number answer (e.g., "8", "-3")
- "decimal": Decimal answer (e.g., "3.5", "0.25")
- "fraction": Fraction answer (e.g., "3/4", "-1/2")
- "expression": Algebraic expression (e.g., "2x + 1")
- "coordinate": Point or pair (e.g., "(3, 4)")

Return a JSON array of problem objects. Return ONLY valid JSON, no markdown or explanation.`;
}

const GeneratedProblemSchema = z.object({
  problem_text: z.string(),
  problem_latex: z.string().optional(),
  answer: z.string(),
  answer_type: z.enum(['integer', 'decimal', 'fraction', 'expression', 'coordinate', 'multiple_choice', 'true_false']),
  acceptable_answers: z.array(z.string()).optional(),
  solution_steps: z.array(z.string()),
  hints: z.array(z.string()).optional(),
  common_mistakes: z.array(z.string()).optional(),
});

export async function generateProblems(
  extraction: ImageExtractionResult,
  options: GenerationOptions
): Promise<ProblemSet> {
  const client = getClient();
  const config = getConfig();

  const prompt = buildGenerationPrompt(extraction, options);

  if (config.debug) {
    console.log(`[DEBUG] Generation prompt:\n${prompt.slice(0, 500)}...`);
  }

  const response = await client.messages.create({
    model: getModel(),
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response received from AI');
  }

  let responseText = textBlock.text.trim();

  // Handle markdown code blocks
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  if (config.debug) {
    console.log(`[DEBUG] Raw generation response:\n${responseText.slice(0, 500)}...`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse problem generation response as JSON: ${e}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected an array of problems');
  }

  // Validate and transform each problem
  const problems: Problem[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const rawProblem = parsed[i];
    const validation = GeneratedProblemSchema.safeParse(rawProblem);

    if (!validation.success) {
      if (config.debug) {
        console.log(`[DEBUG] Problem ${i} validation failed:`, validation.error.issues);
      }
      continue; // Skip invalid problems
    }

    const validProblem = validation.data;

    // Transform to our Problem type with generated ID
    const problem: Problem = {
      id: `prob_${uuidv4().slice(0, 8)}`,
      tier: options.tier,
      problem_text: validProblem.problem_text,
      problem_latex: validProblem.problem_latex,
      answer: validProblem.answer,
      answer_type: validProblem.answer_type,
      acceptable_answers: validProblem.acceptable_answers,
      solution_steps: validProblem.solution_steps,
      hints: validProblem.hints || ['Think about what operation to use first'],
      common_mistakes: validProblem.common_mistakes,
    };

    // Validate against our full schema
    const fullValidation = ProblemSchema.safeParse(problem);
    if (fullValidation.success) {
      problems.push(fullValidation.data);
    }
  }

  if (problems.length === 0) {
    throw new Error('No valid problems generated');
  }

  return {
    topic: extraction.topic,
    problems,
    generated_at: new Date().toISOString(),
  };
}

// Generate problems across multiple difficulty tiers
// startTier defaults to difficulty_baseline from extraction (or 1 if not set)
export async function generateAdaptiveProblems(
  extraction: ImageExtractionResult,
  problemsPerTier: number = 3,
  startTier?: number
): Promise<ProblemSet> {
  const config = getConfig();
  const allProblems: Problem[] = [];

  // Use difficulty_baseline from extraction, default to tier 1
  const baseTier = startTier ?? extraction.difficulty_baseline ?? 1;
  // Clamp to valid range 1-5
  const effectiveStartTier = Math.max(1, Math.min(5, baseTier));

  if (config.debug) {
    console.log(`[DEBUG] Starting problem generation at tier ${effectiveStartTier} (extraction baseline: ${extraction.difficulty_baseline})`);
  }

  // Generate for tiers starting from effectiveStartTier up to 5, then wrap to lower tiers
  const tierOrder: number[] = [];
  for (let t = effectiveStartTier; t <= 5; t++) tierOrder.push(t);
  for (let t = 1; t < effectiveStartTier; t++) tierOrder.push(t);

  for (const tier of tierOrder) {
    if (config.debug) {
      console.log(`[DEBUG] Generating tier ${tier} problems...`);
    }

    try {
      const tierProblems = await generateProblems(extraction, {
        tier,
        count: problemsPerTier,
        includeHints: true,
        includeCommonMistakes: true,
      });

      allProblems.push(...tierProblems.problems);
    } catch (error) {
      console.error(`Failed to generate tier ${tier} problems:`, error);
      // Continue with other tiers
    }
  }

  if (allProblems.length === 0) {
    throw new Error('Failed to generate any problems');
  }

  return {
    topic: extraction.topic,
    problems: allProblems,
    generated_at: new Date().toISOString(),
  };
}

// Generate a single replacement problem (for adaptive difficulty during quest)
export async function generateSingleProblem(
  extraction: ImageExtractionResult,
  tier: number
): Promise<Problem | null> {
  try {
    const result = await generateProblems(extraction, {
      tier,
      count: 1,
      includeHints: true,
      includeCommonMistakes: true,
    });

    return result.problems[0] || null;
  } catch {
    return null;
  }
}
