export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image: string | null;
  budget_total: number;
  expense_mode: 'per_trip' | 'split';
  share_token: string | null;
  is_public: boolean;
  created_at: string;
}
