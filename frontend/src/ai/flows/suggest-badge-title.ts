'use server';

/**
 * @fileOverview A flow for suggesting a badge title based on content.
 *
 * - suggestBadgeTitle - A function that suggests a badge title.
 * - SuggestBadgeTitleInput - The input type for the suggestBadgeTitle function.
 * - SuggestBadgeTitleOutput - The return type for the suggestBadgeTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBadgeTitleInputSchema = z.object({
  content: z.string().describe('The content to generate a badge title from.'),
});
export type SuggestBadgeTitleInput = z.infer<typeof SuggestBadgeTitleInputSchema>;

const SuggestBadgeTitleOutputSchema = z.object({
  title: z.string().describe('The suggested title for the badge.'),
});
export type SuggestBadgeTitleOutput = z.infer<typeof SuggestBadgeTitleOutputSchema>;

export async function suggestBadgeTitle(input: SuggestBadgeTitleInput): Promise<SuggestBadgeTitleOutput> {
  return suggestBadgeTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBadgeTitlePrompt',
  input: {schema: SuggestBadgeTitleInputSchema},
  output: {schema: SuggestBadgeTitleOutputSchema},
  prompt: `Suggest a relevant title for the badge based on the following content:\n\nContent: {{{content}}}\n\nTitle:`, // Just output the title, nothing else.
});

const suggestBadgeTitleFlow = ai.defineFlow(
  {
    name: 'suggestBadgeTitleFlow',
    inputSchema: SuggestBadgeTitleInputSchema,
    outputSchema: SuggestBadgeTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
