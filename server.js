'use strict';
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

app.use(express.json());
app.use(express.static(__dirname, {
  index: 'index.html',
  // Don't expose the data directory
  dotfiles: 'deny',
}));

function ensureDataFile() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function loadEvents() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveEvents(events) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
}

// Hash-based timing-safe compare (handles differing lengths safely)
function safeCompare(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function checkAuth(req, res) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    res.status(503).json({ error: 'Admin credentials not configured on server' });
    return false;
  }

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  let reqUser = '', reqPass = '';
  try {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep < 0) throw new Error();
    reqUser = decoded.slice(0, sep);
    reqPass = decoded.slice(sep + 1);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  if (!safeCompare(reqUser, username) || !safeCompare(reqPass, password)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

// Auth check — used by admin dashboard login
app.get('/api/admin/ping', (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json({ ok: true });
});

// Public: list custom events
app.get('/api/events', (req, res) => {
  res.json(loadEvents());
});

// Admin: create event
app.post('/api/events', (req, res) => {
  if (!checkAuth(req, res)) return;

  const { date, title, description, type } = req.body;

  if (!date || !title) {
    return res.status(400).json({ error: 'date and title are required' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }

  const validTypes = ['community', 'family', 'private', 'special'];
  const eventType = validTypes.includes(type) ? type : 'special';

  const events = loadEvents();
  const newEvent = {
    id: Date.now().toString(),
    date,
    title: String(title).trim().slice(0, 100),
    description: String(description || '').trim().slice(0, 500),
    type: eventType,
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  saveEvents(events);
  res.status(201).json(newEvent);
});

// Admin: delete event
app.delete('/api/events/:id', (req, res) => {
  if (!checkAuth(req, res)) return;

  const events = loadEvents();
  const idx = events.findIndex(e => e.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const [removed] = events.splice(idx, 1);
  saveEvents(events);
  res.json(removed);
});

// Admin dashboard page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Block direct access to data directory
app.get('/data/*', (req, res) => res.status(404).end());

app.listen(PORT, () => {
  console.log(`Hidden Level running on port ${PORT}`);
});
