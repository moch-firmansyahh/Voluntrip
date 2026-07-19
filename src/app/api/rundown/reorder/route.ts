import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { activityReorderSchema } from '@/lib/validators/rundown.schema';

// POST /api/rundown/reorder
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = activityReorderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { activities } = result.data;

    if (activities.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Verify all activities belong to the logged-in user's trips
    const activityIds = activities.map(a => a.id);
    const ownershipCheck = await sql`
      SELECT ra.id
      FROM rundown_activities ra
      JOIN rundown_days rd ON ra.rundown_day_id = rd.id
      JOIN trips t ON rd.trip_id = t.id
      WHERE ra.id = ANY(${activityIds}) AND t.user_id = ${session.userId}
    `;

    if (ownershipCheck.length !== activities.length) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run batch updates in a transaction
    await sql.begin(async (sql: any) => {
      for (const act of activities) {
        if (act.start_time && act.end_time) {
          await sql`
            UPDATE rundown_activities SET
              rundown_day_id = ${act.rundown_day_id},
              order_index = ${act.order_index},
              start_time = ${act.start_time},
              end_time = ${act.end_time}
            WHERE id = ${act.id}
          `;
        } else {
          await sql`
            UPDATE rundown_activities SET
              rundown_day_id = ${act.rundown_day_id},
              order_index = ${act.order_index}
            WHERE id = ${act.id}
          `;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/rundown/reorder error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
