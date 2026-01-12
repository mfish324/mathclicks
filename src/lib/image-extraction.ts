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

CRITICAL - HANDWRITTEN NUMBER RECOGNITION:
When reading handwritten math on paper, be EXTREMELY careful with numbers:

DIGIT-BY-DIGIT RECOGNITION:
- Read each digit separately before combining into a number
- "1" has a single vertical stroke (may have small top serif)
- "2" has a curved top and flat bottom with diagonal
- "3" has two curved bumps on the right
- "4" has a vertical line with a horizontal cross, may be open or closed top
- "5" has a flat top, curved bottom
- "6" has a curved top loop going down into a bottom loop
- "7" has a flat top with diagonal down-stroke
- "8" has two stacked loops
- "9" has a top loop with tail going down
- "0" is an oval/circle

COMMON HANDWRITING CONFUSIONS - BE CAREFUL:
- "1" vs "7": Look for the top horizontal line (7 has it, 1 doesn't)
- "4" vs "9": Look at the overall shape - 4 has angles, 9 is rounded
- "5" vs "6": 5 has a flat top, 6 has a curved top
- "6" vs "0": 6 has a tail/stem, 0 is closed
- "3" vs "8": 3 is open on left, 8 is closed
- "2" vs "7": 2 curves at bottom, 7 is straight diagonal

NUMBERS vs VARIABLES:
- "34" (thirty-four) vs "3y" (three times y)
- "4" vs "y" - 4 has angular strokes, y has a descender tail
- "1" vs "l" vs "I" - in math context, prefer reading as "1"
- "0" vs "O" - in math, prefer "0" (zero)
- "2" vs "z" - 2 is more curved, z is angular
- Multi-digit numbers (10-99, 100-999) are VERY common in math problems

CONTEXT CLUES - ASSUME NUMBERS UNLESS CLEARLY A VARIABLE:
- In equations like "2x + 5 = 17", the 2, 5, and 17 are numbers
- In fractions, numerator and denominator are usually NUMBERS
- In proportions (a/b = c/d), all four values are typically NUMBERS
- Coefficients are usually single digits (2x, 3y) not multi-digit (34x is unusual)
- If it could be a two-digit number OR a variable combo, choose the NUMBER

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
      const errorDetails = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      console.log(`[VALIDATION] Errors:`, errorDetails);
      console.log(`[VALIDATION] Raw response:`, JSON.stringify(parsed, null, 2));
      return {
        error: true,
        message: `AI response did not match expected format: ${errorDetails}`,
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
