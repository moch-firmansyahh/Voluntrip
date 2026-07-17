import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { activitySchema } from '@/lib/validators/rundown.schema';

// Helper to check activity ownership
async function checkActivityOwnership(activityId: string, userId: string) {
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

    const activities = await sql`
      UPDATE rundown_activities SET
        title = ${data.title},
        location = ${data.location || null},
        start_time = ${data.start_time},
        end_time = ${data.end_time},
        note = ${data.note || null}
      WHERE id = ${activityId}
      RETURNING *
    `;

    return NextResponse.json(activities[0]);
  } catch (error: any) {
    console.error('PUT /api/rundown/[activityId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
