import { z } from 'zod';

export const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100),
  destination: z.string().min(1, 'Destination is required').max(100),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date',
  }),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date',
  }),
  cover_image: z.string().optional().or(z.literal('')),
  budget_total: z.coerce.number().min(0, 'Budget must be a positive number'),
  expense_mode: z.enum(['per_trip', 'split']),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
});

export type TripInput = z.infer<typeof tripSchema>;
