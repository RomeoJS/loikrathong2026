require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('node:path');
const fs = require('node:fs');

// Database mode: 'mysql' or 'sqlite'
let dbType = 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Initial contestant seed data
const initialWomenList = [
  { num: 1, prefix: 'น.ส.', first: 'ชวิศา', last: 'วิศิษฐ์เสวีวัฒน์', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/women/MS01.jpg' },
  { num: 2, prefix: 'น.ส.', first: 'สุภัสสร', last: 'พรพิฆเนส', school: 'มหาวิทยาลัยกรุงเทพ', img: '/images/women/MS02.jpg' },
  { num: 3, prefix: 'น.ส.', first: 'จุฬารัตน์', last: 'มีดี', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS03.jpg' },
  { num: 4, prefix: 'น.ส.', first: 'นันท์นภัส', last: 'ฮดคำ', school: 'มหาวิทยาลัยบูรพา', img: '/images/women/MS04.jpg' },
  { num: 5, prefix: 'น.ส.', first: 'อรณิชา', last: 'คุ้มนุช', school: 'มหาวิทยาลัยศิลปากร', img: '/images/women/MS05.jpg' },
  { num: 6, prefix: 'น.ส.', first: 'อรไท', last: 'ประเสริฐ', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS06.jpeg' },
  { num: 7, prefix: 'น.ส.', first: 'ธัญรดา', last: 'แสนสุข', school: 'มหาวิทยาลัยขอนแก่น', img: '/images/women/MS07.jpeg' },
  { num: 8, prefix: 'น.ส.', first: 'ธมลวรรณ', last: 'แก้วแจ่มศรี', school: 'มหาวิทยาลัยกรุงเทพ', img: '/images/women/MS08.jpg' },
  { num: 9, prefix: 'น.ส.', first: 'ชนัญญา', last: 'แก้วเหมือน', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/placeholder.svg' },
  { num: 10, prefix: 'น.ส.', first: 'ธัญยพร', last: 'โสภาวัตร', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/women/MS10.jpg' },
  { num: 11, prefix: 'น.ส.', first: 'พิมพ์อัปสร', last: 'แตงโสภา', school: 'มหาวิทยาลัยราชภัฏสวนสุนันทา', img: '/images/women/MS11.jpeg' },
  { num: 12, prefix: 'น.ส.', first: 'กัญญาณัฐ', last: 'อินทรสวัสดิ์', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS12.jpg' },
  { num: 13, prefix: 'น.ส.', first: 'มณีรินทร์', last: 'ไชยปัญญา', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/women/MS13.jpeg' },
  { num: 14, prefix: 'น.ส.', first: 'กัญญาณัฐ', last: 'เจริญชวลิตกุล', school: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', img: '/images/women/MS14.jpeg' },
  { num: 15, prefix: 'น.ส.', first: 'ณัชฌารีย์', last: 'สิริไสย์', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/women/MS15.jpeg' },
];

const initialMenList = [
  { num: 1, prefix: 'นาย', first: 'ศุภโชค', last: 'ธนกรธำรง', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/men/M01.jpg' },
  { num: 2, prefix: 'นาย', first: 'บัลลังก์ราช', last: 'จองนันตา', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/men/M02.jpg' },
  { num: 3, prefix: 'นาย', first: 'ธนภัทร', last: 'ใจสมุทร', school: 'ม.เทคโนโลยีราชมงคลธัญบุรี', img: '/images/men/M03.jpeg' },
  { num: 4, prefix: 'นาย', first: 'วัชรพงษ์', last: 'จีนชู', school: 'มหาวิทยาลัยรามคำแหง', img: '/images/men/M04.jpg' },
  { num: 5, prefix: 'นาย', first: 'วัทธิกร', last: 'พงศ์ศุภะมงคล', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/men/M05.jpeg' },
  { num: 6, prefix: 'นาย', first: 'กุญช์วริทธิ์พล', last: 'ศรีบุญรอด', school: 'มหาวิทยาลัยธรรมศาสตร์', img: '/images/men/M06.jpeg' },
  { num: 7, prefix: 'นาย', first: 'ธนาวุฒิ', last: 'กิตติกุลเจริญ', school: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', img: '/images/men/M07.jpeg' },
  { num: 8, prefix: 'นาย', first: 'กฤษฎา', last: 'กิตณรงค์', school: 'มหาวิทยาลัยศรีปทุม', img: '/images/men/M08.jpeg' },
  { num: 9, prefix: 'นาย', first: 'ตั้งปณิธาน', last: 'นาก้อนทอง', school: 'มหาวิทยาลัยมหาสารคาม', img: '/images/men/M09.jpg' },
  { num: 10, prefix: 'นาย', first: 'ภัทรพล', last: 'ก้องเวหา', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/placeholder.svg' },
  { num: 11, prefix: 'นาย', first: 'วีรวัฒน์', last: 'อยู่คง', school: 'มหาวิทยาลัยราชภัฏจันทรเกษม', img: '/images/men/M11.JPG' },
  { num: 12, prefix: 'นาย', first: 'ศิรวิชญ์', last: 'ปริยานนท์', school: 'วิทยาลัยเทคนิคร้อยเอ็ด', img: '/images/men/M12.png' },
];

async function initDatabase() {
  const mysqlHost = process.env.DB_HOST || '127.0.0.1';
  const mysqlPort = Number(process.env.DB_PORT) || 3306;
  const mysqlUser = process.env.DB_USER || 'root';
  const mysqlPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '123456';
  const mysqlDatabase = process.env.DB_NAME || 'loikrathong2026';

  // 1. Try connecting to MySQL with a short timeout
  let canConnectMySQL = false;
  try {
    const testConn = await Promise.race([
      mysql.createConnection({
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPass,
        connectTimeout: 2500
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2500))
    ]);

    // Check / create database
    await testConn.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await testConn.end();

    mysqlPool = mysql.createPool({
      host: mysqlHost,
      port: mysqlPort,
      user: mysqlUser,
      password: mysqlPass,
      database: mysqlDatabase,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    canConnectMySQL = true;
    dbType = 'mysql';
    console.log(`[DB] Successfully connected to MySQL/MariaDB database "${mysqlDatabase}" at ${mysqlHost}:${mysqlPort}`);
  } catch (err) {
    console.log(`[DB] MySQL connection failed (${err.message}). Falling back to SQLite for 100% offline/cloud availability.`);
    canConnectMySQL = false;
  }

  // 2. Setup SQLite fallback if MySQL is unreachable
  if (!canConnectMySQL) {
    dbType = 'sqlite';
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(__dirname, '../database.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    console.log(`[DB] SQLite database initialized at ${dbPath}`);
  }

  // 3. Create tables & Seed data for whichever database is active
  await setupSchema();
}

async function setupSchema() {
  if (dbType === 'mysql') {
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS judges (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'กรรมการผู้ทรงคุณวุฒิ',
        is_active TINYINT NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS contestants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number INT NOT NULL,
        category ENUM('WOMEN', 'MEN') NOT NULL,
        prefix VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        school VARCHAR(255) NOT NULL,
        image_url VARCHAR(255),
        round1_qualified TINYINT NOT NULL DEFAULT 0,
        round2_rank INT DEFAULT NULL,
        award_costume TINYINT NOT NULL DEFAULT 0,
        award_popular TINYINT NOT NULL DEFAULT 0,
        award_custom VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_category_number (category, number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judge_id INT NOT NULL,
        contestant_id INT NOT NULL,
        round INT NOT NULL,
        c_dress_accuracy DECIMAL(5,2) DEFAULT 0,
        c_hair DECIMAL(5,2) DEFAULT 0,
        c_shoes DECIMAL(5,2) DEFAULT 0,
        c_walk DECIMAL(5,2) DEFAULT 0,
        c_stand DECIMAL(5,2) DEFAULT 0,
        c_elegance DECIMAL(5,2) DEFAULT 0,
        c_voice DECIMAL(5,2) DEFAULT 0,
        c_face_symmetry DECIMAL(5,2) DEFAULT 0,
        c_wai DECIMAL(5,2) DEFAULT 0,
        c_r2_walk DECIMAL(5,2) DEFAULT 0,
        c_r2_stand DECIMAL(5,2) DEFAULT 0,
        c_r2_wai DECIMAL(5,2) DEFAULT 0,
        c_r2_situation DECIMAL(5,2) DEFAULT 0,
        c_r2_knowledge DECIMAL(5,2) DEFAULT 0,
        c_r2_relevance DECIMAL(5,2) DEFAULT 0,
        total_score DECIMAL(6,2) NOT NULL DEFAULT 0,
        submitted TINYINT NOT NULL DEFAULT 1,
        comment TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_judge_contestant_round (judge_id, contestant_id, round),
        CONSTRAINT fk_scores_judge FOREIGN KEY (judge_id) REFERENCES judges (id) ON DELETE CASCADE,
        CONSTRAINT fk_scores_contestant FOREIGN KEY (contestant_id) REFERENCES contestants (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed judges
    const [judges] = await mysqlPool.query('SELECT COUNT(*) as count FROM judges');
    if (judges[0].count === 0) {
      for (let i = 1; i <= 6; i++) {
        await mysqlPool.query('INSERT INTO judges (id, name, title) VALUES (?, ?, ?)', [
          i, `กรรมการตัดสินท่านที่ ${i}`, 'กรรมการผู้ทรงคุณวุฒิ'
        ]);
      }
    }

    // Seed contestants
    const [contestants] = await mysqlPool.query('SELECT COUNT(*) as count FROM contestants');
    if (contestants[0].count === 0) {
      for (const w of initialWomenList) {
        await mysqlPool.query(
          'INSERT INTO contestants (number, category, prefix, first_name, last_name, school, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [w.num, 'WOMEN', w.prefix, w.first, w.last, w.school, w.img]
        );
      }
      for (const m of initialMenList) {
        await mysqlPool.query(
          'INSERT INTO contestants (number, category, prefix, first_name, last_name, school, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [m.num, 'MEN', m.prefix, m.first, m.last, m.school, m.img]
        );
      }
    }

    // Seed settings
    const [settings] = await mysqlPool.query('SELECT `key` FROM settings WHERE `key` = "active_round"');
    if (settings.length === 0) {
      await mysqlPool.query('INSERT INTO settings (`key`, `value`) VALUES ("active_round", "1"), ("active_category", "WOMEN")');
    }

  } else {
    // SQLite
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS judges (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'กรรมการผู้ทรงคุณวุฒิ',
        is_active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS contestants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('WOMEN', 'MEN')),
        prefix TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        school TEXT NOT NULL,
        image_url TEXT,
        round1_qualified INTEGER NOT NULL DEFAULT 0,
        round2_rank INTEGER DEFAULT NULL,
        award_costume INTEGER NOT NULL DEFAULT 0,
        award_popular INTEGER NOT NULL DEFAULT 0,
        award_custom TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, number)
      );

      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        judge_id INTEGER NOT NULL,
        contestant_id INTEGER NOT NULL,
        round INTEGER NOT NULL CHECK(round IN (1, 2)),
        c_dress_accuracy REAL DEFAULT 0,
        c_hair REAL DEFAULT 0,
        c_shoes REAL DEFAULT 0,
        c_walk REAL DEFAULT 0,
        c_stand REAL DEFAULT 0,
        c_elegance REAL DEFAULT 0,
        c_voice REAL DEFAULT 0,
        c_face_symmetry REAL DEFAULT 0,
        c_wai REAL DEFAULT 0,
        c_r2_walk REAL DEFAULT 0,
        c_r2_stand REAL DEFAULT 0,
        c_r2_wai REAL DEFAULT 0,
        c_r2_situation REAL DEFAULT 0,
        c_r2_knowledge REAL DEFAULT 0,
        c_r2_relevance REAL DEFAULT 0,
        total_score REAL NOT NULL DEFAULT 0,
        submitted INTEGER NOT NULL DEFAULT 1,
        comment TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(judge_id, contestant_id, round),
        FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
        FOREIGN KEY (contestant_id) REFERENCES contestants(id) ON DELETE CASCADE
      );
    `);

    // Seed judges
    const countJudges = sqliteDb.prepare('SELECT COUNT(*) as count FROM judges').get().count;
    if (countJudges === 0) {
      const insertJudge = sqliteDb.prepare('INSERT INTO judges (id, name, title) VALUES (?, ?, ?)');
      for (let i = 1; i <= 6; i++) {
        insertJudge.run(i, `กรรมการตัดสินท่านที่ ${i}`, 'กรรมการผู้ทรงคุณวุฒิ');
      }
    }

    // Seed contestants
    const countContestants = sqliteDb.prepare('SELECT COUNT(*) as count FROM contestants').get().count;
    if (countContestants === 0) {
      const insertC = sqliteDb.prepare(
        'INSERT INTO contestants (number, category, prefix, first_name, last_name, school, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const w of initialWomenList) {
        insertC.run(w.num, 'WOMEN', w.prefix, w.first, w.last, w.school, w.img);
      }
      for (const m of initialMenList) {
        insertC.run(m.num, 'MEN', m.prefix, m.first, m.last, m.school, m.img);
      }
    }

    // Seed settings
    const checkSetting = sqliteDb.prepare('SELECT value FROM settings WHERE key = ?');
    if (!checkSetting.get('active_round')) {
      sqliteDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('active_round', '1');
    }
    if (!checkSetting.get('active_category')) {
      sqliteDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('active_category', 'WOMEN');
    }
  }
}

// ----------------- UNIFIED API METHODS -----------------

async function getSettings() {
  if (dbType === 'mysql') {
    const [rows] = await mysqlPool.query('SELECT `key`, `value` FROM settings');
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    return obj;
  } else {
    const rows = sqliteDb.prepare('SELECT key, value FROM settings').all();
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    return obj;
  }
}

async function saveSetting(key, value) {
  if (dbType === 'mysql') {
    await mysqlPool.query(`
      INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)
    `, [key, String(value)]);
  } else {
    sqliteDb.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, String(value));
  }
}

async function getJudges() {
  if (dbType === 'mysql') {
    const [judges] = await mysqlPool.query('SELECT * FROM judges ORDER BY id ASC');
    const [stats] = await mysqlPool.query(`
      SELECT judge_id, round, COUNT(*) as scored_count 
      FROM scores 
      GROUP BY judge_id, round
    `);
    return judges.map(j => {
      const r1 = stats.find(s => s.judge_id === j.id && s.round === 1)?.scored_count || 0;
      const r2 = stats.find(s => s.judge_id === j.id && s.round === 2)?.scored_count || 0;
      return { ...j, scored_r1: r1, scored_r2: r2 };
    });
  } else {
    const judges = sqliteDb.prepare('SELECT * FROM judges ORDER BY id ASC').all();
    const stats = sqliteDb.prepare(`
      SELECT judge_id, round, COUNT(*) as scored_count 
      FROM scores 
      GROUP BY judge_id, round
    `).all();
    return judges.map(j => {
      const r1 = stats.find(s => s.judge_id === j.id && s.round === 1)?.scored_count || 0;
      const r2 = stats.find(s => s.judge_id === j.id && s.round === 2)?.scored_count || 0;
      return { ...j, scored_r1: r1, scored_r2: r2 };
    });
  }
}

async function updateJudge(id, name, title) {
  if (dbType === 'mysql') {
    await mysqlPool.query('UPDATE judges SET name = ?, title = ? WHERE id = ?', [name, title || 'กรรมการผู้ทรงคุณวุฒิ', id]);
  } else {
    sqliteDb.prepare('UPDATE judges SET name = ?, title = ? WHERE id = ?').run(name, title || 'กรรมการผู้ทรงคุณวุฒิ', id);
  }
}

async function getContestants(category, round, judgeId) {
  let contestants = [];
  if (dbType === 'mysql') {
    let sql = 'SELECT * FROM contestants WHERE 1=1';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (String(round) === '2') {
      sql += ' AND round1_qualified = 1';
    }
    sql += ' ORDER BY number ASC';
    const [rows] = await mysqlPool.query(sql, params);
    contestants = rows;

    if (judgeId && round) {
      const [scores] = await mysqlPool.query(
        'SELECT * FROM scores WHERE judge_id = ? AND round = ?',
        [Number(judgeId), Number(round)]
      );
      const scoreMap = new Map();
      scores.forEach(s => scoreMap.set(s.contestant_id, s));
      return contestants.map(c => {
        const score = scoreMap.get(c.id);
        return {
          ...c,
          has_scored: !!score,
          score_data: score || null,
          total_score: score ? Number(score.total_score) : null
        };
      });
    }
  } else {
    let sql = 'SELECT * FROM contestants WHERE 1=1';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (String(round) === '2') {
      sql += ' AND round1_qualified = 1';
    }
    sql += ' ORDER BY number ASC';
    contestants = sqliteDb.prepare(sql).all(...params);

    if (judgeId && round) {
      const scores = sqliteDb.prepare('SELECT * FROM scores WHERE judge_id = ? AND round = ?').all(Number(judgeId), Number(round));
      const scoreMap = new Map();
      scores.forEach(s => scoreMap.set(s.contestant_id, s));
      return contestants.map(c => {
        const score = scoreMap.get(c.id);
        return {
          ...c,
          has_scored: !!score,
          score_data: score || null,
          total_score: score ? Number(score.total_score) : null
        };
      });
    }
  }
  return contestants;
}

async function updateContestant(id, fields) {
  const updates = [];
  const params = [];
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      updates.push(`\`${key}\` = ?`);
      params.push(val);
    }
  }
  if (updates.length === 0) return;
  params.push(id);

  if (dbType === 'mysql') {
    await mysqlPool.query(`UPDATE contestants SET ${updates.join(', ')} WHERE id = ?`, params);
  } else {
    sqliteDb.prepare(`UPDATE contestants SET ${updates.map(u => u.replace(/`/g, '')).join(', ')} WHERE id = ?`).run(...params);
  }
}

async function getScore(judgeId, contestantId, round) {
  if (dbType === 'mysql') {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM scores WHERE judge_id = ? AND contestant_id = ? AND round = ?',
      [Number(judgeId), Number(contestantId), Number(round)]
    );
    return rows[0] || null;
  } else {
    const row = sqliteDb.prepare(
      'SELECT * FROM scores WHERE judge_id = ? AND contestant_id = ? AND round = ?'
    ).get(Number(judgeId), Number(contestantId), Number(round));
    return row || null;
  }
}

async function saveScore(judgeId, contestantId, round, scores, total, comment) {
  if (dbType === 'mysql') {
    if (Number(round) === 1) {
      await mysqlPool.query(`
        INSERT INTO scores (
          judge_id, contestant_id, round,
          c_dress_accuracy, c_hair, c_shoes,
          c_walk, c_stand, c_elegance, c_voice,
          c_face_symmetry, c_wai,
          total_score, comment, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
        judgeId, contestantId, round,
        scores.c_dress_accuracy, scores.c_hair, scores.c_shoes,
        scores.c_walk, scores.c_stand, scores.c_elegance, scores.c_voice,
        scores.c_face_symmetry, scores.c_wai,
        total, comment || ''
      ]);
    } else {
      await mysqlPool.query(`
        INSERT INTO scores (
          judge_id, contestant_id, round,
          c_r2_walk, c_r2_stand, c_r2_wai,
          c_r2_situation, c_r2_knowledge, c_r2_relevance,
          total_score, comment, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
        judgeId, contestantId, round,
        scores.c_r2_walk, scores.c_r2_stand, scores.c_r2_wai,
        scores.c_r2_situation, scores.c_r2_knowledge, scores.c_r2_relevance,
        total, comment || ''
      ]);
    }
  } else {
    // SQLite
    if (Number(round) === 1) {
      sqliteDb.prepare(`
        INSERT INTO scores (
          judge_id, contestant_id, round,
          c_dress_accuracy, c_hair, c_shoes,
          c_walk, c_stand, c_elegance, c_voice,
          c_face_symmetry, c_wai,
          total_score, comment, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
        judgeId, contestantId, round,
        scores.c_dress_accuracy, scores.c_hair, scores.c_shoes,
        scores.c_walk, scores.c_stand, scores.c_elegance, scores.c_voice,
        scores.c_face_symmetry, scores.c_wai,
        total, comment || ''
      );
    } else {
      sqliteDb.prepare(`
        INSERT INTO scores (
          judge_id, contestant_id, round,
          c_r2_walk, c_r2_stand, c_r2_wai,
          c_r2_situation, c_r2_knowledge, c_r2_relevance,
          total_score, comment, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
        judgeId, contestantId, round,
        scores.c_r2_walk, scores.c_r2_stand, scores.c_r2_wai,
        scores.c_r2_situation, scores.c_r2_knowledge, scores.c_r2_relevance,
        total, comment || ''
      );
    }
  }
}

async function getAdminSummary(category, round) {
  const judges = await getJudges();
  const contestants = await getContestants(category, round);

  let scores = [];
  if (dbType === 'mysql') {
    const [rows] = await mysqlPool.query(`
      SELECT s.*, j.name as judge_name 
      FROM scores s
      JOIN judges j ON s.judge_id = j.id
      WHERE s.round = ?
    `, [round]);
    scores = rows;
  } else {
    scores = sqliteDb.prepare(`
      SELECT s.*, j.name as judge_name 
      FROM scores s
      JOIN judges j ON s.judge_id = j.id
      WHERE s.round = ?
    `).all(round);
  }

  // Group scores by contestant
  const scoreMap = new Map();
  for (const sc of scores) {
    if (!scoreMap.has(sc.contestant_id)) {
      scoreMap.set(sc.contestant_id, []);
    }
    scoreMap.get(sc.contestant_id).push(sc);
  }

  const summaries = contestants.map(c => {
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

  const sorted = [...summaries].sort((a, b) => b.total_sum - a.total_sum);
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].total_sum < sorted[i - 1].total_sum) {
      rank = i + 1;
    }
    sorted[i].rank = sorted[i].total_sum > 0 ? rank : '-';
  }

  return {
    category,
    round,
    judges,
    contestants: sorted,
    total_contestants: sorted.length
  };
}

async function qualifyRound1(category, contestantIds) {
  let qualifiedIds = contestantIds;
  if (!qualifiedIds || qualifiedIds.length === 0) {
    if (dbType === 'mysql') {
      const [top6] = await mysqlPool.query(`
        SELECT c.id, COALESCE(SUM(s.total_score), 0) as total
        FROM contestants c
        LEFT JOIN scores s ON c.id = s.contestant_id AND s.round = 1
        WHERE c.category = ?
        GROUP BY c.id
        ORDER BY total DESC, c.number ASC
        LIMIT 6
      `, [category]);
      qualifiedIds = top6.map(t => t.id);
    } else {
      const top6 = sqliteDb.prepare(`
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
  }

  if (dbType === 'mysql') {
    await mysqlPool.query('UPDATE contestants SET round1_qualified = 0 WHERE category = ?', [category]);
    for (const id of qualifiedIds) {
      await mysqlPool.query('UPDATE contestants SET round1_qualified = 1 WHERE id = ?', [id]);
    }
  } else {
    sqliteDb.prepare('UPDATE contestants SET round1_qualified = 0 WHERE category = ?').run(category);
    const updateStmt = sqliteDb.prepare('UPDATE contestants SET round1_qualified = 1 WHERE id = ?');
    for (const id of qualifiedIds) {
      updateStmt.run(id);
    }
  }

  return qualifiedIds;
}

async function finalizeRound2(category, { winner_id, runner_up_1_id, runner_up_2_id, costume_id, popular_id }) {
  if (dbType === 'mysql') {
    await mysqlPool.query(`
      UPDATE contestants 
      SET round2_rank = NULL, award_costume = 0, award_popular = 0
      WHERE category = ?
    `, [category]);
    if (winner_id) await mysqlPool.query('UPDATE contestants SET round2_rank = 1 WHERE id = ?', [winner_id]);
    if (runner_up_1_id) await mysqlPool.query('UPDATE contestants SET round2_rank = 2 WHERE id = ?', [runner_up_1_id]);
    if (runner_up_2_id) await mysqlPool.query('UPDATE contestants SET round2_rank = 3 WHERE id = ?', [runner_up_2_id]);
    if (costume_id) await mysqlPool.query('UPDATE contestants SET award_costume = 1 WHERE id = ?', [costume_id]);
    if (popular_id) await mysqlPool.query('UPDATE contestants SET award_popular = 1 WHERE id = ?', [popular_id]);
  } else {
    sqliteDb.prepare(`
      UPDATE contestants 
      SET round2_rank = NULL, award_costume = 0, award_popular = 0
      WHERE category = ?
    `).run(category);
    if (winner_id) sqliteDb.prepare('UPDATE contestants SET round2_rank = 1 WHERE id = ?').run(winner_id);
    if (runner_up_1_id) sqliteDb.prepare('UPDATE contestants SET round2_rank = 2 WHERE id = ?').run(runner_up_1_id);
    if (runner_up_2_id) sqliteDb.prepare('UPDATE contestants SET round2_rank = 3 WHERE id = ?').run(runner_up_2_id);
    if (costume_id) sqliteDb.prepare('UPDATE contestants SET award_costume = 1 WHERE id = ?').run(costume_id);
    if (popular_id) sqliteDb.prepare('UPDATE contestants SET award_popular = 1 WHERE id = ?').run(popular_id);
  }
}

async function resetScores(round, category) {
  if (dbType === 'mysql') {
    if (category && category !== 'ALL') {
      const [contestants] = await mysqlPool.query('SELECT id FROM contestants WHERE category = ?', [category]);
      const cIds = contestants.map(c => c.id);
      if (cIds.length > 0) {
        const placeholders = cIds.map(() => '?').join(',');
        if (round) {
          await mysqlPool.query(`DELETE FROM scores WHERE contestant_id IN (${placeholders}) AND round = ?`, [...cIds, round]);
        } else {
          await mysqlPool.query(`DELETE FROM scores WHERE contestant_id IN (${placeholders})`, cIds);
        }
      }
    } else {
      if (round) {
        await mysqlPool.query('DELETE FROM scores WHERE round = ?', [round]);
      } else {
        await mysqlPool.query('DELETE FROM scores');
      }
    }
  } else {
    if (category && category !== 'ALL') {
      const contestants = sqliteDb.prepare('SELECT id FROM contestants WHERE category = ?').all(category);
      const cIds = contestants.map(c => c.id);
      if (cIds.length > 0) {
        const placeholders = cIds.map(() => '?').join(',');
        if (round) {
          sqliteDb.prepare(`DELETE FROM scores WHERE contestant_id IN (${placeholders}) AND round = ?`).run(...cIds, round);
        } else {
          sqliteDb.prepare(`DELETE FROM scores WHERE contestant_id IN (${placeholders})`).run(...cIds);
        }
      }
    } else {
      if (round) {
        sqliteDb.prepare('DELETE FROM scores WHERE round = ?').run(round);
      } else {
        sqliteDb.prepare('DELETE FROM scores').run();
      }
    }
  }
}

async function getContestantCategory(contestantId) {
  if (dbType === 'mysql') {
    const [rows] = await mysqlPool.query('SELECT category FROM contestants WHERE id = ?', [contestantId]);
    return rows[0] ? rows[0].category : null;
  } else {
    const row = sqliteDb.prepare('SELECT category FROM contestants WHERE id = ?').get(contestantId);
    return row ? row.category : null;
  }
}

module.exports = {
  initDatabase,
  getSettings,
  saveSetting,
  getJudges,
  updateJudge,
  getContestants,
  updateContestant,
  getScore,
  saveScore,
  getAdminSummary,
  qualifyRound1,
  finalizeRound2,
  resetScores,
  getContestantCategory,
  getDbType: () => dbType
};
