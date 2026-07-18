import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { activitySchema } from '@/lib/validators/rundown.schema';

function isValidUUID(uuid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// Helper to check activity ownership
async function checkActivityOwnership(activityId: string, userId: string) {
  if (!isValidUUID(activityId) || !isValidUUID(userId)) {
    return false;
  }
  const result = await sql`
    SELECT ra.id 
    FROM rundown_activities ra
    JOIN rundown_days rd ON ra.rundown_day_id = rd.id
    JOIN trips t ON rd.trip_id = t.id
    WHERE ra.id = ${activityId} AND t.user_id = ${userId}
  `;
  return result && result.length > 0;
}

// DELETE /api/rundown/[activityId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId } = await params;
    const isOwner = await checkActivityOwnership(activityId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      DELETE FROM rundown_activities WHERE id = ${activityId}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/rundown/[activityId] error:', error);
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

// PUT /api/rundown/[activityId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId } = await params;
    const isOwner = await checkActivityOwnership(activityId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = activitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Fetch current activity to check if location has changed
    const currentActivity = await sql`
      SELECT location, latitude, longitude FROM rundown_activities WHERE id = ${activityId}
    `;
    
    let latitude = currentActivity[0]?.latitude || null;
    let longitude = currentActivity[0]?.longitude || null;

    if (data.location !== currentActivity[0]?.location) {
      if (data.location) {
        const coords = await geocodeLocation(data.location);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lon;
        } else {
          latitude = null;
          longitude = null;
        }
      } else {
        latitude = null;
        longitude = null;
      }
    }

    const activities = await sql`
      UPDATE rundown_activities SET
        title = ${data.title},
        location = ${data.location || null},
        start_time = ${data.start_time},
        end_time = ${data.end_time},
        note = ${data.note || null},
        cost = ${data.cost},
        latitude = ${latitude},
        longitude = ${longitude}
      WHERE id = ${activityId}
      RETURNING *
    `;

    return NextResponse.json(activities[0]);
  } catch (error: any) {
    console.error('PUT /api/rundown/[activityId] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
