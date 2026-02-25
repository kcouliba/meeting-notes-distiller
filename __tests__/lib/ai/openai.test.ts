/**
 * @jest-environment node
 */

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

jest.mock('@/lib/prompts', () => ({
  SYSTEM_PROMPT: 'test prompt',
}));

import { createOpenAIProvider } from '@/lib/ai/openai';

describe('createOpenAIProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws if OPENAI_API_KEY is not set', () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => createOpenAIProvider()).toThrow('OPENAI_API_KEY environment variable is required');
  });

  it('creates a provider with name "openai"', () => {
    const provider = createOpenAIProvider();
    expect(provider.name).toBe('openai');
  });

  it('generate() sends correct message structure', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"summary":["test"]}' } }],
    });

    const provider = createOpenAIProvider();
    await provider.generate('some notes');

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'test prompt' },
        { role: 'user', content: 'some notes' },
      ],
    });
  });

  it('uses OPENAI_MODEL env var when set', async () => {
    process.env.OPENAI_MODEL = 'gpt-4o';
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
    });

    const provider = createOpenAIProvider();
    await provider.generate('notes');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o' })
    );
  });

  it('generate() returns response content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"summary":["test"]}' } }],
    });

    const provider = createOpenAIProvider();
    const result = await provider.generate('some notes');
    expect(result).toBe('{"summary":["test"]}');
  });

  it('generate() returns empty string when content is null', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const provider = createOpenAIProvider();
    const result = await provider.generate('some notes');
    expect(result).toBe('');
  });
});
