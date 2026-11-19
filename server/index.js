require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { query, execute } = require('./db');

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
    const rows = await query('SELECT `key`, `value` FROM settings');
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await query(`
      INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)
    `, [key, String(value)]);
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Judges
app.get('/api/judges', async (req, res) => {
  try {
    const judges = await query('SELECT * FROM judges ORDER BY id ASC');
    const stats = await query(`
      SELECT judge_id, round, COUNT(*) as scored_count 
      FROM scores 
      GROUP BY judge_id, round
    `);

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

app.put('/api/judges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title } = req.body;
    await query('UPDATE judges SET name = ?, title = ? WHERE id = ?', [name, title || 'กรรมการผู้ทรงคุณวุฒิ', id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contestants
app.get('/api/contestants', async (req, res) => {
  try {
    const { category, round, judge_id } = req.query;
    let sql = 'SELECT * FROM contestants WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (round === '2') {
      sql += ' AND round1_qualified = 1';
    }

    sql += ' ORDER BY number ASC';

    const contestants = await query(sql, params);

    // If judge_id and round are provided, attach scoring info for this judge
    if (judge_id && round) {
      const scores = await query(
        'SELECT * FROM scores WHERE judge_id = ? AND round = ?',
        [Number(judge_id), Number(round)]
      );
      const scoreMap = new Map();
      scores.forEach(s => scoreMap.set(s.contestant_id, s));

      const enriched = contestants.map(c => {
        const score = scoreMap.get(c.id);
        return {
          ...c,
          has_scored: !!score,
          score_data: score || null,
          total_score: score ? Number(score.total_score) : null
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

app.put('/api/contestants/:id', async (req, res) => {
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
      await query(`UPDATE contestants SET ${updates.join(', ')} WHERE id = ?`, params);
    }

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

    const scores = await query(
      'SELECT * FROM scores WHERE judge_id = ? AND contestant_id = ? AND round = ?',
      [Number(judge_id), Number(contestant_id), Number(round)]
    );

    res.json(scores[0] || null);
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

    const contestants = await query('SELECT category FROM contestants WHERE id = ?', [contestant_id]);
    if (contestants.length === 0) {
      return res.status(404).json({ error: 'Contestant not found' });
    }
    const contestant = contestants[0];

    let total = 0;
    let s = {};

    if (Number(round) === 1) {
      const isMen = contestant.category === 'MEN';
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

      await query(`
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
        ON DUPLICATE KEY UPDATE
          c_dress_accuracy = VALUES(c_dress_accuracy),
          c_hair = VALUES(c_hair),
          c_shoes = VALUES(c_shoes),
          c_walk = VALUES(c_walk),
          c_stand = VALUES(c_stand),
          c_elegance = VALUES(c_elegance),
          c_voice = VALUES(c_voice),
          c_face_symmetry = VALUES(c_face_symmetry),
          c_wai = VALUES(c_wai),
          total_score = VALUES(total_score),
          comment = VALUES(comment),
          updated_at = CURRENT_TIMESTAMP
      `, [
        judge_id, contestant_id, round,
        s.c_dress_accuracy, s.c_hair, s.c_shoes,
        s.c_walk, s.c_stand, s.c_elegance, s.c_voice,
        s.c_face_symmetry, s.c_wai,
        total, comment || ''
      ]);

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

      await query(`
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
        ON DUPLICATE KEY UPDATE
          c_r2_walk = VALUES(c_r2_walk),
          c_r2_stand = VALUES(c_r2_stand),
          c_r2_wai = VALUES(c_r2_wai),
          c_r2_situation = VALUES(c_r2_situation),
          c_r2_knowledge = VALUES(c_r2_knowledge),
          c_r2_relevance = VALUES(c_r2_relevance),
          total_score = VALUES(total_score),
          comment = VALUES(comment),
          updated_at = CURRENT_TIMESTAMP
      `, [
        judge_id, contestant_id, round,
        s.c_r2_walk, s.c_r2_stand, s.c_r2_wai,
        s.c_r2_situation, s.c_r2_knowledge, s.c_r2_relevance,
        total, comment || ''
      ]);
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

    const judges = await query('SELECT id, name FROM judges ORDER BY id ASC');
    
    let contestantsSql = 'SELECT * FROM contestants WHERE category = ?';
    if (round === 2) {
      contestantsSql += ' AND round1_qualified = 1';
    }
    contestantsSql += ' ORDER BY number ASC';
    const contestants = await query(contestantsSql, [category]);

    const scores = await query(`
      SELECT s.*, j.name as judge_name 
      FROM scores s
      JOIN judges j ON s.judge_id = j.id
      WHERE s.round = ?
    `, [round]);

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
          const tot = Number(found.total_score);
          judgeScoresObj[j.id] = {
            total: tot,
            details: found
          };
          sum += tot;
          if (round === 1) {
            dressSum += (Number(found.c_dress_accuracy) + Number(found.c_hair) + Number(found.c_shoes));
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
app.post('/api/admin/qualify-round-1', async (req, res) => {
  try {
    const { category, contestant_ids } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });

    // Reset qualification for this category
    await query('UPDATE contestants SET round1_qualified = 0 WHERE category = ?', [category]);

    let qualifiedIds = contestant_ids;
    // If not provided, calculate top 6 automatically based on total scores in round 1
    if (!qualifiedIds || qualifiedIds.length === 0) {
      const top6 = await query(`
        SELECT c.id, COALESCE(SUM(s.total_score), 0) as total
        FROM contestants c
        LEFT JOIN scores s ON c.id = s.contestant_id AND s.round = 1
        WHERE c.category = ?
        GROUP BY c.id
        ORDER BY total DESC, c.number ASC
        LIMIT 6
      `, [category]);
      qualifiedIds = top6.map(t => t.id);
    }

    for (const id of qualifiedIds) {
      await query('UPDATE contestants SET round1_qualified = 1 WHERE id = ?', [id]);
    }

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

    // Reset awards for this category
    await query(`
      UPDATE contestants 
      SET round2_rank = NULL, award_costume = 0, award_popular = 0
      WHERE category = ?
    `, [category]);

    if (winner_id) {
      await query('UPDATE contestants SET round2_rank = 1 WHERE id = ?', [winner_id]);
    }
    if (runner_up_1_id) {
      await query('UPDATE contestants SET round2_rank = 2 WHERE id = ?', [runner_up_1_id]);
    }
    if (runner_up_2_id) {
      await query('UPDATE contestants SET round2_rank = 3 WHERE id = ?', [runner_up_2_id]);
    }
    if (costume_id) {
      await query('UPDATE contestants SET award_costume = 1 WHERE id = ?', [costume_id]);
    }
    if (popular_id) {
      await query('UPDATE contestants SET award_popular = 1 WHERE id = ?', [popular_id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset scores
app.post('/api/admin/reset-scores', async (req, res) => {
  try {
    const { round, category } = req.body;
    if (category && category !== 'ALL') {
      const contestants = await query('SELECT id FROM contestants WHERE category = ?', [category]);
      const cIds = contestants.map(c => c.id);
      if (cIds.length > 0) {
        const placeholders = cIds.map(() => '?').join(',');
        if (round) {
          await query(`DELETE FROM scores WHERE contestant_id IN (${placeholders}) AND round = ?`, [...cIds, round]);
        } else {
          await query(`DELETE FROM scores WHERE contestant_id IN (${placeholders})`, cIds);
        }
      }
    } else {
      if (round) {
        await query('DELETE FROM scores WHERE round = ?', [round]);
      } else {
        await query('DELETE FROM scores');
      }
    }
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
    const judges = await query('SELECT id FROM judges');
    
    let cSql = 'SELECT * FROM contestants WHERE 1=1';
    const params = [];
    if (category && category !== 'ALL') {
      cSql += ' AND category = ?';
      params.push(category);
    }
    if (targetRound === 2) {
      cSql += ' AND round1_qualified = 1';
    }
    const contestants = await query(cSql, params);

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

          await query(`
            INSERT INTO scores (
              judge_id, contestant_id, round,
              c_dress_accuracy, c_hair, c_shoes,
              c_walk, c_stand, c_elegance, c_voice,
              c_face_symmetry, c_wai,
              total_score, comment, updated_at
            ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'คะแนนจำลองทดสอบ', CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
              c_dress_accuracy = VALUES(c_dress_accuracy),
              c_hair = VALUES(c_hair),
              c_shoes = VALUES(c_shoes),
              c_walk = VALUES(c_walk),
              c_stand = VALUES(c_stand),
              c_elegance = VALUES(c_elegance),
              c_voice = VALUES(c_voice),
              c_face_symmetry = VALUES(c_face_symmetry),
              c_wai = VALUES(c_wai),
              total_score = VALUES(total_score),
              updated_at = CURRENT_TIMESTAMP
          `, [j.id, c.id, dressAcc, hair, shoes, walk, stand, elegance, voice, face, wai, total]);

        } else {
          // Round 2
          const walk = Math.floor(Math.random() * 3) + 8;
          const stand = Math.floor(Math.random() * 3) + 8;
          const wai = Math.floor(Math.random() * 3) + 8;
          const situation = Math.floor(Math.random() * 4) + 17;
          const knowledge = Math.floor(Math.random() * 6) + 25;
          const relevance = Math.floor(Math.random() * 4) + 17;
          const total = walk + stand + wai + situation + knowledge + relevance;

          await query(`
            INSERT INTO scores (
              judge_id, contestant_id, round,
              c_r2_walk, c_r2_stand, c_r2_wai,
              c_r2_situation, c_r2_knowledge, c_r2_relevance,
              total_score, comment, updated_at
            ) VALUES (?, ?, 2, ?, ?, ?, ?, ?, ?, ?, 'คะแนนจำลองทดสอบรอบสอง', CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
              c_r2_walk = VALUES(c_r2_walk),
              c_r2_stand = VALUES(c_r2_stand),
              c_r2_wai = VALUES(c_r2_wai),
              c_r2_situation = VALUES(c_r2_situation),
              c_r2_knowledge = VALUES(c_r2_knowledge),
              c_r2_relevance = VALUES(c_r2_relevance),
              total_score = VALUES(total_score),
              updated_at = CURRENT_TIMESTAMP
          `, [j.id, c.id, walk, stand, wai, situation, knowledge, relevance, total]);
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
  console.log(`Server running on http://localhost:${PORT} (Connected to MySQL/MariaDB database: ${process.env.DB_NAME || 'loikrathong2026'})`);
});
