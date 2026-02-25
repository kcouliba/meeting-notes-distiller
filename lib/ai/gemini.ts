import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { AIProviderClient } from './provider';

export function createGeminiProvider(): AIProviderClient {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required for Gemini provider');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return {
    name: 'gemini',
    async generate(notes: string): Promise<string> {
      const result = await model.generateContent(notes);
      return result.response.text();
    },
  };
}
