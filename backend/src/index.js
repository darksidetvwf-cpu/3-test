import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const projectPath = (id) => path.join(dataDir, `${id}.json`);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'floorplan-backend' });
});

app.get('/api/projects', async (_req, res) => {
  await fs.mkdir(dataDir, { recursive: true });
  const files = (await fs.readdir(dataDir)).filter((f) => f.endsWith('.json'));
  const projects = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.join(dataDir, file), 'utf8');
      const project = JSON.parse(content);
      return { id: project.id, name: project.name, updatedAt: project.updatedAt };
    }),
  );
  projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  res.json(projects);
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const content = await fs.readFile(projectPath(req.params.id), 'utf8');
    res.type('application/json').send(content);
  } catch {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const project = req.body;
  if (!project || !project.id) {
    return res.status(400).json({ error: 'Invalid project payload' });
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(projectPath(req.params.id), JSON.stringify(project, null, 2));
  return res.json({ ok: true, id: req.params.id });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});