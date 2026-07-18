import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { activitySchema } from '@/lib/validators/rundown.schema';

// Helper to check trip ownership
async function checkTripOwnership(tripId: string, userId: string) {
  const result = await sql`
    SELECT id FROM trips WHERE id = ${tripId} AND user_id = ${userId}
  `;
  return result && result.length > 0;
}

// GET /api/rundown?tripId=...
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const isOwner = await checkTripOwnership(tripId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch rundown days
    const days = await sql`
      SELECT id, trip_id, day_date, order_index
      FROM rundown_days
      WHERE trip_id = ${tripId}
      ORDER BY order_index ASC
    `;

    if (days.length === 0) {
      return NextResponse.json([]);
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
    const daysWithActivities = days.map((day: any) => {
      day.activities = activities.filter((act: any) => act.rundown_day_id === day.id);
      return day;
    });

    return NextResponse.json(daysWithActivities);
  } catch (error: any) {
    console.error('GET /api/rundown error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Server-side Geocoding helper using Nominatim
async function geocodeLocation(locationName: string): Promise<{ lat: number; lon: number } | null> {
  if (!locationName) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`, {
      headers: {
        'User-Agent': 'Voluntrip-App/1.0 (contact@voluntrip.com)'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
    }
  } catch (error) {
    console.error('Server geocoding error for location:', locationName, error);
  }
  return null;
}

// POST /api/rundown - Add a new activity
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rundownDayId, ...activityData } = body;

    if (!rundownDayId) {
      return NextResponse.json({ error: 'rundownDayId is required' }, { status: 400 });
    }

    // Verify ownership of the trip containing this rundown day
    const ownershipCheck = await sql`
      SELECT rd.id 
      FROM rundown_days rd
      JOIN trips t ON rd.trip_id = t.id
      WHERE rd.id = ${rundownDayId} AND t.user_id = ${session.userId}
    `;

    if (!ownershipCheck || ownershipCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = activitySchema.safeParse(activityData);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Get current max order_index for this day
    const maxOrder = await sql`
      SELECT MAX(order_index) as max_idx FROM rundown_activities WHERE rundown_day_id = ${rundownDayId}
    `;
    const nextIndex = (maxOrder[0]?.max_idx !== null ? maxOrder[0].max_idx : -1) + 1;

    // Geocode location on server
    const coords = data.location ? await geocodeLocation(data.location) : null;
    const latitude = coords ? coords.lat : null;
    const longitude = coords ? coords.lon : null;

    // Insert activity
    const activities = await sql`
      INSERT INTO rundown_activities (
        rundown_day_id, title, location, start_time, end_time, note, order_index, cost, latitude, longitude
      ) VALUES (
        ${rundownDayId}, ${data.title}, ${data.location || null}, ${data.start_time}, ${data.end_time}, ${data.note || null}, ${nextIndex}, ${data.cost}, ${latitude}, ${longitude}
      ) RETURNING *
    `;

    return NextResponse.json(activities[0]);
  } catch (error: any) {
    console.error('POST /api/rundown error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
