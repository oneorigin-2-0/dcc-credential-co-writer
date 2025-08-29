import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-badge-content.ts';
import '@/ai/flows/suggest-badge-description.ts';
import '@/ai/flows/suggest-badge-title.ts';
import '@/ai/flows/suggest-earning-criteria.ts';
import '@/ai/flows/suggest-badge-image.ts';
