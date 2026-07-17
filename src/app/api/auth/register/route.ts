import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/supabase';
import { hashPassword, signToken } from '@/lib/auth';

// POST /api/auth/register - Register a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password, fullName, avatarUrl } = body;

    // 1. Basic validation
    if (!email || !username || !password || !fullName) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // 2. Check if username is already taken
    const usernameCheck = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;
    if (usernameCheck.length > 0) {
      return NextResponse.json({ error: 'Username sudah terdaftar' }, { status: 400 });
    }

    // 3. Check if email is already taken
    const emailCheck = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (emailCheck.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // 4. Hash the password
    const passwordHash = hashPassword(password);

    // 5. Insert new user into database
    const insertResult = await sql`
      INSERT INTO users (email, username, password_hash, full_name, avatar_url)
      VALUES (${email}, ${username}, ${passwordHash}, ${fullName}, ${avatarUrl || null})
      RETURNING id, username, full_name, avatar_url
    `;

    const newUser = insertResult[0];

    // 6. Sign JWT session token
    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      fullName: newUser.full_name,
      avatarUrl: newUser.avatar_url || undefined,
    });

    // 7. Set HTTP-only session cookie (expires in 7 days)
    const cookieStore = await cookies();
    cookieStore.set('voluntrip_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: newUser.id,
        username: newUser.username,
        fullName: newUser.full_name,
        avatarUrl: newUser.avatar_url,
      }
    });

  } catch (error: any) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
