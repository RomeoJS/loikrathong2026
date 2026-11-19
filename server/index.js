require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../images/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for uploading contestant images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contestant-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Static assets
app.use('/images', express.static(path.join(__dirname, '../images')));

// ----------------- API ENDPOINTS -----------------

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await db.saveSetting(key, value);
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Judges
app.get('/api/judges', async (req, res) => {
  try {
    const judges = await db.getJudges();
    res.json(judges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/judges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title } = req.body;
    await db.updateJudge(id, name, title);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contestants
app.get('/api/contestants', async (req, res) => {
  try {
    const { category, round, judge_id } = req.query;
    const contestants = await db.getContestants(category, round, judge_id);
    res.json(contestants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contestants/upload-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const photoUrl = `/images/uploads/${req.file.filename}`;
  res.json({ url: photoUrl });
});

app.put('/api/contestants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { prefix, first_name, last_name, school, image_url, round1_qualified } = req.body;
    await db.updateContestant(id, {
      prefix,
      first_name,
      last_name,
      school,
      image_url,
      round1_qualified: round1_qualified !== undefined ? (round1_qualified ? 1 : 0) : undefined
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scoring
app.get('/api/scores', async (req, res) => {
  try {
    const { judge_id, contestant_id, round } = req.query;
    if (!judge_id || !contestant_id || !round) {
      return res.status(400).json({ error: 'judge_id, contestant_id, round required' });
    }
    const score = await db.getScore(judge_id, contestant_id, round);
    res.json(score || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const { judge_id, contestant_id, round, scores, comment } = req.body;
    if (!judge_id || !contestant_id || !round || !scores) {
      return res.status(400).json({ error: 'Missing required scoring fields' });
    }

    const category = await db.getContestantCategory(contestant_id);
    if (!category) {
      return res.status(404).json({ error: 'Contestant not found' });
    }

    let total = 0;
    let s = {};

    if (Number(round) === 1) {
      const isMen = category === 'MEN';
      const dressAccMax = isMen ? 20 : 15;
      const hairMax = isMen ? 5 : 10;
      const shoesMax = 5;
      const walkMax = 5;
      const standMax = 5;
      const eleganceMax = 15;
      const voiceMax = 5;
      const faceMax = 30;
      const waiMax = 10;

      s.c_dress_accuracy = Math.min(Math.max(Number(scores.c_dress_accuracy || 0), 0), dressAccMax);
      s.c_hair = Math.min(Math.max(Number(scores.c_hair || 0), 0), hairMax);
      s.c_shoes = Math.min(Math.max(Number(scores.c_shoes || 0), 0), shoesMax);
      s.c_walk = Math.min(Math.max(Number(scores.c_walk || 0), 0), walkMax);
      s.c_stand = Math.min(Math.max(Number(scores.c_stand || 0), 0), standMax);
      s.c_elegance = Math.min(Math.max(Number(scores.c_elegance || 0), 0), eleganceMax);
      s.c_voice = Math.min(Math.max(Number(scores.c_voice || 0), 0), voiceMax);
      s.c_face_symmetry = Math.min(Math.max(Number(scores.c_face_symmetry || 0), 0), faceMax);
      s.c_wai = Math.min(Math.max(Number(scores.c_wai || 0), 0), waiMax);

      total = s.c_dress_accuracy + s.c_hair + s.c_shoes + s.c_walk + s.c_stand + s.c_elegance + s.c_voice + s.c_face_symmetry + s.c_wai;
      total = Math.round(total * 100) / 100;

      await db.saveScore(judge_id, contestant_id, round, s, total, comment);
    } else {
      // Round 2
      s.c_r2_walk = Math.min(Math.max(Number(scores.c_r2_walk || 0), 0), 10);
      s.c_r2_stand = Math.min(Math.max(Number(scores.c_r2_stand || 0), 0), 10);
      s.c_r2_wai = Math.min(Math.max(Number(scores.c_r2_wai || 0), 0), 10);
      s.c_r2_situation = Math.min(Math.max(Number(scores.c_r2_situation || 0), 0), 20);
      s.c_r2_knowledge = Math.min(Math.max(Number(scores.c_r2_knowledge || 0), 0), 30);
      s.c_r2_relevance = Math.min(Math.max(Number(scores.c_r2_relevance || 0), 0), 20);

      total = s.c_r2_walk + s.c_r2_stand + s.c_r2_wai + s.c_r2_situation + s.c_r2_knowledge + s.c_r2_relevance;
      total = Math.round(total * 100) / 100;

      await db.saveScore(judge_id, contestant_id, round, s, total, comment);
    }

    res.json({ success: true, total_score: total, scores: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Summary Endpoint (Dashboard & Leaderboard)
app.get('/api/admin/summary', async (req, res) => {
  try {
    const category = req.query.category || 'WOMEN';
    const round = Number(req.query.round) || 1;
    const summary = await db.getAdminSummary(category, round);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Qualify Top 6 from Round 1 into Round 2
app.post('/api/admin/qualify-round-1', async (req, res) => {
  try {
    const { category, contestant_ids } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });
    const qualifiedIds = await db.qualifyRound1(category, contestant_ids);
    res.json({ success: true, qualified_count: qualifiedIds.length, qualified_ids: qualifiedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Finalize Awards for Round 2
app.post('/api/admin/finalize-round-2', async (req, res) => {
  try {
    const { category, winner_id, runner_up_1_id, runner_up_2_id, costume_id, popular_id } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });
    await db.finalizeRound2(category, { winner_id, runner_up_1_id, runner_up_2_id, costume_id, popular_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset scores
app.post('/api/admin/reset-scores', async (req, res) => {
  try {
    const { round, category } = req.body;
    await db.resetScores(round, category);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo seed scores
app.post('/api/admin/seed-demo-scores', async (req, res) => {
  try {
    const { round, category } = req.body;
    const targetRound = Number(round) || 1;
    const judges = await db.getJudges();
    const contestants = await db.getContestants(category, targetRound === 2 ? 2 : undefined);

    for (const c of contestants) {
      for (const j of judges) {
        if (targetRound === 1) {
          const isMen = c.category === 'MEN';
          const dressAcc = Math.floor(Math.random() * (isMen ? 5 : 4)) + (isMen ? 16 : 12);
          const hair = Math.floor(Math.random() * (isMen ? 2 : 3)) + (isMen ? 4 : 8);
          const shoes = 4 + (Math.random() > 0.5 ? 1 : 0);
          const walk = 4 + (Math.random() > 0.5 ? 1 : 0);
          const stand = 4 + (Math.random() > 0.5 ? 1 : 0);
          const elegance = Math.floor(Math.random() * 4) + 12;
          const voice = 4 + (Math.random() > 0.5 ? 1 : 0);
          const face = Math.floor(Math.random() * 6) + 25;
          const wai = Math.floor(Math.random() * 2) + 9;
          const total = dressAcc + hair + shoes + walk + stand + elegance + voice + face + wai;

          await db.saveScore(j.id, c.id, 1, {
            c_dress_accuracy: dressAcc,
            c_hair: hair,
            c_shoes: shoes,
            c_walk: walk,
            c_stand: stand,
            c_elegance: elegance,
            c_voice: voice,
            c_face_symmetry: face,
            c_wai: wai
          }, total, 'คะแนนจำลองทดสอบ');
        } else {
          // Round 2
          const walk = Math.floor(Math.random() * 3) + 8;
          const stand = Math.floor(Math.random() * 3) + 8;
          const wai = Math.floor(Math.random() * 3) + 8;
          const situation = Math.floor(Math.random() * 4) + 17;
          const knowledge = Math.floor(Math.random() * 6) + 25;
          const relevance = Math.floor(Math.random() * 4) + 17;
          const total = walk + stand + wai + situation + knowledge + relevance;

          await db.saveScore(j.id, c.id, 2, {
            c_r2_walk: walk,
            c_r2_stand: stand,
            c_r2_wai: wai,
            c_r2_situation: situation,
            c_r2_knowledge: knowledge,
            c_r2_relevance: relevance
          }, total, 'คะแนนจำลองทดสอบรอบสอง');
        }
      }
    }

    res.json({ success: true, message: 'Seeded demo scores successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production or if built
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start database and server
db.initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (Database mode: ${db.getDbType()})`);
  });
}).catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
