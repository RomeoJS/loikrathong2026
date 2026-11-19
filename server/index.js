const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { db } = require('./db');

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
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, String(value));
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Judges
app.get('/api/judges', (req, res) => {
  try {
    const judges = db.prepare('SELECT * FROM judges ORDER BY id ASC').all();
    
    // Add completion stats
    const statsQuery = db.prepare(`
      SELECT judge_id, round, COUNT(*) as scored_count 
      FROM scores 
      GROUP BY judge_id, round
    `);
    const stats = statsQuery.all();

    const judgesWithStats = judges.map(j => {
      const r1 = stats.find(s => s.judge_id === j.id && s.round === 1)?.scored_count || 0;
      const r2 = stats.find(s => s.judge_id === j.id && s.round === 2)?.scored_count || 0;
      return { ...j, scored_r1: r1, scored_r2: r2 };
    });

    res.json(judgesWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/judges/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, title } = req.body;
    db.prepare('UPDATE judges SET name = ?, title = ? WHERE id = ?').run(name, title || 'กรรมการผู้ทรงคุณวุฒิ', id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contestants
app.get('/api/contestants', (req, res) => {
  try {
    const { category, round, judge_id } = req.query;
    let query = 'SELECT * FROM contestants WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (round === '2') {
      query += ' AND round1_qualified = 1';
    }

    query += ' ORDER BY number ASC';

    const contestants = db.prepare(query).all(...params);

    // If judge_id and round are provided, attach scoring info for this judge
    if (judge_id && round) {
      const scoreQuery = db.prepare(`
        SELECT * FROM scores WHERE judge_id = ? AND round = ?
      `);
      const scores = scoreQuery.all(Number(judge_id), Number(round));
      const scoreMap = new Map();
      scores.forEach(s => scoreMap.set(s.contestant_id, s));

      const enriched = contestants.map(c => {
        const score = scoreMap.get(c.id);
        return {
          ...c,
          has_scored: !!score,
          score_data: score || null,
          total_score: score ? score.total_score : null
        };
      });
      return res.json(enriched);
    }

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

app.put('/api/contestants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { prefix, first_name, last_name, school, image_url, round1_qualified } = req.body;
    
    let updates = [];
    let params = [];

    if (prefix !== undefined) { updates.push('prefix = ?'); params.push(prefix); }
    if (first_name !== undefined) { updates.push('first_name = ?'); params.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name = ?'); params.push(last_name); }
    if (school !== undefined) { updates.push('school = ?'); params.push(school); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (round1_qualified !== undefined) { updates.push('round1_qualified = ?'); params.push(round1_qualified ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE contestants SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scoring
app.get('/api/scores', (req, res) => {
  try {
    const { judge_id, contestant_id, round } = req.query;
    if (!judge_id || !contestant_id || !round) {
      return res.status(400).json({ error: 'judge_id, contestant_id, round required' });
    }

    const score = db.prepare(`
      SELECT * FROM scores 
      WHERE judge_id = ? AND contestant_id = ? AND round = ?
    `).get(Number(judge_id), Number(contestant_id), Number(round));

    res.json(score || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scores', (req, res) => {
  try {
    const { judge_id, contestant_id, round, scores, comment } = req.body;
    if (!judge_id || !contestant_id || !round || !scores) {
      return res.status(400).json({ error: 'Missing required scoring fields' });
    }

    // Get contestant to check category
    const contestant = db.prepare('SELECT category FROM contestants WHERE id = ?').get(contestant_id);
    if (!contestant) {
      return res.status(404).json({ error: 'Contestant not found' });
    }

    let total = 0;
    let s = {};

    if (Number(round) === 1) {
      const isMen = contestant.category === 'MEN';
      // Dress accuracy: Women max 15, Men max 20
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

      db.prepare(`
        INSERT INTO scores (
          judge_id, contestant_id, round,
          c_dress_accuracy, c_hair, c_shoes,
          c_walk, c_stand, c_elegance, c_voice,
          c_face_symmetry, c_wai,
          total_score, comment, updated_at
        ) VALUES (
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          ?, ?, CURRENT_TIMESTAMP
        )
        ON CONFLICT(judge_id, contestant_id, round) DO UPDATE SET
          c_dress_accuracy = excluded.c_dress_accuracy,
          c_hair = excluded.c_hair,
          c_shoes = excluded.c_shoes,
          c_walk = excluded.c_walk,
          c_stand = excluded.c_stand,
          c_elegance = excluded.c_elegance,
          c_voice = excluded.c_voice,
          c_face_symmetry = excluded.c_face_symmetry,
          c_wai = excluded.c_wai,
          total_score = excluded.total_score,
          comment = excluded.comment,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        judge_id, contestant_id, round,
        s.c_dress_accuracy, s.c_hair, s.c_shoes,
        s.c_walk, s.c_stand, s.c_elegance, s.c_voice,
        s.c_face_symmetry, s.c_wai,
        total, comment || ''
      );

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

      db.prepare(`
        INSERT INTO scores (
          judge_id, contestant_id, round,
          c_r2_walk, c_r2_stand, c_r2_wai,
          c_r2_situation, c_r2_knowledge, c_r2_relevance,
          total_score, comment, updated_at
        ) VALUES (
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, CURRENT_TIMESTAMP
        )
        ON CONFLICT(judge_id, contestant_id, round) DO UPDATE SET
          c_r2_walk = excluded.c_r2_walk,
          c_r2_stand = excluded.c_r2_stand,
          c_r2_wai = excluded.c_r2_wai,
          c_r2_situation = excluded.c_r2_situation,
          c_r2_knowledge = excluded.c_r2_knowledge,
          c_r2_relevance = excluded.c_r2_relevance,
          total_score = excluded.total_score,
          comment = excluded.comment,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        judge_id, contestant_id, round,
        s.c_r2_walk, s.c_r2_stand, s.c_r2_wai,
        s.c_r2_situation, s.c_r2_knowledge, s.c_r2_relevance,
        total, comment || ''
      );
    }

    res.json({ success: true, total_score: total, scores: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Summary Endpoint (Dashboard & Leaderboard)
app.get('/api/admin/summary', (req, res) => {
  try {
    const category = req.query.category || 'WOMEN';
    const round = Number(req.query.round) || 1;

    const judges = db.prepare('SELECT id, name FROM judges ORDER BY id ASC').all();
    
    let contestantsQuery = 'SELECT * FROM contestants WHERE category = ?';
    if (round === 2) {
      contestantsQuery += ' AND round1_qualified = 1';
    }
    contestantsQuery += ' ORDER BY number ASC';
    const contestants = db.prepare(contestantsQuery).all(category);

    const scores = db.prepare(`
      SELECT s.*, j.name as judge_name 
      FROM scores s
      JOIN judges j ON s.judge_id = j.id
      WHERE s.round = ?
    `).all(round);

    // Group scores by contestant
    const scoreMap = new Map();
    for (const sc of scores) {
      if (!scoreMap.has(sc.contestant_id)) {
        scoreMap.set(sc.contestant_id, []);
      }
      scoreMap.get(sc.contestant_id).push(sc);
    }

    const contestantSummaries = contestants.map(c => {
      const cScores = scoreMap.get(c.id) || [];
      const judgeScoresObj = {};
      let sum = 0;
      let dressSum = 0;

      for (const j of judges) {
        const found = cScores.find(s => s.judge_id === j.id);
        if (found) {
          judgeScoresObj[j.id] = {
            total: found.total_score,
            details: found
          };
          sum += found.total_score;
          if (round === 1) {
            dressSum += (found.c_dress_accuracy + found.c_hair + found.c_shoes);
          }
        } else {
          judgeScoresObj[j.id] = null;
        }
      }

      const count = cScores.length;
      const average = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
      const overallAverage = Math.round((sum / (judges.length || 1)) * 100) / 100;

      return {
        ...c,
        judge_scores: judgeScoresObj,
        scored_judges_count: count,
        total_judges_count: judges.length,
        total_sum: Math.round(sum * 100) / 100,
        average_score: average,
        overall_average: overallAverage,
        dress_total: Math.round(dressSum * 100) / 100,
      };
    });

    // Rank candidates by average_score / total_sum descending
    const sorted = [...contestantSummaries].sort((a, b) => b.total_sum - a.total_sum);
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].total_sum < sorted[i - 1].total_sum) {
        rank = i + 1;
      }
      sorted[i].rank = sorted[i].total_sum > 0 ? rank : '-';
    }

    res.json({
      category,
      round,
      judges,
      contestants: sorted,
      total_contestants: sorted.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Qualify Top 6 from Round 1 into Round 2
app.post('/api/admin/qualify-round-1', (req, res) => {
  try {
    const { category, contestant_ids } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });

    // Reset qualification for this category
    db.prepare('UPDATE contestants SET round1_qualified = 0 WHERE category = ?').run(category);

    let qualifiedIds = contestant_ids;
    // If not provided, calculate top 6 automatically based on total scores in round 1
    if (!qualifiedIds || qualifiedIds.length === 0) {
      const top6 = db.prepare(`
        SELECT c.id, COALESCE(SUM(s.total_score), 0) as total
        FROM contestants c
        LEFT JOIN scores s ON c.id = s.contestant_id AND s.round = 1
        WHERE c.category = ?
        GROUP BY c.id
        ORDER BY total DESC, c.number ASC
        LIMIT 6
      `).all(category);
      qualifiedIds = top6.map(t => t.id);
    }

    const updateStmt = db.prepare('UPDATE contestants SET round1_qualified = 1 WHERE id = ?');
    for (const id of qualifiedIds) {
      updateStmt.run(id);
    }

    res.json({ success: true, qualified_count: qualifiedIds.length, qualified_ids: qualifiedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Finalize Awards for Round 2
app.post('/api/admin/finalize-round-2', (req, res) => {
  try {
    const { category, winner_id, runner_up_1_id, runner_up_2_id, costume_id, popular_id } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });

    // Reset awards for this category
    db.prepare(`
      UPDATE contestants 
      SET round2_rank = NULL, award_costume = 0, award_popular = 0
      WHERE category = ?
    `).run(category);

    if (winner_id) {
      db.prepare('UPDATE contestants SET round2_rank = 1 WHERE id = ?').run(winner_id);
    }
    if (runner_up_1_id) {
      db.prepare('UPDATE contestants SET round2_rank = 2 WHERE id = ?').run(runner_up_1_id);
    }
    if (runner_up_2_id) {
      db.prepare('UPDATE contestants SET round2_rank = 3 WHERE id = ?').run(runner_up_2_id);
    }
    if (costume_id) {
      db.prepare('UPDATE contestants SET award_costume = 1 WHERE id = ?').run(costume_id);
    }
    if (popular_id) {
      db.prepare('UPDATE contestants SET award_popular = 1 WHERE id = ?').run(popular_id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset scores
app.post('/api/admin/reset-scores', (req, res) => {
  try {
    const { round, category } = req.body;
    if (category && category !== 'ALL') {
      const contestants = db.prepare('SELECT id FROM contestants WHERE category = ?').all(category);
      const cIds = contestants.map(c => c.id);
      if (cIds.length > 0) {
        const placeholders = cIds.map(() => '?').join(',');
        if (round) {
          db.prepare(`DELETE FROM scores WHERE contestant_id IN (${placeholders}) AND round = ?`).run(...cIds, round);
        } else {
          db.prepare(`DELETE FROM scores WHERE contestant_id IN (${placeholders})`).run(...cIds);
        }
      }
    } else {
      if (round) {
        db.prepare('DELETE FROM scores WHERE round = ?').run(round);
      } else {
        db.prepare('DELETE FROM scores').run();
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo seed scores (Super useful for quick testing / demonstration)
app.post('/api/admin/seed-demo-scores', (req, res) => {
  try {
    const { round, category } = req.body;
    const targetRound = Number(round) || 1;
    const judges = db.prepare('SELECT id FROM judges').all();
    
    let cQuery = 'SELECT * FROM contestants WHERE 1=1';
    const params = [];
    if (category && category !== 'ALL') {
      cQuery += ' AND category = ?';
      params.push(category);
    }
    if (targetRound === 2) {
      cQuery += ' AND round1_qualified = 1';
    }
    const contestants = db.prepare(cQuery).all(...params);

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

          db.prepare(`
            INSERT INTO scores (
              judge_id, contestant_id, round,
              c_dress_accuracy, c_hair, c_shoes,
              c_walk, c_stand, c_elegance, c_voice,
              c_face_symmetry, c_wai,
              total_score, comment, updated_at
            ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'คะแนนจำลองทดสอบ', CURRENT_TIMESTAMP)
            ON CONFLICT(judge_id, contestant_id, round) DO UPDATE SET
              c_dress_accuracy = excluded.c_dress_accuracy,
              c_hair = excluded.c_hair,
              c_shoes = excluded.c_shoes,
              c_walk = excluded.c_walk,
              c_stand = excluded.c_stand,
              c_elegance = excluded.c_elegance,
              c_voice = excluded.c_voice,
              c_face_symmetry = excluded.c_face_symmetry,
              c_wai = excluded.c_wai,
              total_score = excluded.total_score,
              updated_at = CURRENT_TIMESTAMP
          `).run(j.id, c.id, dressAcc, hair, shoes, walk, stand, elegance, voice, face, wai, total);

        } else {
          // Round 2
          const walk = Math.floor(Math.random() * 3) + 8;
          const stand = Math.floor(Math.random() * 3) + 8;
          const wai = Math.floor(Math.random() * 3) + 8;
          const situation = Math.floor(Math.random() * 4) + 17;
          const knowledge = Math.floor(Math.random() * 6) + 25;
          const relevance = Math.floor(Math.random() * 4) + 17;
          const total = walk + stand + wai + situation + knowledge + relevance;

          db.prepare(`
            INSERT INTO scores (
              judge_id, contestant_id, round,
              c_r2_walk, c_r2_stand, c_r2_wai,
              c_r2_situation, c_r2_knowledge, c_r2_relevance,
              total_score, comment, updated_at
            ) VALUES (?, ?, 2, ?, ?, ?, ?, ?, ?, ?, 'คะแนนจำลองทดสอบรอบสอง', CURRENT_TIMESTAMP)
            ON CONFLICT(judge_id, contestant_id, round) DO UPDATE SET
              c_r2_walk = excluded.c_r2_walk,
              c_r2_stand = excluded.c_r2_stand,
              c_r2_wai = excluded.c_r2_wai,
              c_r2_situation = excluded.c_r2_situation,
              c_r2_knowledge = excluded.c_r2_knowledge,
              c_r2_relevance = excluded.c_r2_relevance,
              total_score = excluded.total_score,
              updated_at = CURRENT_TIMESTAMP
          `).run(j.id, c.id, walk, stand, wai, situation, knowledge, relevance, total);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
