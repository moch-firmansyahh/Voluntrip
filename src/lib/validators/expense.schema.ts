import { z } from 'zod';

export const expenseParticipantSchema = z.object({
  participant_name: z.string().min(1, 'Participant name is required'),
  share_amount: z.coerce.number().min(0, 'Share amount must be positive'),
});

export const expenseSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  note: z.string().optional().or(z.literal('')),
  expense_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expense date',
  }),
  participants: z.array(expenseParticipantSchema).optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
