'use server';

import { suggestBadgeTitle } from '@/ai/flows/suggest-badge-title';
import { suggestBadgeDescription } from '@/ai/flows/suggest-badge-description';
import { suggestEarningCriteria } from '@/ai/flows/suggest-earning-criteria';
import { suggestBadgeImage } from '@/ai/flows/suggest-badge-image';

export async function generateSuggestions(content: string) {
  try {
    const [titleRes, descriptionRes, criteriaRes, imageRes] = await Promise.all([
      suggestBadgeTitle({ content }),
      suggestBadgeDescription({ content }),
      suggestEarningCriteria({ content }),
      suggestBadgeImage({ content }),
    ]);
    return {
      title: titleRes.title,
      description: descriptionRes.description,
      criteria: criteriaRes.criteria,
      image: imageRes.imageUrl,
    };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return {
      error:
        'An error occurred while generating suggestions. Please try again.',
    };
  }
}
