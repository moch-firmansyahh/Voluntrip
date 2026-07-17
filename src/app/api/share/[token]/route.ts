import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase';

// GET /api/share/[token] - Fetch public trip info
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 1. Fetch trip using share token
    const trips = await sql`
      SELECT id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode, share_token, is_public, created_at
      FROM trips
      WHERE share_token = ${token} AND is_public = true
      LIMIT 1
    `;

    if (!trips || trips.length === 0) {
      return NextResponse.json({ error: 'Public trip not found or link disabled' }, { status: 404 });
    }

    const trip = trips[0];
    const tripId = trip.id;

    // 2. Fetch rundown days & activities
    const days = await sql`
      SELECT id, day_date, order_index
      FROM rundown_days
      WHERE trip_id = ${tripId}
      ORDER BY order_index ASC
    `;

    let rundown = [];
    if (days.length > 0) {
      const dayIds = days.map((d: any) => d.id);
      const activities = await sql`
        SELECT id, rundown_day_id, title, location, start_time, end_time, note, order_index
        FROM rundown_activities
        WHERE rundown_day_id = ANY(${dayIds})
        ORDER BY order_index ASC, start_time ASC
      `;

      rundown = days.map((day: any) => {
        day.activities = activities.filter((act: any) => act.rundown_day_id === day.id);
        return day;
      });
    }

    // 3. Fetch expenses & categories for budget visualizer
    const categories = await sql`
      SELECT id, name FROM expense_categories WHERE trip_id = ${tripId}
    `;

    const expenses = await sql`
      SELECT e.id, e.category_id, e.amount, e.note, e.expense_date, ec.name as category_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.trip_id = ${tripId}
      ORDER BY e.expense_date DESC
    `;

    // Fetch split participants if in split mode
    let participants: any[] = [];
    if (trip.expense_mode === 'split') {
      participants = await sql`
        SELECT ep.id, ep.expense_id, ep.participant_name, ep.share_amount
        FROM expense_participants ep
        JOIN expenses e ON ep.expense_id = e.id
        WHERE e.trip_id = ${tripId}
      `;
    }

    const expensesWithParticipants = expenses.map((expense: any) => {
      expense.participants = participants.filter((p: any) => p.expense_id === expense.id);
      // Ensure numerical type
      expense.amount = parseFloat(expense.amount);
      expense.participants.forEach((p: any) => {
        p.share_amount = parseFloat(p.share_amount);
      });
      return expense;
    });

    return NextResponse.json({
      trip,
      rundown,
      categories,
      expenses: expensesWithParticipants,
    });
  } catch (error: any) {
    console.error('GET /api/share/[token] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
