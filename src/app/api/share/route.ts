import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';

// Helper to check trip ownership
async function checkTripOwnership(tripId: string, userId: string) {
  const result = await sql`
    SELECT id FROM trips WHERE id = ${tripId} AND user_id = ${userId}
  `;
  return result && result.length > 0;
}

// POST /api/share - Toggle public link sharing
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, isPublic } = await request.json();

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const isOwner = await checkTripOwnership(tripId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let shareToken = null;
    if (isPublic) {
      // Generate a secure random token (NFR-7)
      shareToken = crypto.randomBytes(16).toString('hex');
    }

    const trips = await sql`
      UPDATE trips SET
        is_public = ${!!isPublic},
        share_token = ${shareToken}
      WHERE id = ${tripId}
      RETURNING id, is_public, share_token
    `;

    return NextResponse.json(trips[0]);
  } catch (error: any) {
    console.error('POST /api/share error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
