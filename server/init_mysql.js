const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'loikrathong2026';

async function initMySQL() {
  console.log(`Connecting to MySQL on ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);
  const conn = await mysql.createConnection(dbConfig);

  // 1. Create Database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await conn.query(`USE \`${DB_NAME}\`;`);

  // 2. Create Tables
  await conn.query(`
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

  // 3. Seed Default Settings
  const [settings] = await conn.query('SELECT `key` FROM settings WHERE `key` = "active_round"');
  if (settings.length === 0) {
    await conn.query('INSERT INTO settings (`key`, `value`) VALUES ("active_round", "1"), ("active_category", "WOMEN")');
  }

  // 4. Seed 6 Judges if not exist
  const [judges] = await conn.query('SELECT COUNT(*) as count FROM judges');
  if (judges[0].count === 0) {
    for (let i = 1; i <= 6; i++) {
      await conn.query('INSERT INTO judges (id, name, title) VALUES (?, ?, ?)', [
        i, `กรรมการตัดสินท่านที่ ${i}`, 'กรรมการผู้ทรงคุณวุฒิ'
      ]);
    }
  }

  // 5. Seed Contestants if not exist
  const [contestants] = await conn.query('SELECT COUNT(*) as count FROM contestants');
  if (contestants[0].count === 0) {
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
      { num: 9, prefix: 'น.ส.', first: 'ชนัญญา', last: 'แก้วเหมือน', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/placeholder.svg' },
      { num: 10, prefix: 'น.ส.', first: 'ธัญยพร', last: 'โสภาวัตร', school: 'มหาวิทยาลัยสวนดุสิต', img: '/images/women/MS10.jpg' },
      { num: 11, prefix: 'น.ส.', first: 'พิมพ์อัปสร', last: 'แตงโสภา', school: 'มหาวิทยาลัยราชภัฏสวนสุนันทา', img: '/images/women/MS11.jpeg' },
      { num: 12, prefix: 'น.ส.', first: 'กัญญาณัฐ', last: 'อินทรสวัสดิ์', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/women/MS12.jpg' },
      { num: 13, prefix: 'น.ส.', first: 'มณีรินทร์', last: 'ไชยปัญญา', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/women/MS13.jpeg' },
      { num: 14, prefix: 'น.ส.', first: 'กัญญาณัฐ', last: 'เจริญชวลิตกุล', school: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', img: '/images/women/MS14.jpeg' },
      { num: 15, prefix: 'น.ส.', first: 'ณัชฌารีย์', last: 'สิริไสย์', school: 'ม.เทคโนโลยีราชมงคลพระนคร', img: '/images/women/MS15.jpeg' },
    ];

    for (const w of womenList) {
      await conn.query(
        'INSERT INTO contestants (number, category, prefix, first_name, last_name, school, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [w.num, 'WOMEN', w.prefix, w.first, w.last, w.school, w.img]
      );
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
      { num: 10, prefix: 'นาย', first: 'ภัทรพล', last: 'ก้องเวหา', school: 'ม.เทคโนโลยีราชมงคลกรุงเทพ', img: '/images/placeholder.svg' },
      { num: 11, prefix: 'นาย', first: 'วีรวัฒน์', last: 'อยู่คง', school: 'มหาวิทยาลัยราชภัฏจันเกษม', img: '/images/men/M11.JPG' },
      { num: 12, prefix: 'นาย', first: 'ศิรวิชญ์', last: 'ปริยานนท์', school: 'วิทยาลัยเทคนิคร้อยเอ็ด', img: '/images/men/M12.png' },
    ];

    for (const m of menList) {
      await conn.query(
        'INSERT INTO contestants (number, category, prefix, first_name, last_name, school, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [m.num, 'MEN', m.prefix, m.first, m.last, m.school, m.img]
      );
    }
  }

  console.log(`Database "${DB_NAME}" created and initialized successfully with tables and contestants!`);
  await conn.end();
}

if (require.main === module) {
  initMySQL().catch(err => {
    console.error('Initialization error:', err);
    process.exit(1);
  });
}

module.exports = { initMySQL };
