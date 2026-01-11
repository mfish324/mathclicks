/**
 * Socratic Dialogue System
 * Uses Claude Vision to analyze student work and ask targeted questions
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Problem } from '../types';

export interface SocraticQuestion {
  question: string;
  category: 'understanding' | 'process' | 'reasoning' | 'connection';
  encouragement: string;
}

export interface AnalyzeWorkRequest {
  problem: Problem;
  canvasImage: string;  // Base64 PNG
  previousQuestions?: string[];  // To avoid repeating questions
}

export interface AnalyzeWorkResponse {
  success: boolean;
  data?: SocraticQuestion;
  readyToSubmit?: boolean;  // True if work looks complete and correct
  error?: string;
}

const SOCRATIC_PROMPT = `You are a warm, encouraging math tutor helping a middle school student. You're looking at their handwritten work for a math problem.

Your job is to ask ONE targeted Socratic question that helps them reflect on their thinking. The goal is to check understanding, not to give away answers.

PROBLEM:
{problem_text}

CORRECT ANSWER (do NOT reveal this):
{correct_answer}

GUIDELINES:
1. Look at what the student has written/drawn on their work
2. Identify their approach and any potential misconceptions
3. Ask ONE simple, encouraging question about their process
4. Keep questions short and conversational (1-2 sentences max)
5. Never tell them if they're right or wrong yet
6. Never reveal the answer or solution steps
7. If their work looks correct and complete, say they're ready to submit

QUESTION TYPES (pick the most relevant):
- UNDERSTANDING: "What does this number represent in the problem?"
- PROCESS: "Why did you decide to [specific action they took]?"
- REASONING: "How did you know to [specific step]?"
- CONNECTION: "Where have you seen a problem like this before?"

RESPONSE FORMAT (JSON):
{
  "question": "Your single Socratic question here",
  "category": "understanding" | "process" | "reasoning" | "connection",
  "encouragement": "A brief positive observation about their work (1 sentence)",
  "readyToSubmit": false
}

If their work looks complete and the approach is correct, use:
{
  "question": "",
  "category": "process",
  "encouragement": "Great work showing your steps! Your approach looks solid.",
  "readyToSubmit": true
}`;

export async function analyzeStudentWork(
  client: Anthropic,
  request: AnalyzeWorkRequest
): Promise<AnalyzeWorkResponse> {
  const { problem, canvasImage, previousQuestions = [] } = request;

  // Build the prompt
  let prompt = SOCRATIC_PROMPT
    .replace('{problem_text}', problem.problem_text)
    .replace('{correct_answer}', problem.answer);

  // Add context about previous questions to avoid repetition
  if (previousQuestions.length > 0) {
    prompt += `\n\nPREVIOUS QUESTIONS ASKED (do not repeat these):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  try {
    // Remove data URL prefix if present
    const base64Data = canvasImage.replace(/^data:image\/\w+;base64,/, '');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No response from AI' };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Invalid response format' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      question: string;
      category: SocraticQuestion['category'];
      encouragement: string;
      readyToSubmit?: boolean;
    };

    return {
      success: true,
      data: {
        question: parsed.question,
        category: parsed.category,
        encouragement: parsed.encouragement,
      },
      readyToSubmit: parsed.readyToSubmit || false,
    };
  } catch (error) {
    console.error('Error analyzing student work:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze work',
    };
  }
}

/**
 * Evaluate a student's response to a Socratic question
 */
export interface EvaluateResponseRequest {
  problem: Problem;
  canvasImage: string;
  aiQuestion: string;
  studentResponse: string;
}

export interface EvaluateResponseResult {
  success: boolean;
  feedback?: string;
  followUpQuestion?: string;
  readyToSubmit?: boolean;
  error?: string;
}

const EVALUATE_RESPONSE_PROMPT = `You are a warm, encouraging math tutor. A student just answered your Socratic question about their math work.

PROBLEM:
{problem_text}

YOUR QUESTION WAS:
{ai_question}

STUDENT'S RESPONSE:
{student_response}

YOUR TASK:
1. Acknowledge their response warmly
2. If they seem confused, ask ONE gentle follow-up question
3. If they understand, encourage them to submit their answer
4. Keep feedback brief and encouraging (2-3 sentences max)
5. Never tell them if their final answer is right or wrong

RESPONSE FORMAT (JSON):
{
  "feedback": "Your encouraging response (2-3 sentences)",
  "followUpQuestion": "Optional follow-up question if needed, or empty string",
  "readyToSubmit": true/false
}`;

/**
 * Analyze incorrect work after student gets an answer wrong
 * This provides specific feedback on what went wrong
 */
export interface AnalyzeIncorrectWorkRequest {
  problem: Problem;
  workImage: string;  // Base64 image of notebook work
  studentAnswer: string;
  attemptNumber: number;
}

export interface AnalyzeIncorrectWorkResponse {
  success: boolean;
  feedback?: string;
  errorIdentified?: string;
  suggestion?: string;
  encouragement?: string;
  error?: string;
}

const ANALYZE_INCORRECT_PROMPT = `You are a supportive math tutor helping a student understand their mistake. They got the problem wrong and have uploaded a photo of their notebook work.

PROBLEM:
{problem_text}

CORRECT ANSWER: {correct_answer}

STUDENT'S ANSWER: {student_answer} (This is WRONG)

THEIR ATTEMPT NUMBER: {attempt_number}

LOOKING AT THEIR WORK:
Analyze the image of their handwritten work carefully. Identify WHERE they went wrong.

YOUR TASK:
1. Find the specific step where they made an error
2. Explain what went wrong WITHOUT giving away the answer
3. Give a hint about what to try differently
4. Be encouraging - mistakes are how we learn!

RESPONSE FORMAT (JSON):
{
  "errorIdentified": "Describe the specific error you found (1-2 sentences)",
  "feedback": "Explain what went wrong in student-friendly language (2-3 sentences)",
  "suggestion": "Give a helpful hint for what to try next (1-2 sentences)",
  "encouragement": "A brief encouraging message (1 sentence)"
}

IMPORTANT:
- Do NOT reveal the correct answer
- Do NOT show the full solution
- Be specific about the error you see in their work
- Be warm and encouraging
- If you can't see clear work, acknowledge that and suggest they show more steps`;

export async function analyzeIncorrectWork(
  client: Anthropic,
  request: AnalyzeIncorrectWorkRequest
): Promise<AnalyzeIncorrectWorkResponse> {
  const { problem, workImage, studentAnswer, attemptNumber } = request;

  const prompt = ANALYZE_INCORRECT_PROMPT
    .replace('{problem_text}', problem.problem_text)
    .replace('{correct_answer}', problem.answer)
    .replace('{student_answer}', studentAnswer)
    .replace('{attempt_number}', attemptNumber.toString());

  try {
    // Remove data URL prefix if present
    const base64Data = workImage.replace(/^data:image\/\w+;base64,/, '');

    // Detect media type from base64 or default to jpeg for photos
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (workImage.startsWith('data:image/png')) {
      mediaType = 'image/png';
    } else if (workImage.startsWith('data:image/gif')) {
      mediaType = 'image/gif';
    } else if (workImage.startsWith('data:image/webp')) {
      mediaType = 'image/webp';
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No response from AI' };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Invalid response format' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      errorIdentified: string;
      feedback: string;
      suggestion: string;
      encouragement: string;
    };

    return {
      success: true,
      errorIdentified: parsed.errorIdentified,
      feedback: parsed.feedback,
      suggestion: parsed.suggestion,
      encouragement: parsed.encouragement,
    };
  } catch (error) {
    console.error('Error analyzing incorrect work:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze work',
    };
  }
}

export async function evaluateStudentResponse(
  client: Anthropic,
  request: EvaluateResponseRequest
): Promise<EvaluateResponseResult> {
  const { problem, canvasImage, aiQuestion, studentResponse } = request;

  const prompt = EVALUATE_RESPONSE_PROMPT
    .replace('{problem_text}', problem.problem_text)
    .replace('{ai_question}', aiQuestion)
    .replace('{student_response}', studentResponse);

  try {
    // Remove data URL prefix if present
    const base64Data = canvasImage.replace(/^data:image\/\w+;base64,/, '');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No response from AI' };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Invalid response format' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      feedback: string;
      followUpQuestion?: string;
      readyToSubmit: boolean;
    };

    return {
      success: true,
      feedback: parsed.feedback,
      followUpQuestion: parsed.followUpQuestion || undefined,
      readyToSubmit: parsed.readyToSubmit,
    };
  } catch (error) {
    console.error('Error evaluating student response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate response',
    };
  }
}
