import { AIProvider } from '@/types/meeting';
import { AIProviderClient } from './provider';
import { createGeminiProvider } from './gemini';
import { createOpenAIProvider } from './openai';
import { createOllamaProvider } from './ollama';

const providerFactories: Record<AIProvider, () => AIProviderClient> = {
  gemini: createGeminiProvider,
  openai: createOpenAIProvider,
  ollama: createOllamaProvider,
};

let provider: AIProviderClient | null = null;

export function getAIProvider(): AIProviderClient {
  if (!provider) {
    const name = (process.env.AI_PROVIDER || 'gemini') as string;
    const factory = providerFactories[name as AIProvider];
    if (!factory) {
      throw new Error(
        `Unknown AI provider "${name}". Valid options: ${Object.keys(providerFactories).join(', ')}`
      );
    }
    provider = factory();
  }
  return provider;
}

export function resetAIProvider(): void {
  provider = null;
}
