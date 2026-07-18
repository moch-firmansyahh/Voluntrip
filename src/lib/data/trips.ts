import { sql } from '@/lib/supabase';
import { Trip } from '@/types/trip';

/**
 * Fetch a single trip by ID directly from the database (Server Component safe)
 */
export async function getTripById(tripId: string): Promise<Trip | null> {
  try {
    const result = await sql`
      SELECT id, user_id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode, share_token, is_public, created_at
      FROM trips
      WHERE id = ${tripId}
      LIMIT 1
    `;
    if (!result || result.length === 0) return null;
    return result[0] as Trip;
  } catch (error) {
    console.error('Error fetching trip by ID:', error);
    return null;
  }
}

/**
 * Fetch all trips for a given user directly from the database
 */
export async function getTripsByUserId(userId: string): Promise<Trip[]> {
  try {
    return await sql`
      SELECT id, user_id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode, share_token, is_public, created_at
      FROM trips
      WHERE user_id = ${userId}
      ORDER BY start_date DESC
    `;
  } catch (error) {
    console.error('Error fetching trips by user ID:', error);
    return [];
  }
}
