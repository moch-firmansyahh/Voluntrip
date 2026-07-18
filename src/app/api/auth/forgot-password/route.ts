import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, newPassword } = body;

    if (!username || !email || !newPassword) {
      return NextResponse.json({ error: 'Username, Email, dan Password Baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    // 1. Verify if username and email match
    const userResult = await sql`
      SELECT id FROM users 
      WHERE username = ${username} AND email = ${email}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'Username dan Email tidak cocok atau tidak terdaftar' }, { status: 400 });
    }

    const userId = userResult[0].id;
    const newHash = hashPassword(newPassword);

    // 2. Update user password
    await sql`
      UPDATE users 
      SET password_hash = ${newHash}
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, message: 'Password berhasil direset' });
  } catch (error: any) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
