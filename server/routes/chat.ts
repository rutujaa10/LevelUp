import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const SYSTEM_INSTRUCTION = `You are an expert fitness and nutrition coach for an app called LevelUp.
You help users with workout programming, nutrition planning, recovery, and goal setting.
Be specific, evidence-based, and encouraging. Keep responses concise and actionable.
Always include a brief disclaimer when giving medical or clinical advice.`;

const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash'];

router.post('/', auth, async (req: AuthRequest, res) => {
  const { contents } = req.body;
  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI Coach is not configured (missing GEMINI_API_KEY)' });
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any;

  for (const model of CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return res.json({ text: response.text ?? '' });
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.code;
      if (status === 429 || String(err?.message).includes('429') || String(err?.message).includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Chat: ${model} quota exhausted, trying next model…`);
        continue;
      }
      break;
    }
  }

  console.error('Chat error (all models failed):', lastError?.message ?? lastError);
  const isQuota = String(lastError?.message).includes('429') || String(lastError?.message).includes('RESOURCE_EXHAUSTED');
  res.status(503).json({
    error: isQuota
      ? 'Gemini API daily quota reached. Please try again after midnight or upgrade to a paid API key.'
      : `Gemini error: ${lastError?.message ?? 'unknown'}`,
  });
});

export default router;
