import { sql } from '@/lib/supabase';
import { RundownDay } from '@/types/rundown';

/**
 * Fetch all rundown days and nested activities for a trip directly from the database (Server Component safe)
 */
export async function getRundownByTripId(tripId: string): Promise<RundownDay[]> {
  try {
    // Fetch rundown days
    const days = await sql`
      SELECT id, trip_id, day_date, order_index
      FROM rundown_days
      WHERE trip_id = ${tripId}
      ORDER BY order_index ASC
    `;

    if (!days || days.length === 0) {
      return [];
    }

    const dayIds = days.map((d: any) => d.id);

    // Fetch rundown activities
    const activities = await sql`
      SELECT id, rundown_day_id, title, location, start_time, end_time, note, order_index, cost, latitude, longitude
      FROM rundown_activities
      WHERE rundown_day_id = ANY(${dayIds})
      ORDER BY order_index ASC, start_time ASC
    `;

    // Map activities into their respective days
    return days.map((day: any) => {
      return {
        ...day,
        activities: activities.filter((act: any) => act.rundown_day_id === day.id)
      } as RundownDay;
    });
  } catch (error) {
    console.error('Error fetching rundown by trip ID:', error);
    return [];
  }
}
