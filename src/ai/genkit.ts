
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Ensure we have an API key, providing a clear error if not
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
});
