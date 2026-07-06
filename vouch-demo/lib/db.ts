import fs from 'fs';
import path from 'path';

// Save the plica.json in Vercel's writable /tmp directory
const DB_FILE = path.join('/tmp', 'plica.json');

class JsonDatabase {
  private data: {
    users: any[];
    gigs: any[];
  } = { users: [], gigs: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      } else {
        this.data = { users: [], gigs: [] };
      }
    } catch (e) {
      this.data = { users: [], gigs: [] };
    }
    // Ensure lists are initialized
    this.data.users = this.data.users || [];
    this.data.gigs = this.data.gigs || [];
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save json db:', e);
    }
  }

  async exec(sql: string): Promise<void> {
    return;
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    this.load();
    const query = sql.toLowerCase();
    
    if (query.includes('select * from users where email = ?')) {
      const email = params[0];
      const user = this.data.users.find(u => u.email === email);
      return user ? { ...user } : null;
    }
    
    if (query.includes('select count(*) as count from gigs')) {
      return { count: this.data.gigs.length };
    }
    
    if (query.includes('select count(*) as count from users')) {
      return { count: this.data.users.length };
    }
    
    return null;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    this.load();
    const query = sql.toLowerCase();
    
    if (query.includes('from gigs')) {
      if (query.includes('where freelancer_email = ?') || query.includes('freelancer_email = ?')) {
        const email = params[0];
        return this.data.gigs.filter(g => g.freelancerEmail === email || g.freelancer_email === email);
      }
      return [...this.data.gigs];
    }
    
    return [];
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    this.load();
    const query = sql.toLowerCase();
    
    if (query.includes('insert into users')) {
      const [email, name, password, role, is_verified, created_at] = params;
      this.data.users = this.data.users.filter(u => u.email !== email);
      this.data.users.push({
        email,
        name,
        password,
        role,
        is_verified: Number(is_verified),
        created_at
      });
      this.save();
    }
    
    else if (query.includes('insert into gigs')) {
      const [id, name, service_type, description, price, preset_id, freelancer_email, freelancer_name, image_url, created_at] = params;
      this.data.gigs = this.data.gigs.filter(g => g.id !== id);
      this.data.gigs.push({
        id,
        name,
        service_type,
        serviceType: service_type,
        description,
        price: Number(price),
        preset_id,
        presetId: preset_id,
        freelancer_email,
        freelancerEmail: freelancer_email,
        freelancer_name,
        freelancerName: freelancer_name,
        image_url,
        imageUrl: image_url,
        created_at
      });
      this.save();
    }
    
    else if (query.includes('update users set is_verified = 1')) {
      const email = params[0];
      const user = this.data.users.find(u => u.email === email);
      if (user) {
        user.is_verified = 1;
        this.save();
      }
    }
  }
}

let dbConnection: any = null;

export async function getDb(): Promise<any> {
  if (dbConnection) return dbConnection;

  dbConnection = new JsonDatabase();

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
    
    console.log('✓ Mock gigs seeded in SQLite (JSON file mode).');
  }

  // Seed mock users if empty
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
    
    console.log('✓ Mock users seeded in SQLite (JSON file mode).');
  }

  // Sync verification statuses to Vouch backend asynchronously
  const mockEmails = ['jane.design@gmail.com', 'samuel.dev@gmail.com', 'sarah.write@gmail.com'];
  for (const email of mockEmails) {
    fetch('https://vouchsdk.onrender.com/developer/mark-verified', {
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
