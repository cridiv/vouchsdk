import { open, Database } from 'sqlite';
import path from 'path';

let dbConnection: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbConnection) return dbConnection;

  // Lazy-load sqlite3 to prevent native binary GLIBC execution errors during Vercel build-time inspection
  const sqlite3 = require('sqlite3');

  // Save the plica.db in the vouch-demo root directory
  const dbPath = path.resolve(process.cwd(), 'plica.db');
  
  dbConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbConnection.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await dbConnection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  await dbConnection.exec(`
    CREATE TABLE IF NOT EXISTS gigs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      preset_id TEXT NOT NULL,
      freelancer_email TEXT NOT NULL,
      freelancer_name TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Ensure image_url column is added if table already existed from previous runs
  try {
    await dbConnection.exec('ALTER TABLE gigs ADD COLUMN image_url TEXT');
  } catch (e) {
    // Column already exists
  }

  // Seed mock gigs if empty
  const gigCount = await dbConnection.get('SELECT COUNT(*) as count FROM gigs');
  if (gigCount.count === 0) {
    const mockGigs = [
      {
        id: 'gig_mock_1',
        name: "Sleek SaaS Landing Page Design (Figma)",
        serviceType: "UI/UX Design",
        price: 35000,
        description: "Professional high-fidelity mobile-responsive UI design. Fully component-based design systems ready for development.",
        presetId: "design",
        freelancerEmail: "jane.design@gmail.com",
        freelancerName: "Jane Doe",
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: 'gig_mock_2',
        name: "Production-ready Next.js Web App Setup",
        serviceType: "Software Development",
        price: 75000,
        description: "Setup NextJS app router with TailwindCSS, Lucide Icons, ESLint, Prettier and database integrations. Guaranteed clean architecture.",
        presetId: "dev",
        freelancerEmail: "samuel.dev@gmail.com",
        freelancerName: "Samuel Adebayo",
        imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: 'gig_mock_3',
        name: "Copywriting & Landing Page Copy",
        serviceType: "Content Writing",
        price: 15000,
        description: "Engaging and high-converting marketing copywriting for your software product landing pages, about section, and feature cards.",
        presetId: "writing",
        freelancerEmail: "sarah.write@gmail.com",
        freelancerName: "Sarah Jenkins",
        imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop"
      }
    ];

    for (const gig of mockGigs) {
      await dbConnection.run(`
        INSERT INTO gigs (id, name, service_type, description, price, preset_id, freelancer_email, freelancer_name, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gig.id,
        gig.name,
        gig.serviceType,
        gig.description,
        gig.price,
        gig.presetId,
        gig.freelancerEmail,
        gig.freelancerName,
        gig.imageUrl,
        new Date().toISOString()
      ]);
    }
    
    console.log('✓ Mock gigs seeded in SQLite.');
  }

  // Seed mock users in users table so they can be logged in during tests
  const userCount = await dbConnection.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const mockUsers = [
      { email: 'jane.design@gmail.com', name: 'Jane Doe', password: 'password', role: 'FREELANCER', isVerified: 1 },
      { email: 'samuel.dev@gmail.com', name: 'Samuel Adebayo', password: 'password', role: 'FREELANCER', isVerified: 1 },
      { email: 'sarah.write@gmail.com', name: 'Sarah Jenkins', password: 'password', role: 'FREELANCER', isVerified: 1 }
    ];

    for (const mu of mockUsers) {
      await dbConnection.run(`
        INSERT INTO users (email, name, password, role, is_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        mu.email,
        mu.name,
        mu.password,
        mu.role,
        mu.isVerified,
        new Date().toISOString()
      ]);
    }
    
    console.log('✓ Mock users seeded in SQLite.');
  }

  // Sync verification statuses to Vouch backend asynchronously
  const mockEmails = ['jane.design@gmail.com', 'samuel.dev@gmail.com', 'sarah.write@gmail.com'];
  for (const email of mockEmails) {
    fetch('http://localhost:5000/developer/mark-verified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_VOUCH_API_KEY || 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845'
      },
      body: JSON.stringify({ externalUserId: email })
    })
      .then((res) => {
        if (res.ok) {
          console.log(`✓ Verification Synced: ${email} marked as verified in Vouch core backend.`);
        }
      })
      .catch(() => {
        // Backend offline or unavailable at startup, which is fine
      });
  }

  return dbConnection;
}
