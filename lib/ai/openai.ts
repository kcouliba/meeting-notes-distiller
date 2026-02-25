import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { AIProviderClient } from './provider';

export function createOpenAIProvider(): AIProviderClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
  }

  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const client = new OpenAI({ apiKey });

  return {
    name: 'openai',
    async generate(notes: string): Promise<string> {
      const response = await client.chat.completions.create({
        model: modelName,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: notes },
        ],
      });

      return response.choices[0]?.message?.content ?? '';
    },
  };
}
