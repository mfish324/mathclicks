import Anthropic from '@anthropic-ai/sdk';
import { PipelineConfig } from '../types';

let clientInstance: Anthropic | null = null;
let currentConfig: PipelineConfig | null = null;

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
  return currentConfig?.model || 'claude-sonnet-4-20250514';
}
