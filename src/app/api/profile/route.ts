import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/supabase';
import { getSession, signToken, hashPassword, comparePassword } from '@/lib/auth';

// PUT /api/profile - Update profile details
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, username, email, avatarUrl, oldPassword, newPassword } = body;

    if (!fullName || !username || !email) {
      return NextResponse.json({ error: 'Nama Lengkap, Username, dan Email wajib diisi' }, { status: 400 });
    }

    // 1. Fetch user's current record
    const userResult = await sql`
      SELECT id, username, email, password_hash, full_name, avatar_url
      FROM users
      WHERE id = ${session.userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const currentUser = userResult[0];

    // 2. Check if username is changing and is already taken
    if (username !== currentUser.username) {
      const usernameCheck = await sql`
        SELECT id FROM users WHERE username = ${username} AND id != ${session.userId}
      `;
      if (usernameCheck.length > 0) {
        return NextResponse.json({ error: 'Username sudah digunakan oleh akun lain' }, { status: 400 });
      }
    }

    // 3. Check if email is changing and is already taken
    if (email !== currentUser.email) {
      const emailCheck = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${session.userId}
      `;
      if (emailCheck.length > 0) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain' }, { status: 400 });
      }
    }

    // 4. Process password change if requested
    let updatedPasswordHash = currentUser.password_hash;
    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Password lama wajib dimasukkan untuk mengganti password' }, { status: 400 });
      }
      
      const isPasswordCorrect = comparePassword(oldPassword, currentUser.password_hash);
      if (!isPasswordCorrect) {
        return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }

      updatedPasswordHash = hashPassword(newPassword);
    }

    // 5. Update database
    await sql`
      UPDATE users SET
        full_name = ${fullName},
        username = ${username},
        email = ${email},
        avatar_url = ${avatarUrl || null},
        password_hash = ${updatedPasswordHash}
      WHERE id = ${session.userId}
    `;

    // 6. Re-sign session cookie with avatarUrl
    const cookieStore = await cookies();
    const newToken = signToken({
      userId: session.userId,
      username: username,
      fullName: fullName,
      avatarUrl: avatarUrl || undefined,
    });

    cookieStore.set('voluntrip_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: session.userId,
        username: username,
        fullName: fullName,
        email: email,
        avatarUrl: avatarUrl
      }
    });

  } catch (error: any) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/profile - Fetch profile stats & details (e.g. total trips)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const userResult = await sql`
      SELECT username, full_name, email, avatar_url FROM users WHERE id = ${session.userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Get count of trips
    const tripsCount = await sql`
      SELECT COUNT(id) as count FROM trips WHERE user_id = ${session.userId}
    `;

    // Get count of total rundown activities
    const activitiesCount = await sql`
      SELECT COUNT(ra.id) as count 
      FROM rundown_activities ra
      JOIN rundown_days rd ON ra.rundown_day_id = rd.id
      JOIN trips t ON rd.trip_id = t.id
      WHERE t.user_id = ${session.userId}
    `;

    return NextResponse.json({
      fullName: userResult[0].full_name,
      username: userResult[0].username,
      email: userResult[0].email,
      avatarUrl: userResult[0].avatar_url,
      tripsCreated: parseInt(tripsCount[0]?.count || 0),
      expensesCreated: parseInt(activitiesCount[0]?.count || 0), // Use activities count for stats!
    });

  } catch (error: any) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
