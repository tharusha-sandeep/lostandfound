import { z } from 'zod';
import { POST_TYPES, CATEGORIES, ZONES } from './constants';

export const postSchema = z.object({
  type: z.string()
    .min(1, 'Please select Lost or Found')
    .refine((v) => POST_TYPES.includes(v), 'Please select Lost or Found'),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must not exceed 120 characters')
    .trim(),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  category: z.string()
    .min(1, 'Please select a category')
    .refine((v) => CATEGORIES.includes(v), 'Please select a category'),
  zone: z.string()
    .min(1, 'Please select a campus zone')
    .refine((v) => ZONES.includes(v), 'Please select a campus zone'),
  incidentDate: z.string()
    .min(1, 'Incident date is required')
    .refine((v) => new Date(v) <= new Date(), {
      message: 'Incident date cannot be in the future',
    }),
});

export default postSchema;
