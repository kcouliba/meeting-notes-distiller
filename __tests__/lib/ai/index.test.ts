/**
 * @jest-environment node
 */

const mockGeminiProvider = { name: 'gemini', generate: jest.fn() };
const mockOpenAIProvider = { name: 'openai', generate: jest.fn() };
const mockOllamaProvider = { name: 'ollama', generate: jest.fn() };

jest.mock('@/lib/ai/gemini', () => ({
  createGeminiProvider: jest.fn(() => mockGeminiProvider),
}));

jest.mock('@/lib/ai/openai', () => ({
  createOpenAIProvider: jest.fn(() => mockOpenAIProvider),
}));

jest.mock('@/lib/ai/ollama', () => ({
  createOllamaProvider: jest.fn(() => mockOllamaProvider),
}));

import { getAIProvider, resetAIProvider } from '@/lib/ai';
import { createGeminiProvider } from '@/lib/ai/gemini';
import { createOpenAIProvider } from '@/lib/ai/openai';
import { createOllamaProvider } from '@/lib/ai/ollama';

describe('getAIProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAIProvider();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to gemini when AI_PROVIDER is not set', () => {
    delete process.env.AI_PROVIDER;
    const provider = getAIProvider();
    expect(createGeminiProvider).toHaveBeenCalled();
    expect(provider.name).toBe('gemini');
  });

  it('creates gemini provider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini';
    const provider = getAIProvider();
    expect(createGeminiProvider).toHaveBeenCalled();
    expect(provider.name).toBe('gemini');
  });

  it('creates openai provider when AI_PROVIDER=openai', () => {
    process.env.AI_PROVIDER = 'openai';
    const provider = getAIProvider();
    expect(createOpenAIProvider).toHaveBeenCalled();
    expect(provider.name).toBe('openai');
  });

  it('creates ollama provider when AI_PROVIDER=ollama', () => {
    process.env.AI_PROVIDER = 'ollama';
    const provider = getAIProvider();
    expect(createOllamaProvider).toHaveBeenCalled();
    expect(provider.name).toBe('ollama');
  });

  it('throws on unknown provider name', () => {
    process.env.AI_PROVIDER = 'invalid';
    expect(() => getAIProvider()).toThrow('Unknown AI provider "invalid"');
    expect(() => getAIProvider()).toThrow('gemini, openai, ollama');
  });

  it('returns cached singleton on subsequent calls', () => {
    process.env.AI_PROVIDER = 'gemini';
    const first = getAIProvider();
    const second = getAIProvider();
    expect(first).toBe(second);
    expect(createGeminiProvider).toHaveBeenCalledTimes(1);
  });

  it('resetAIProvider() clears the cached instance', () => {
    process.env.AI_PROVIDER = 'gemini';
    getAIProvider();
    resetAIProvider();
    getAIProvider();
    expect(createGeminiProvider).toHaveBeenCalledTimes(2);
  });
});
