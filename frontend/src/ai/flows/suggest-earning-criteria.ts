'use server';

/**
 * @fileOverview Suggests earning criteria for a badge based on the provided content.
 *
 * - suggestEarningCriteria - A function that suggests earning criteria for a badge.
 * - SuggestEarningCriteriaInput - The input type for the suggestEarningCriteria function.
 * - SuggestEarningCriteriaOutput - The return type for the suggestEarningCriteria function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEarningCriteriaInputSchema = z.object({
  content: z.string().describe('The content of the badge, which could be text or a description of the badge.'),
});
export type SuggestEarningCriteriaInput = z.infer<typeof SuggestEarningCriteriaInputSchema>;

const SuggestEarningCriteriaOutputSchema = z.object({
  criteria: z.string().describe('The suggested criteria for earning the badge.'),
});
export type SuggestEarningCriteriaOutput = z.infer<typeof SuggestEarningCriteriaOutputSchema>;

export async function suggestEarningCriteria(input: SuggestEarningCriteriaInput): Promise<SuggestEarningCriteriaOutput> {
  return suggestEarningCriteriaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEarningCriteriaPrompt',
  input: {schema: SuggestEarningCriteriaInputSchema},
  output: {schema: SuggestEarningCriteriaOutputSchema},
  prompt: `Based on the following badge content, suggest criteria for earning the badge. The criteria should be clear, achievable, and relevant to the badge's purpose.\n\nContent: {{{content}}}`,
});

const suggestEarningCriteriaFlow = ai.defineFlow(
  {
    name: 'suggestEarningCriteriaFlow',
    inputSchema: SuggestEarningCriteriaInputSchema,
    outputSchema: SuggestEarningCriteriaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
