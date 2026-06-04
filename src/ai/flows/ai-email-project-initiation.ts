'use server';
/**
 * @fileOverview An AI agent that extracts customer details and project summary from an email to pre-fill a project initiation form.
 *
 * - initiateProjectFromEmail - A function that handles the email processing to extract project details.
 * - EmailProjectInitiationInput - The input type for the initiateProjectFromEmail function.
 * - EmailProjectInitiationOutput - The return type for the initiateProjectFromEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmailProjectInitiationInputSchema = z.object({
  emailContent: z.string().describe('The full content of the inquiry email.'),
});
export type EmailProjectInitiationInput = z.infer<typeof EmailProjectInitiationInputSchema>;

const EmailProjectInitiationOutputSchema = z.object({
  customerName: z.string().describe('The full name of the customer mentioned in the email. If no name is clearly specified, return "Unknown Customer".'),
  customerEmail: z.string().email().describe('The email address of the customer. If no email is found, return "unknown@example.com".'),
  customerPhone: z.string().optional().describe('The phone number of the customer mentioned in the email, if available.'),
  projectSummary: z.string().describe('A concise summary of the proposed project or inquiry mentioned in the email.'),
});
export type EmailProjectInitiationOutput = z.infer<typeof EmailProjectInitiationOutputSchema>;

export async function initiateProjectFromEmail(input: EmailProjectInitiationInput): Promise<EmailProjectInitiationOutput> {
  return emailProjectInitiationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emailProjectInitiationPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: EmailProjectInitiationInputSchema},
  output: {schema: EmailProjectInitiationOutputSchema},
  prompt: `You are an AI assistant specialized in extracting key information from customer inquiry emails to facilitate project initiation for a tour company.

From the following email content, identify and extract the customer's full name, email address, and phone number (if available). Then, provide a concise summary of the proposed project or inquiry described in the email.

Instructions:
- If the customer's name is not explicitly mentioned or cannot be inferred, set 'customerName' to "Unknown Customer".
- If the email address is missing, use "unknown@example.com".
- Ensure the project summary is professional and captures the core requirements (pax count, dates, destinations, or specific needs).

Email Content:
---
{{{emailContent}}}
---`,
});

const emailProjectInitiationFlow = ai.defineFlow(
  {
    name: 'emailProjectInitiationFlow',
    inputSchema: EmailProjectInitiationInputSchema,
    outputSchema: EmailProjectInitiationOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI analysis failed to produce a valid response. Please ensure the email contains relevant inquiry text.');
      }
      return output;
    } catch (error: any) {
      console.error('AI Flow Error:', error);
      
      // Handle quota and configuration errors gracefully
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('AI Quota Exceeded (Gemini 2.5 Flash). Please wait a minute before trying again or check your billing status.');
      }
      
      if (error.message?.includes('404')) {
        throw new Error('AI Model gemini-2.5-flash not found. This might be a regional restriction or API configuration issue.');
      }

      throw new Error(error.message || 'The AI could not process this email.');
    }
  }
);
