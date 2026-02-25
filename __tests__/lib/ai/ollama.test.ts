/**
 * @jest-environment node
 */

jest.mock('@/lib/prompts', () => ({
  SYSTEM_PROMPT: 'test prompt',
}));

import { createOllamaProvider } from '@/lib/ai/ollama';

describe('createOllamaProvider', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('creates a provider with name "ollama"', () => {
    const provider = createOllamaProvider();
    expect(provider.name).toBe('ollama');
  });

  it('generate() sends correct request to default URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '{"summary":["test"]}' } }),
    });

    const provider = createOllamaProvider();
    await provider.generate('some notes');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({ method: 'POST' })
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.model).toBe('qwen2.5:7b');
    expect(body.messages).toEqual([
      { role: 'system', content: 'test prompt' },
      { role: 'user', content: 'some notes' },
    ]);
    expect(body.stream).toBe(false);
    expect(body.format.type).toBe('object');
    expect(body.format.required).toEqual(
      expect.arrayContaining(['summary', 'decisions', 'actions', 'pending', 'participants', 'language'])
    );
  });

  it('uses OLLAMA_BASE_URL and OLLAMA_MODEL env vars', async () => {
    process.env.OLLAMA_BASE_URL = 'http://custom:8080';
    process.env.OLLAMA_MODEL = 'mistral';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '{}' } }),
    });

    const provider = createOllamaProvider();
    await provider.generate('notes');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://custom:8080/api/chat',
      expect.objectContaining({
        body: expect.stringContaining('"model":"mistral"'),
      })
    );
  });

  it('generate() returns response content', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '{"summary":["test"]}' } }),
    });

    const provider = createOllamaProvider();
    const result = await provider.generate('some notes');
    expect(result).toBe('{"summary":["test"]}');
  });

  it('generate() returns empty string when message content is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: {} }),
    });

    const provider = createOllamaProvider();
    const result = await provider.generate('some notes');
    expect(result).toBe('');
  });

  it('generate() throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const provider = createOllamaProvider();
    await expect(provider.generate('some notes')).rejects.toThrow(
      'Ollama request failed (500): Internal Server Error'
    );
  });
});
