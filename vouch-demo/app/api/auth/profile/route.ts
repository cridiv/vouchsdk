import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: 'Email query parameter is required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found in database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.is_verified === 1
    });
  } catch (error: any) {
    console.error('Error fetching SQLite user profile:', error);
    return NextResponse.json(
      { message: 'Database query error: ' + error.message },
      { status: 500 }
    );
  }
}
