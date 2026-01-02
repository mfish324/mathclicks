/**
 * Backend API Client
 * Calls the MathClicks backend server directly
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export interface BackendProcessImageResponse {
  success: boolean;
  data?: {
    extraction: any;
    problems: any;
  };
  error?: string;
}

export interface BackendCheckAnswerResponse {
  correct: boolean;
  feedback: string;
  error_type?: string;
  hint_to_show?: number;
  hint_text?: string;
}

/**
 * Process an image through the backend API
 */
export async function processImageViaBackend(
  file: File,
  options?: { tier?: number; count?: number }
): Promise<BackendProcessImageResponse> {
  const formData = new FormData();
  formData.append('image', file);

  if (options?.tier) {
    formData.append('tier', options.tier.toString());
  }
  if (options?.count) {
    formData.append('count', options.count.toString());
  }

  const response = await fetch(`${BACKEND_URL}/api/process-image`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Check an answer through the backend API
 */
export async function checkAnswerViaBackend(
  problem: any,
  studentAnswer: string,
  attemptNumber: number
): Promise<BackendCheckAnswerResponse> {
  const response = await fetch(`${BACKEND_URL}/api/check-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ problem, studentAnswer, attemptNumber }),
  });

  return response.json();
}

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
