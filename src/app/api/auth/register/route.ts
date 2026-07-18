import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/supabase';
import { hashPassword, signToken } from '@/lib/auth';

// POST /api/auth/register - Register a new user with email, fullName, and avatarUrl
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, avatarUrl } = body;

    // 1. Basic validation
    if (!email || !fullName) {
      return NextResponse.json({ error: 'Email dan Nama Lengkap wajib diisi' }, { status: 400 });
    }

    // Check if email format is valid
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    // 2. Check if email is already registered
    const emailCheck = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (emailCheck.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Silakan gunakan menu lupa password jika Anda lupa kredensial.' }, { status: 400 });
    }

    // 3. Auto-generate a unique username from the email address
    let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!baseUsername) baseUsername = 'user';
    
    let username = baseUsername;
    let counter = 1;
    while (true) {
      const usernameCheck = await sql`
        SELECT id FROM users WHERE username = ${username}
      `;
      if (usernameCheck.length === 0) {
        break;
      }
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // 4. Set a default password of '123456' (user can change this in Profile settings)
    const passwordHash = hashPassword('123456');

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
