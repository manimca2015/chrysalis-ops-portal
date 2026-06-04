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
  model: 'googleai/gemini-2.5-flash',
  input: {schema: ProjectIntelligenceInputSchema},
  output: {schema: ProjectIntelligenceOutputSchema},
  prompt: `You are an expert travel operations consultant for "Chrysalis Tours Singapore".
  
  TASK: Provide intelligence for the project "{{{projectTitle}}}" (Category: {{{category}}}).
  
  {{#if (eq type "itinerary")}}
  GENERATE A DRAFT ITINERARY:
  Based on these notes: "{{{notes}}}"
  - Create a structured 3-day or multi-day itinerary.
  - Suggest specific Singaporean landmarks and unique local experiences.
  - Keep the tone professional but exciting.
  {{/if}}

  {{#if (eq type "financial_advice")}}
  ANALYZE FINANCIALS:
  Total Cost: SGD {{{costingData.totalCost}}}
  Total Selling: SGD {{{costingData.totalSelling}}}
  Margin: {{{costingData.margin}}}%
  Line Items:
  {{#each costingData.items}}
  - {{{description}}} (Supplier: {{{supplier}}}, Cost: SGD {{{cost}}})
  {{/each}}
  
  - Evaluate if the margin is healthy (target is 15-25%).
  - Suggest areas where costs might be high or markup could be increased.
  - Flag any missing essential services typical for a {{{category}}} tour.
  {{/if}}

  {{#if (eq type "summary")}}
  PROJECT CATCH-UP SUMMARY:
  Notes: "{{{notes}}}"
  Status: Currently in planning phase.
  - Summarize the customer's core needs.
  - Highlight the most critical "must-haves" based on the enquiry.
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
      const {output} = await prompt(input);
      if (!output) throw new Error('AI failed to generate insights.');
      return output;
    } catch (error: any) {
      console.error('AI Intelligence Error:', error);
      throw new Error(error.message || 'The AI could not process this project request.');
    }
  }
);
