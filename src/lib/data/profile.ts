import { sql } from '@/lib/supabase';

export interface ProfileData {
  fullName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  tripsCreated: number;
  expensesCreated: number;
}

/**
 * Fetch profile data and statistics directly from the database (Server Component safe)
 */
export async function getProfileData(userId: string): Promise<ProfileData | null> {
  try {
    // Get user details
    const userResult = await sql`
      SELECT username, full_name, email, avatar_url FROM users WHERE id = ${userId}
    `;

    if (!userResult || userResult.length === 0) {
      return null;
    }

    // Get count of trips
    const tripsCount = await sql`
      SELECT COUNT(id) as count FROM trips WHERE user_id = ${userId}
    `;

    // Get count of total rundown activities
    const activitiesCount = await sql`
      SELECT COUNT(ra.id) as count 
      FROM rundown_activities ra
      JOIN rundown_days rd ON ra.rundown_day_id = rd.id
      JOIN trips t ON rd.trip_id = t.id
      WHERE t.user_id = ${userId}
    `;

    return {
      fullName: userResult[0].full_name,
      username: userResult[0].username,
      email: userResult[0].email,
      avatarUrl: userResult[0].avatar_url,
      tripsCreated: parseInt(tripsCount[0]?.count || 0),
      expensesCreated: parseInt(activitiesCount[0]?.count || 0),
    };
  } catch (error) {
    console.error('Error fetching profile data by user ID:', error);
    return null;
  }
}
