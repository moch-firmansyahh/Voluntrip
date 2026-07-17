import { z } from 'zod';

export const activitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  location: z.string().optional().or(z.literal('')),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Start time must be in HH:MM format',
  }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'End time must be in HH:MM format',
  }),
  note: z.string().optional().or(z.literal('')),
  order_index: z.coerce.number().int().optional(),
  cost: z.coerce.number().min(0, 'Cost must be positive').default(0),
});

export const activityReorderSchema = z.object({
  activities: z.array(z.object({
    id: z.string().uuid(),
    rundown_day_id: z.string().uuid(),
    order_index: z.coerce.number().int(),
  })),
});

export type ActivityInput = z.infer<typeof activitySchema>;
