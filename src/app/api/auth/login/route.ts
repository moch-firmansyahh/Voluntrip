import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/supabase';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query user by username
    const users = await sql`
      SELECT id, username, password_hash, full_name 
      FROM users 
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = users[0];
    const isPasswordCorrect = comparePassword(password, user.password_hash);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('voluntrip_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
      },
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please ensure your database is connected.' },
      { status: 500 }
    );
  }
}
