import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { tripSchema } from '@/lib/validators/trip.schema';

// Helper to check ownership
async function checkTripOwnership(tripId: string, userId: string) {
  const result = await sql`
    SELECT id FROM trips WHERE id = ${tripId} AND user_id = ${userId}
  `;
  return result && result.length > 0;
}

// GET /api/trips/[tripId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = await params;

    const trips = await sql`
      SELECT id, user_id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode, share_token, is_public, created_at
      FROM trips
      WHERE id = ${tripId} AND user_id = ${session.userId}
      LIMIT 1
    `;

    if (!trips || trips.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(trips[0]);
  } catch (error: any) {
    console.error('GET /api/trips/[tripId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/trips/[tripId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = await params;
    const isOwner = await checkTripOwnership(tripId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = tripSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Get previous dates to see if dates changed
    const prevTrips = await sql`SELECT start_date, end_date FROM trips WHERE id = ${tripId}`;
    const prevTrip = prevTrips[0];

    // Update trip
    const trips = await sql`
      UPDATE trips SET
        name = ${data.name},
        destination = ${data.destination},
        start_date = ${data.start_date},
        end_date = ${data.end_date},
        cover_image = ${data.cover_image || null},
        budget_total = ${data.budget_total},
        expense_mode = ${data.expense_mode}
      WHERE id = ${tripId} AND user_id = ${session.userId}
      RETURNING *
    `;

    // If dates changed, update or rebuild rundown days
    if (prevTrip.start_date !== data.start_date || prevTrip.end_date !== data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Keep existing days that fall into the new date range, delete days that don't
      // and add new ones.
      const dayDates: string[] = [];
      for (let i = 0; i < diffDays; i++) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + i);
        dayDates.push(dayDate.toISOString().split('T')[0]);
      }

      // Delete days outside range
      await sql`
        DELETE FROM rundown_days 
        WHERE trip_id = ${tripId} AND NOT (day_date = ANY(${dayDates}))
      `;

      // Insert new days or update index
      for (let i = 0; i < dayDates.length; i++) {
        await sql`
          INSERT INTO rundown_days (trip_id, day_date, order_index)
          VALUES (${tripId}, ${dayDates[i]}, ${i})
          ON CONFLICT (trip_id, day_date) DO UPDATE SET order_index = ${i}
        `;
      }
    }

    return NextResponse.json(trips[0]);
  } catch (error: any) {
    console.error('PUT /api/trips/[tripId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/trips/[tripId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = await params;
    const isOwner = await checkTripOwnership(tripId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      DELETE FROM trips
      WHERE id = ${tripId} AND user_id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/trips/[tripId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
