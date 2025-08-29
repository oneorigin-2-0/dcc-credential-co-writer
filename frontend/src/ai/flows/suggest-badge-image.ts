'use server';

/**
 * @fileOverview A flow for suggesting a badge image based on content.
 *
 * - suggestBadgeImage - A function that suggests a badge image.
 * - SuggestBadgeImageInput - The input type for the suggestBadgeImage function.
 * - SuggestBadgeImageOutput - The return type for the suggestBadgeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBadgeImageInputSchema = z.object({
  content: z.string().describe('The content to generate a badge image from.'),
});
export type SuggestBadgeImageInput = z.infer<typeof SuggestBadgeImageInputSchema>;

const SuggestBadgeImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the suggested image for the badge.'),
});
export type SuggestBadgeImageOutput = z.infer<typeof SuggestBadgeImageOutputSchema>;

export async function suggestBadgeImage(input: SuggestBadgeImageInput): Promise<SuggestBadgeImageOutput> {
  return suggestBadgeImageFlow(input);
}

const suggestBadgeImageFlow = ai.defineFlow(
  {
    name: 'suggestBadgeImageFlow',
    inputSchema: SuggestBadgeImageInputSchema,
    outputSchema: SuggestBadgeImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate a vector-style, circular badge icon representing the following content. The badge should have a clean, modern aesthetic. Content: ${input.content}`,
    });
    return {
        imageUrl: media!.url!
    };
  }
);
