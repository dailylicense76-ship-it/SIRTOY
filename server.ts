import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
import { installations } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API: Register or ping installation telemetry
app.post('/api/telemetry/register', async (req, res) => {
  try {
    const { machineId, clientName, platform, location } = req.body;
    if (!machineId) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    // Upsert installation in Cloud SQL
    const existing = await db.select().from(installations).where(eq(installations.machineId, machineId));
    if (existing.length > 0) {
      await db.update(installations)
        .set({
          clientName: clientName || existing[0].clientName,
          platform: platform || existing[0].platform,
          location: location || existing[0].location,
          status: 'Online',
          lastActive: new Date(),
        })
        .where(eq(installations.machineId, machineId));
    } else {
      await db.insert(installations).values({
        machineId,
        clientName: clientName || 'Trial Client',
        platform: platform || 'Windows Desktop',
        location: location || 'General Branch',
        status: 'Online',
      });
    }

    res.json({ success: true, message: 'Installation registered successfully' });
  } catch (err: any) {
    console.error('Error registering telemetry:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// API: Fetch all installations for developer dashboard
app.get('/api/telemetry/installations', async (req, res) => {
  try {
    const list = await db.select().from(installations);
    res.json(list);
  } catch (err: any) {
    console.error('Error fetching installations:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Setup Vite middleware in development or static serve in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
