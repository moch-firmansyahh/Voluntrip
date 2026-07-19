import { sql } from '@/lib/supabase';
import { Trip } from '@/types/trip';

export interface UnifiedExpenseItem {
  id: string;
  source: 'itinerary' | 'manual';
  title: string;
  category_name?: string;
  category_id?: string | null;
  amount: number;
  expense_date: string;
  note?: string | null;
  location?: string | null;
  activity_id?: string;
  rundown_day_id?: string;
  participants?: { id: string; participant_name: string; share_amount: number }[];
}

export interface ExpensesPageData {
  trip: Trip | null;
  categories: { id: string; name: string }[];
  expenses: UnifiedExpenseItem[];
  totalBudget: number;
  totalItinerarySpend: number;
  totalManualSpend: number;
  totalSpend: number;
  remainingBudget: number;
}

/**
 * Fetch unified expense data for a trip directly from database (Server Component safe)
 */
export async function getTripExpensesData(tripId: string): Promise<ExpensesPageData | null> {
  try {
    // 1. Fetch trip
    const trips = await sql`
      SELECT id, user_id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode, share_token, is_public
      FROM trips
      WHERE id = ${tripId}
      LIMIT 1
    `;

    if (!trips || trips.length === 0) {
      return null;
    }

    const trip = trips[0] as Trip;
    const totalBudget = parseFloat(trip.budget_total as any || 0);

    // 2. Fetch Categories
    const categories = await sql`
      SELECT id, name FROM expense_categories WHERE trip_id = ${tripId} ORDER BY name ASC
    `;

    // 3. Fetch Manual Expenses
    const manualExpenses = await sql`
      SELECT e.id, e.trip_id, e.category_id, e.amount, e.note, e.expense_date, e.created_at, ec.name as category_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.trip_id = ${tripId}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;

    // 4. Fetch Participants for split expenses
    const participants = await sql`
      SELECT ep.id, ep.expense_id, ep.participant_name, ep.share_amount
      FROM expense_participants ep
      JOIN expenses e ON ep.expense_id = e.id
      WHERE e.trip_id = ${tripId}
    `;

    // 5. Fetch Itinerary Activities with cost > 0
    const itineraryActivities = await sql`
      SELECT ra.id, ra.rundown_day_id, ra.title, ra.location, ra.cost, ra.note, rd.day_date
      FROM rundown_activities ra
      JOIN rundown_days rd ON ra.rundown_day_id = rd.id
      WHERE rd.trip_id = ${tripId} AND ra.cost > 0
      ORDER BY rd.day_date ASC, ra.order_index ASC
    `;

    // Combine manual expenses
    const unifiedManual: UnifiedExpenseItem[] = manualExpenses.map((e: any) => ({
      id: e.id,
      source: 'manual',
      title: e.note || e.category_name || 'Pengeluaran Manual',
      category_name: e.category_name || 'Umum',
      category_id: e.category_id,
      amount: parseFloat(e.amount || 0),
      expense_date: e.expense_date instanceof Date ? e.expense_date.toISOString().split('T')[0] : String(e.expense_date).split('T')[0],
      note: e.note,
      participants: participants
        .filter((p: any) => p.expense_id === e.id)
        .map((p: any) => ({
          id: p.id,
          participant_name: p.participant_name,
          share_amount: parseFloat(p.share_amount || 0)
        }))
    }));

    // Combine itinerary expenses
    const unifiedItinerary: UnifiedExpenseItem[] = itineraryActivities.map((act: any) => ({
      id: `itinerary-${act.id}`,
      activity_id: act.id,
      rundown_day_id: act.rundown_day_id,
      source: 'itinerary',
      title: act.title,
      category_name: 'Itinerary Kegiatan',
      amount: parseFloat(act.cost || 0),
      expense_date: act.day_date instanceof Date ? act.day_date.toISOString().split('T')[0] : String(act.day_date).split('T')[0],
      note: act.note,
      location: act.location
    }));

    const allExpenses = [...unifiedManual, ...unifiedItinerary].sort((a, b) => {
      return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
    });

    const totalItinerarySpend = unifiedItinerary.reduce((sum, item) => sum + item.amount, 0);
    const totalManualSpend = unifiedManual.reduce((sum, item) => sum + item.amount, 0);
    const totalSpend = totalItinerarySpend + totalManualSpend;
    const remainingBudget = totalBudget - totalSpend;

    return {
      trip,
      categories,
      expenses: allExpenses,
      totalBudget,
      totalItinerarySpend,
      totalManualSpend,
      totalSpend,
      remainingBudget
    };
  } catch (error) {
    console.error('Error in getTripExpensesData:', error);
    return null;
  }
}
