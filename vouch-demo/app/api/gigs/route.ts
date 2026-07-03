import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const freelancerEmail = searchParams.get('freelancerEmail');

    const db = await getDb();
    let gigs;

    if (freelancerEmail) {
      gigs = await db.all(
        'SELECT id, name, service_type as serviceType, description, price, preset_id as presetId, freelancer_email as freelancerEmail, freelancer_name as freelancerName, image_url as imageUrl, created_at as createdAt FROM gigs WHERE freelancer_email = ? ORDER BY created_at DESC',
        [freelancerEmail]
      );
    } else {
      gigs = await db.all(
        'SELECT id, name, service_type as serviceType, description, price, preset_id as presetId, freelancer_email as freelancerEmail, freelancer_name as freelancerName, image_url as imageUrl, created_at as createdAt FROM gigs ORDER BY created_at DESC'
      );
    }

    return NextResponse.json(gigs);
  } catch (error: any) {
    console.error('Error fetching gigs from SQLite:', error);
    return NextResponse.json(
      { message: 'Database fetch error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, name, description, serviceType, price, presetId, freelancerEmail, freelancerName, imageUrl } = await req.json();

    if (!id || !name || !description || !serviceType || !price || !presetId || !freelancerEmail || !freelancerName) {
      return NextResponse.json(
        { message: 'Missing required gig fields.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    await db.run(
      `INSERT INTO gigs (id, name, service_type, description, price, preset_id, freelancer_email, freelancer_name, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, serviceType, description, price, presetId, freelancerEmail, freelancerName, imageUrl || null, new Date().toISOString()]
    );

    return NextResponse.json(
      { 
        id, 
        name, 
        description, 
        serviceType, 
        price, 
        presetId, 
        freelancerEmail, 
        freelancerName,
        imageUrl
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating gig in SQLite:', error);
    return NextResponse.json(
      { message: 'Database creation error: ' + error.message },
      { status: 500 }
    );
  }
}
