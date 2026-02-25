/**
 * @jest-environment node
 */

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

jest.mock('@/lib/prompts', () => ({
  SYSTEM_PROMPT: 'test prompt',
}));

import { createGeminiProvider } from '@/lib/ai/gemini';

describe('createGeminiProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GOOGLE_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws if GOOGLE_API_KEY is not set', () => {
    delete process.env.GOOGLE_API_KEY;
    expect(() => createGeminiProvider()).toThrow('GOOGLE_API_KEY environment variable is required');
  });

  it('creates a provider with name "gemini"', () => {
    const provider = createGeminiProvider();
    expect(provider.name).toBe('gemini');
  });

  it('uses default model gemini-2.5-flash', () => {
    createGeminiProvider();
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash' })
    );
  });

  it('uses GEMINI_MODEL env var when set', () => {
    process.env.GEMINI_MODEL = 'gemini-pro';
    createGeminiProvider();
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-pro' })
    );
  });

  it('generate() returns text from Gemini response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '{"summary":["test"]}' },
    });

    const provider = createGeminiProvider();
    const result = await provider.generate('some notes');

    expect(mockGenerateContent).toHaveBeenCalledWith('some notes');
    expect(result).toBe('{"summary":["test"]}');
  });
});
