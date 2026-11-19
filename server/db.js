const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDb() {
  db.exec(`
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

  // Initialize default settings if not exists
  const checkSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  if (!checkSetting.get('active_round')) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('active_round', '1');
  }
  if (!checkSetting.get('active_category')) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('active_category', 'WOMEN');
  }

  // Initialize 6 judges if not exists
  const countJudges = db.prepare('SELECT COUNT(*) as count FROM judges').get().count;
  if (countJudges === 0) {
    const insertJudge = db.prepare('INSERT INTO judges (id, name, title) VALUES (?, ?, ?)');
    for (let i = 1; i <= 6; i++) {
      insertJudge.run(i, `กรรมการตัดสินท่านที่ ${i}`, 'กรรมการผู้ทรงคุณวุฒิ');
    }
  }

  // Check contestants
  const countContestants = db.prepare('SELECT COUNT(*) as count FROM contestants').get().count;
  if (countContestants === 0) {
    seedContestants();
  }
}

function seedContestants() {
  const insertContestant = db.prepare(`
    INSERT INTO contestants (number, category, prefix, first_name, last_name, school, image_url, round1_qualified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 15 นางนพมาศ (WOMEN)
  const womenList = [
    { num: 1, prefix: 'น.ส.', first: 'ชวิศา', last: 'วิศิษฐ์เสวีวัฒน์', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/women/MS01.jpg' },
    { num: 2, prefix: 'น.ส.', first: 'สุภัสสร', last: 'พรพิฆเนส', school: 'มหาวิทยาลัยกรุงเทพ', img: '/images/women/MS02.jpg' },
    { num: 3, prefix: 'น.ส.', first: 'จุฬารัตน์', last: 'มีดี', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS03.jpg' },
    { num: 4, prefix: 'น.ส.', first: 'นันท์นภัส', last: 'ฮดคำ', school: 'มหาวิทยาลัยบูรพา', img: '/images/women/MS04.jpg' },
    { num: 5, prefix: 'น.ส.', first: 'อรณิชา', last: 'คุ้มนุช', school: 'มหาวิทยาลัยศิลปากร', img: '/images/women/MS05.jpg' },
    { num: 6, prefix: 'น.ส.', first: 'อรไท', last: 'ประเสริฐ', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS06.jpeg' },
    { num: 7, prefix: 'น.ส.', first: 'ธัญรดา', last: 'แสนสุข', school: 'มหาวิทยาลัยขอนแก่น', img: '/images/women/MS07.jpeg' },
    { num: 8, prefix: 'น.ส.', first: 'ธมลวรรณ', last: 'แก้วแจ่มศรี', school: 'มหาวิทยาลัยกรุงเทพ', img: '/images/women/MS08.jpg' },
    { num: 9, prefix: 'น.ส.', first: 'ชนัญญา', last: 'แก้วเหมือน', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/placeholder.png' },
    { num: 10, prefix: 'น.ส.', first: 'ธัญยพร', last: 'โสภาวัตร', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/women/MS10.jpg' },
    { num: 11, prefix: 'น.ส.', first: 'พิมพ์อัปสร', last: 'แตงโสภา', school: 'มหาวิทยาลัยราชภัฏสวนสุนันทา', img: '/images/women/MS11.jpeg' },
    { num: 12, prefix: 'น.ส.', first: 'กัญญาณัฐ', last: 'อินทรสวัสดิ์', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS12.jpg' },
    { num: 13, prefix: 'น.ส.', first: 'มณีรินทร์', last: 'ไชยปัญญา', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/women/MS13.jpeg' },
    { num: 14, prefix: 'น.ส.', first: 'กัญญาณัฐ', last: 'เจริญชวลิตกุล', school: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', img: '/images/women/MS14.jpeg' },
    { num: 15, prefix: 'น.ส.', first: 'ณัชฌารีย์', last: 'สิริไสย์', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/women/MS15.jpeg' },
  ];

  for (const w of womenList) {
    insertContestant.run(w.num, 'WOMEN', w.prefix, w.first, w.last, w.school, w.img, 0);
  }

  // 12 เทพบุตร (MEN)
  const menList = [
    { num: 1, prefix: 'นาย', first: 'ศุภโชค', last: 'ธนกรธำรง', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/men/M01.jpg' },
    { num: 2, prefix: 'นาย', first: 'บัลลังก์ราช', last: 'จองนันตา', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/men/M02.jpg' },
    { num: 3, prefix: 'นาย', first: 'ธนภัทร', last: 'ใจสมุทร', school: 'ม.เทคโนโลยีราชมงคลธัญบุรี', img: '/images/men/M03.jpeg' },
    { num: 4, prefix: 'นาย', first: 'วัชรพงษ์', last: 'จีนชู', school: 'มหาวิทยาลัยรามคำแหง', img: '/images/men/M04.jpg' },
    { num: 5, prefix: 'นาย', first: 'วัทธิกร', last: 'พงศ์ศุภะมงคล', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/men/M05.jpeg' },
    { num: 6, prefix: 'นาย', first: 'กุญช์วริทธิ์พล', last: 'ศรีบุญรอด', school: 'มหาวิทยาลัยธรรมศาสตร์', img: '/images/men/M06.jpeg' },
    { num: 7, prefix: 'นาย', first: 'ธนาวุฒิ', last: 'กิตติกุลเจริญ', school: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', img: '/images/men/M07.jpeg' },
    { num: 8, prefix: 'นาย', first: 'กฤษฎา', last: 'กิตณรงค์', school: 'มหาวิทยาลัยศรีปทุม', img: '/images/men/M08.jpeg' },
    { num: 9, prefix: 'นาย', first: 'ตั้งปณิธาน', last: 'นาก้อนทอง', school: 'มหาวิทยาลัยมหาสารคาม', img: '/images/men/M09.jpg' },
    { num: 10, prefix: 'นาย', first: 'ภัทรพล', last: 'ก้องเวหา', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/men/placeholder.png' },
    { num: 11, prefix: 'นาย', first: 'วีรวัฒน์', last: 'อยู่คง', school: 'มหาวิทยาลัยราชภัฏจันทรเกษม', img: '/images/men/M11.JPG' },
    { num: 12, prefix: 'นาย', first: 'ศิรวิชญ์', last: 'ปริยานนท์', school: 'วิทยาลัยเทคนิคร้อยเอ็ด', img: '/images/men/M12.png' },
  ];

  for (const m of menList) {
    insertContestant.run(m.num, 'MEN', m.prefix, m.first, m.last, m.school, m.img, 0);
  }
}

initDb();

module.exports = {
  db,
  initDb,
  seedContestants
};
