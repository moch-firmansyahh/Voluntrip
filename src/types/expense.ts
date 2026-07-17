export interface ExpenseCategory {
  id: string;
  trip_id: string;
  name: string;
}

export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  participant_name: string;
  share_amount: number;
}

export interface Expense {
  id: string;
  trip_id: string;
  category_id: string | null;
  amount: number;
  note: string | null;
  expense_date: string;
  created_at: string;
  category_name?: string; // joined helper
  participants?: ExpenseParticipant[]; // joined helper
}
