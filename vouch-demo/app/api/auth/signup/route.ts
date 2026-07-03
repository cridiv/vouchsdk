import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { message: 'Missing required signup fields.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Insert user into SQLite
    await db.run(
      `INSERT INTO users (email, name, password, role, is_verified, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [email, name, password, role, new Date().toISOString()]
    );

    return NextResponse.json(
      { 
        email, 
        name, 
        role, 
        isVerified: false 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during SQLite signup:', error);
    return NextResponse.json(
      { message: 'Database signup error: ' + error.message },
      { status: 500 }
    );
  }
}
