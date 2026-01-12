import Anthropic from '@anthropic-ai/sdk';
import { PipelineConfig } from '../types';

let clientInstance: Anthropic | null = null;
let currentConfig: PipelineConfig | null = null;

// Model configuration with fallback chain
const PRIMARY_MODEL = 'claude-opus-4-5-20251101';
const FALLBACK_MODEL = 'claude-sonnet-4-20250514';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 529];

export function initializeClient(config: PipelineConfig): Anthropic {
  if (!config.apiKey) {
    throw new Error('API key is required');
  }

  clientInstance = new Anthropic({
    apiKey: config.apiKey,
  });
  currentConfig = config;

  return clientInstance;
}

export function getClient(): Anthropic {
  if (!clientInstance) {
    throw new Error('Claude client not initialized. Call initializeClient first.');
  }
  return clientInstance;
}

export function getConfig(): PipelineConfig {
  if (!currentConfig) {
    throw new Error('Config not set. Call initializeClient first.');
  }
  return currentConfig;
}

export function getModel(): string {
  return currentConfig?.model || PRIMARY_MODEL;
}

export function getFallbackModel(): string {
  return FALLBACK_MODEL;
}

// Sleep helper for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return RETRYABLE_STATUS_CODES.includes(error.status);
  }
  return false;
}

// Get status code from error
function getErrorStatus(error: unknown): number | null {
  if (error instanceof Anthropic.APIError) {
    return error.status;
  }
  return null;
}

/**
 * Execute an API call with automatic retry and model fallback
 * @param apiCall - Function that makes the API call, receives model name as parameter
 * @param options - Configuration options
 * @returns The API response
 */
export async function withRetryAndFallback<T>(
  apiCall: (model: string) => Promise<T>,
  options: {
    maxRetries?: number;
    enableFallback?: boolean;
    onRetry?: (attempt: number, model: string, error: unknown) => void;
    onFallback?: (fromModel: string, toModel: string, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    enableFallback = true,
    onRetry,
    onFallback,
  } = options;

  const models = enableFallback ? [getModel(), FALLBACK_MODEL] : [getModel()];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall(model);
      } catch (error) {
        lastError = error;
        const status = getErrorStatus(error);

        // Log the error
        console.log(
          `[API] Attempt ${attempt}/${maxRetries} with ${model} failed: ${status || 'unknown'}`
        );

        // Check if we should retry with same model
        if (isRetryableError(error) && attempt < maxRetries) {
          onRetry?.(attempt, model, error);
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[API] Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        // If not retryable or out of retries, break to try fallback model
        break;
      }
    }

    // If we're about to try fallback model, log it
    if (model === getModel() && enableFallback && models.length > 1) {
      console.log(`[API] Primary model failed, falling back to ${FALLBACK_MODEL}`);
      onFallback?.(model, FALLBACK_MODEL, lastError);
    }
  }

  // All attempts failed
  throw lastError;
}
