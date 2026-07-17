import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { tripSchema } from '@/lib/validators/trip.schema';

// GET /api/trips - List all trips of the logged-in user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trips = await sql`
      SELECT id, user_id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode, share_token, is_public, created_at
      FROM trips
      WHERE user_id = ${session.userId}
      ORDER BY start_date DESC
    `;

    return NextResponse.json(trips);
  } catch (error: any) {
    console.error('GET /api/trips error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = tripSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    
    // Create trip
    const trips = await sql`
      INSERT INTO trips (
        user_id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode
      ) VALUES (
        ${session.userId}, ${data.name}, ${data.destination}, ${data.start_date}, ${data.end_date}, ${data.cover_image || null}, ${data.budget_total}, ${data.expense_mode}
      ) RETURNING *
    `;

    const newTrip = trips[0];

    // Auto-create default expense categories (NFR-6, FR-10)
    const defaultCategories = ['Transportasi', 'Akomodasi', 'Konsumsi', 'Hiburan', 'Lainnya'];
    for (const category of defaultCategories) {
      await sql`
        INSERT INTO expense_categories (trip_id, name)
        VALUES (${newTrip.id}, ${category})
        ON CONFLICT (trip_id, name) DO NOTHING
      `;
    }

    // Auto-populate rundown_days based on date range
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < diffDays; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      const dayDateString = dayDate.toISOString().split('T')[0];

      await sql`
        INSERT INTO rundown_days (trip_id, day_date, order_index)
        VALUES (${newTrip.id}, ${dayDateString}, ${i})
        ON CONFLICT (trip_id, day_date) DO NOTHING
      `;
    }

    return NextResponse.json(newTrip);
  } catch (error: any) {
    console.error('POST /api/trips error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
