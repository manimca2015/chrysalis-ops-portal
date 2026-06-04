'use server';
/**
 * @fileOverview AI Project Intelligence Agent.
 * 
 * - generateProjectInsights - Analyzes project data to provide itineraries, financial advice, or summaries.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectIntelligenceInputSchema = z.object({
  type: z.enum(['itinerary', 'financial_advice', 'summary']).describe('The type of insight requested.'),
  projectTitle: z.string(),
  category: z.string(),
  notes: z.string().optional(),
  costingData: z.object({
    totalCost: z.number(),
    totalSelling: z.number(),
    margin: z.number(),
    items: z.array(z.object({
      description: z.string(),
      supplier: z.string(),
      cost: z.number(),
    })).optional(),
  }).optional(),
});
export type ProjectIntelligenceInput = z.infer<typeof ProjectIntelligenceInputSchema>;

const ProjectIntelligenceInternalInputSchema = ProjectIntelligenceInputSchema.extend({
  isItinerary: z.boolean().optional(),
  isFinancialAdvice: z.boolean().optional(),
  isSummary: z.boolean().optional(),
});

const ProjectIntelligenceOutputSchema = z.object({
  content: z.string().describe('The AI generated content in Markdown format.'),
  keyTakeaways: z.array(z.string()).describe('Short bullet points for quick scanning.'),
  suggestedActions: z.array(z.string()).describe('Specific next steps for the staff member.'),
});
export type ProjectIntelligenceOutput = z.infer<typeof ProjectIntelligenceOutputSchema>;

export async function generateProjectInsights(input: ProjectIntelligenceInput): Promise<ProjectIntelligenceOutput> {
  return projectIntelligenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectIntelligencePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ProjectIntelligenceInternalInputSchema},
  output: {schema: ProjectIntelligenceOutputSchema},
  prompt: `You are an expert travel operations consultant for "Chrysalis Tours Singapore".
  
  TASK: Provide intelligence for the project "{{{projectTitle}}}" (Category: {{{category}}}).
  
  {{#if isItinerary}}
  GENERATE A DRAFT ITINERARY:
  Based on these notes: "{{{notes}}}"
  - Create a structured multi-day itinerary.
  - Suggest specific Singaporean landmarks and unique local experiences.
  - Keep the tone professional but exciting.
  {{/if}}

  {{#if isFinancialAdvice}}
  ANALYZE FINANCIALS:
  Total Cost: SGD {{{costingData.totalCost}}}
  Total Selling: SGD {{{costingData.totalSelling}}}
  Margin: {{{costingData.margin}}}%
  
  - Evaluate if the margin is healthy (target is 15-25%).
  - Suggest areas where costs might be high or markup could be increased.
  - Flag any missing essential services typical for a {{{category}}} tour.
  {{/if}}

  {{#if isSummary}}
  PROJECT CATCH-UP SUMMARY:
  Notes: "{{{notes}}}"
  - Summarize the customer's core needs from the enquiry.
  - Highlight the most critical "must-haves" based on the enquiry text.
  - If notes are empty, suggest initial discovery questions for the {{{category}}} category.
  {{/if}}

  Format the 'content' field with clear Markdown headings.`,
});

const projectIntelligenceFlow = ai.defineFlow(
  {
    name: 'projectIntelligenceFlow',
    inputSchema: ProjectIntelligenceInputSchema,
    outputSchema: ProjectIntelligenceOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt({
        ...input,
        isItinerary: input.type === 'itinerary',
        isFinancialAdvice: input.type === 'financial_advice',
        isSummary: input.type === 'summary',
      });
      if (!output) throw new Error('AI failed to generate insights.');
      return output;
    } catch (error: any) {
      console.error('AI Intelligence Error:', error);
      throw new Error(error.message || 'The AI could not process this project request.');
    }
  }
);
