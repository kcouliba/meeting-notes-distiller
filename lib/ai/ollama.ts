import { SYSTEM_PROMPT } from '@/lib/prompts';
import { AIProviderClient } from './provider';

const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['summary', 'decisions', 'actions', 'pending', 'participants', 'language'],
  properties: {
    summary: { type: 'array', items: { type: 'string' } },
    decisions: { type: 'array', items: { type: 'string' } },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'task', 'assignee', 'deadline'],
        properties: {
          title: { type: 'string' },
          task: { type: 'string' },
          assignee: { type: ['string', 'null'] },
          deadline: { type: ['string', 'null'] },
        },
      },
    },
    pending: { type: 'array', items: { type: 'string' } },
    participants: { type: 'array', items: { type: 'string' } },
    language: { type: 'string' },
  },
};

export function createOllamaProvider(): AIProviderClient {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const modelName = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

  return {
    name: 'ollama',
    async generate(notes: string): Promise<string> {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: notes },
          ],
          format: RESPONSE_SCHEMA,
          stream: false,
          options: { temperature: 0.2 },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ollama request failed (${response.status}): ${body}`);
      }

      const data = await response.json();
      return data.message?.content ?? '';
    },
  };
}
