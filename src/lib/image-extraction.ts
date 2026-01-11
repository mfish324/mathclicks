import * as fs from 'fs';
import * as path from 'path';
import { getClient, getModel, getConfig } from '../api/claude-client';
import {
  ImageExtractionResponse,
  ImageExtractionResultSchema,
  ImageExtractionErrorSchema,
  isExtractionError,
} from '../types';

const EXTRACTION_PROMPT = `You are analyzing an image of a math lesson from a classroom whiteboard or hand-drawn math work.

Your task is to extract structured information about the mathematical content shown.

Extract the following and return as JSON:
1. "topic": The main math topic being taught. Examples:
   - Linear: "Two-Step Equations", "Linear Graphs", "Systems of Equations"
   - Quadratic: "Quadratic Equations", "Factoring Polynomials", "Quadratic Formula"
   - Polynomials: "Second-Degree Polynomials", "Polynomial Operations", "FOIL Method"
   - Other: "Proportions", "Fractions", "Exponents", "Radicals"
2. "subtopics": Array of specific skills/concepts (e.g., ["factoring trinomials", "completing the square", "vertex form"])
3. "grade_level": Estimated grade (6-12 based on content complexity)
4. "standards": Relevant Common Core math standards (e.g., ["A.SSE.A.2", "A.REI.B.4"])
5. "extracted_content": Object containing:
   - "equations": Array of equations shown (if any)
   - "examples_shown": Array of worked examples with solutions (if any)
   - "concepts": Array of key concepts or rules stated
   - "word_problems": Array of word problems (if any)
   - "definitions": Array of definitions given (if any)
   - "graphs_described": Description of any graphs/diagrams (if any)
6. "difficulty_baseline": Number 1-5 indicating typical difficulty level (3 = grade level)

CRITICAL - IDENTIFY POLYNOMIAL DEGREE:
- Look for x², x³, or higher powers - these indicate polynomials beyond linear
- "ax² + bx + c" is a QUADRATIC (second-degree), NOT linear
- Parabolas indicate quadratic content
- Terms like "vertex", "axis of symmetry", "roots", "zeros" suggest quadratics

CRITICAL - HANDWRITTEN CONTENT RECOGNITION:
When reading handwritten math, be VERY careful to distinguish between:
- NUMBERS vs VARIABLES: "34" (thirty-four) vs "3y" (three times y)
- Common confusions to watch for:
  * "4" vs "y" - look at the overall shape and context
  * "1" vs "l" vs "I" - context matters
  * "0" vs "O" - in math, prefer "0" (zero)
  * "2" vs "z" - context matters
  * Multi-digit numbers: "34", "17", "272" are common; unusual variable combinations like "3y" in a denominator are less common

CONTEXT CLUES for numbers vs variables:
- In fractions like a/b, both numerator and denominator are usually NUMBERS (e.g., "34/2" not "3y/2")
- In proportions like a/b = c/d, all four values are typically NUMBERS
- Variables usually appear with coefficients (e.g., "2x", "3n") or alone ("x", "y")
- If it looks like a two-digit number (10-99), it is probably a number, not a variable combination

IMPORTANT GUIDELINES:
- Extract ALL mathematical content visible, even if partially obscured
- For equations, preserve the exact format shown (e.g., "3x + 5 = 17" not "3x+5=17")
- For worked examples, show the full solution path if visible
- Be specific about concepts - "subtract constant first" is better than "solving equations"
- If multiple topics are shown, identify the PRIMARY topic
- Recognize PROPORTIONS (a/b = c/d) as a distinct topic from two-step equations

COMMON MATH STANDARDS REFERENCE:
Middle School:
- 6.RP.A.3: Ratio and rate reasoning
- 7.RP.A.2: Recognize and represent proportional relationships
- 7.EE.B.4a: Solve word problems leading to equations (px + q = r)
- 8.EE.C.7: Solve linear equations in one variable

High School Algebra:
- A.SSE.A.2: Use structure of expressions (factoring, completing square)
- A.SSE.B.3: Write expressions in equivalent forms to solve problems
- A.APR.A.1: Polynomial arithmetic (add, subtract, multiply)
- A.REI.B.4: Solve quadratic equations (factoring, completing square, quadratic formula)
- F.IF.C.7a: Graph linear and quadratic functions, show key features
- F.IF.C.8a: Factor quadratics to show zeros, max/min, symmetry

If the image is unclear, does not contain math content, or cannot be analyzed:
Return an error object: {"error": true, "message": "description of the issue", "suggestion": "what the user could do"}

Return ONLY valid JSON. No markdown, no explanation, just the JSON object.`;

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function getMediaType(filePath: string): ImageMediaType {
  const ext = path.extname(filePath).toLowerCase();
  const mediaTypes: Record<string, ImageMediaType> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mediaTypes[ext] || 'image/jpeg';
}

function loadImageAsBase64(imagePath: string): string {
  const absolutePath = path.resolve(imagePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found: ${absolutePath}`);
  }
  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString('base64');
}

export async function extractMathContent(
  imagePath: string
): Promise<ImageExtractionResponse> {
  const client = getClient();
  const config = getConfig();

  // Load and encode image
  const imageBase64 = loadImageAsBase64(imagePath);
  const mediaType = getMediaType(imagePath);

  if (config.debug) {
    console.log(`[DEBUG] Processing image: ${imagePath}`);
    console.log(`[DEBUG] Media type: ${mediaType}`);
    console.log(`[DEBUG] Image size: ${Math.round(imageBase64.length / 1024)}KB (base64)`);
  }

  try {
    const response = await client.messages.create({
      model: getModel(),
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return {
        error: true,
        message: 'No text response received from AI',
        suggestion: 'Try again with a clearer image',
      };
    }

    const responseText = textBlock.text.trim();

    if (config.debug) {
      console.log(`[DEBUG] Raw response:\n${responseText}`);
    }

    // Parse JSON response
    let parsed: unknown;
    try {
      // Handle potential markdown code blocks
      let jsonText = responseText;
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      return {
        error: true,
        message: 'Failed to parse AI response as JSON',
        suggestion: 'The image may be unclear or contain non-math content',
      };
    }

    // Check if it's an error response
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const errorResult = ImageExtractionErrorSchema.safeParse(parsed);
      if (errorResult.success) {
        return errorResult.data;
      }
    }

    // Validate as successful extraction
    const result = ImageExtractionResultSchema.safeParse(parsed);
    if (!result.success) {
      if (config.debug) {
        console.log(`[DEBUG] Validation errors:`, result.error.issues);
      }
      return {
        error: true,
        message: 'AI response did not match expected format',
        suggestion: 'Try with a different image or clearer photo',
      };
    }

    return result.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      error: true,
      message: `API call failed: ${errorMessage}`,
      suggestion: 'Check your API key and internet connection',
    };
  }
}

// Utility function to extract from a URL (for future use)
export async function extractMathContentFromUrl(
  imageUrl: string
): Promise<ImageExtractionResponse> {
  const client = getClient();
  const config = getConfig();

  if (config.debug) {
    console.log(`[DEBUG] Processing image URL: ${imageUrl}`);
  }

  try {
    const response = await client.messages.create({
      model: getModel(),
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return {
        error: true,
        message: 'No text response received from AI',
        suggestion: 'Try again with a different image URL',
      };
    }

    const responseText = textBlock.text.trim();
    let jsonText = responseText;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const errorResult = ImageExtractionErrorSchema.safeParse(parsed);
      if (errorResult.success) {
        return errorResult.data;
      }
    }

    const result = ImageExtractionResultSchema.safeParse(parsed);
    if (!result.success) {
      return {
        error: true,
        message: 'AI response did not match expected format',
        suggestion: 'Try with a different image',
      };
    }

    return result.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      error: true,
      message: `Failed to process image: ${errorMessage}`,
      suggestion: 'Ensure the URL is accessible and points to a valid image',
    };
  }
}
