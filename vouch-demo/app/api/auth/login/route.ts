import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Look up user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json(
        { message: 'No account registered with this email. Please sign up!' },
        { status: 404 }
      );
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json(
        { message: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.is_verified === 1
    });
  } catch (error: any) {
    console.error('Error during SQLite login:', error);
    return NextResponse.json(
      { message: 'Database login error: ' + error.message },
      { status: 500 }
    );
  }
}
