'use server';

/**
 * @fileOverview AI flow for suggesting a badge description based on the provided content.
 *
 * - suggestBadgeDescription - Function to generate a badge description.
 * - SuggestBadgeDescriptionInput - Input type for the suggestBadgeDescription function.
 * - SuggestBadgeDescriptionOutput - Output type for the suggestBadgeDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBadgeDescriptionInputSchema = z.object({
  content: z
    .string()
    .describe('The content to generate a badge description from.'),
});
export type SuggestBadgeDescriptionInput = z.infer<
  typeof SuggestBadgeDescriptionInputSchema
>;

const SuggestBadgeDescriptionOutputSchema = z.object({
  description: z.string().describe('The suggested badge description.'),
});
export type SuggestBadgeDescriptionOutput = z.infer<
  typeof SuggestBadgeDescriptionOutputSchema
>;

export async function suggestBadgeDescription(
  input: SuggestBadgeDescriptionInput
): Promise<SuggestBadgeDescriptionOutput> {
  return suggestBadgeDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBadgeDescriptionPrompt',
  input: {schema: SuggestBadgeDescriptionInputSchema},
  output: {schema: SuggestBadgeDescriptionOutputSchema},
  prompt: `You are an expert badge description writer.

  Based on the following content, generate a concise and engaging description for a badge:

  Content: {{{content}}}
  `,
});

const suggestBadgeDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestBadgeDescriptionFlow',
    inputSchema: SuggestBadgeDescriptionInputSchema,
    outputSchema: SuggestBadgeDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
