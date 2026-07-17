export interface RundownDay {
  id: string;
  trip_id: string;
  day_date: string;
  order_index: number;
  activities?: RundownActivity[]; // joined helper
}

export interface RundownActivity {
  id: string;
  rundown_day_id: string;
  title: string;
  location: string | null;
  start_time: string;
  end_time: string;
  note: string | null;
  order_index: number;
  cost: number;
}
