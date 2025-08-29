'use server';

/**
 * @fileOverview Analyzes the content provided by the user to understand its context and key themes.
 *
 * - analyzeBadgeContent - A function that handles the content analysis process.
 * - AnalyzeBadgeContentInput - The input type for the analyzeBadgeContent function.
 * - AnalyzeBadgeContentOutput - The return type for the analyzeBadgeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBadgeContentInputSchema = z.object({
  content: z
    .string()
    .describe('The content to be analyzed for context and key themes.'),
});
export type AnalyzeBadgeContentInput = z.infer<typeof AnalyzeBadgeContentInputSchema>;

const AnalyzeBadgeContentOutputSchema = z.object({
  context: z
    .string()
    .describe('A summary of the context of the content.'),
  themes: z
    .string()
    .describe('A comma separated list of the key themes in the content.'),
});
export type AnalyzeBadgeContentOutput = z.infer<typeof AnalyzeBadgeContentOutputSchema>;

export async function analyzeBadgeContent(input: AnalyzeBadgeContentInput): Promise<AnalyzeBadgeContentOutput> {
  return analyzeBadgeContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBadgeContentPrompt',
  input: {schema: AnalyzeBadgeContentInputSchema},
  output: {schema: AnalyzeBadgeContentOutputSchema},
  prompt: `You are an expert content analyst.

You will analyze the content provided by the user to understand its context and key themes.

Content: {{{content}}}

Context: Summarize the context of the content.
Themes: List the key themes in the content, separated by commas.

Context:
Themes:`, // The prompt was corrected to remove handlebars calls in Themes/Context.
});

const analyzeBadgeContentFlow = ai.defineFlow(
  {
    name: 'analyzeBadgeContentFlow',
    inputSchema: AnalyzeBadgeContentInputSchema,
    outputSchema: AnalyzeBadgeContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
