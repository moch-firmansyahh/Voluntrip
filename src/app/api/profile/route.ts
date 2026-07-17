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
    const { fullName, username, oldPassword, newPassword } = body;

    if (!fullName || !username) {
      return NextResponse.json({ error: 'Nama Lengkap dan Username wajib diisi' }, { status: 400 });
    }

    // 1. Fetch user's current record
    const userResult = await sql`
      SELECT id, username, password_hash, full_name
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

    // 3. Process password change if requested
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

    // 4. Update database
    await sql`
      UPDATE users SET
        full_name = ${fullName},
        username = ${username},
        password_hash = ${updatedPasswordHash}
      WHERE id = ${session.userId}
    `;

    // 5. Re-sign session cookie
    const cookieStore = await cookies();
    const newToken = signToken({
      userId: session.userId,
      username: username,
      fullName: fullName,
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
        fullName: fullName
      }
    });

  } catch (error: any) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/profile - Fetch profile stats (e.g. total trips)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const userResult = await sql`
      SELECT username, full_name FROM users WHERE id = ${session.userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Get count of trips
    const tripsCount = await sql`
      SELECT COUNT(id) as count FROM trips WHERE user_id = ${session.userId}
    `;

    // Get count of expenses created by this user
    const expensesCount = await sql`
      SELECT COUNT(id) as count FROM expenses WHERE trip_id IN (
        SELECT id FROM trips WHERE user_id = ${session.userId}
      )
    `;

    return NextResponse.json({
      fullName: userResult[0].full_name,
      username: userResult[0].username,
      tripsCreated: parseInt(tripsCount[0]?.count || 0),
      expensesCreated: parseInt(expensesCount[0]?.count || 0),
    });

  } catch (error: any) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
