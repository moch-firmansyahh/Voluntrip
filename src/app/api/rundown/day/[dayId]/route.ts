import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

// Helper to add days to a date string
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// DELETE /api/rundown/day/[dayId] - Delete a day and re-sequence remaining days
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dayId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dayId } = await params;

    // 1. Verify ownership of the trip containing this rundown day
    const dayCheck = await sql`
      SELECT rd.id, rd.trip_id, t.start_date
      FROM rundown_days rd
      JOIN trips t ON rd.trip_id = t.id
      WHERE rd.id = ${dayId} AND t.user_id = ${session.userId}
    `;

    if (!dayCheck || dayCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tripId = dayCheck[0].trip_id;
    const startDate = dayCheck[0].start_date; // date string or Date object

    // 2. Delete the day (cascading deletes all activities of this day)
    await sql`
      DELETE FROM rundown_days WHERE id = ${dayId}
    `;

    // 3. Fetch remaining days for the trip, sorted by order_index
    const remainingDays = await sql`
      SELECT id, day_date, order_index
      FROM rundown_days
      WHERE trip_id = ${tripId}
      ORDER BY order_index ASC
    `;

    // 4. Re-sequence order_index and shift dates contiguously
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    let latestEndDateStr = startDateStr;

    for (let i = 0; i < remainingDays.length; i++) {
      const nextDate = addDays(startDateStr, i);
      latestEndDateStr = nextDate;
      
      await sql`
        UPDATE rundown_days SET
          order_index = ${i},
          day_date = ${nextDate}
        WHERE id = ${remainingDays[i].id}
      `;
    }

    // 5. Update the trip's end_date to match the new duration
    await sql`
      UPDATE trips SET
        end_date = ${latestEndDateStr}
      WHERE id = ${tripId}
    `;

    return NextResponse.json({ success: true, newEndDate: latestEndDateStr });

  } catch (error: any) {
    console.error('DELETE /api/rundown/day/[dayId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
