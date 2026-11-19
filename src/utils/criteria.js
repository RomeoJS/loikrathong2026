// Scoring criteria rules based on the official RMUTK Loy Krathong 2569 competition guidelines

export const CRITERIA_ROUND_1_WOMEN = [
  {
    category: 'การแต่งกาย',
    maxTotal: 30,
    items: [
      { key: 'c_dress_accuracy', name: 'ความถูกต้องของชุด', max: 15, desc: 'ความถูกต้องตามแบบแผนประเพณีไทย' },
      { key: 'c_hair', name: 'ทรงผม', max: 10, desc: 'ความประณีต เรียบร้อย และเข้ากับชุด' },
      { key: 'c_shoes', name: 'รองเท้า', max: 5, desc: 'ความเหมาะสม ถูกต้องตามระเบียบ' },
    ]
  },
  {
    category: 'บุคลิกภาพ',
    maxTotal: 30,
    items: [
      { key: 'c_walk', name: 'การเดิน', max: 5, desc: 'จังหวะการเดิน ความมั่นใจ' },
      { key: 'c_stand', name: 'การยืน', max: 5, desc: 'การทรงตัว ท่าทางการยืน' },
      { key: 'c_elegance', name: 'ความสง่างาม', max: 15, desc: 'กิริยา ความสง่างามโดยรวม' },
      { key: 'c_voice', name: 'น้ำเสียง', max: 5, desc: 'ความชัดเจน ความไพเราะ' },
    ]
  },
  {
    category: 'ความงามของใบหน้า / กิริยามารยาท',
    maxTotal: 40,
    items: [
      { key: 'c_face_symmetry', name: 'ใบหน้าสมส่วน', max: 30, desc: 'ความงามของใบหน้า รอยยิ้ม ความเป็นธรรมชาติ' },
      { key: 'c_wai', name: 'การไหว้', max: 10, desc: 'ความถูกต้องตามมารยาทไทย อ่อนช้อย' },
    ]
  }
];

export const CRITERIA_ROUND_1_MEN = [
  {
    category: 'การแต่งกาย',
    maxTotal: 30,
    items: [
      { key: 'c_dress_accuracy', name: 'ความถูกต้องของชุด', max: 20, desc: 'ความถูกต้องตามแบบแผนประเพณีไทย' },
      { key: 'c_hair', name: 'ทรงผม', max: 5, desc: 'ความประณีต เรียบร้อย และเข้ากับชุด' },
      { key: 'c_shoes', name: 'รองเท้า', max: 5, desc: 'ความเหมาะสม ถูกต้องตามระเบียบ' },
    ]
  },
  {
    category: 'บุคลิกภาพ',
    maxTotal: 30,
    items: [
      { key: 'c_walk', name: 'การเดิน', max: 5, desc: 'จังหวะการเดิน ความมั่นใจ ความผึ่งผาย' },
      { key: 'c_stand', name: 'การยืน', max: 5, desc: 'การทรงตัว ท่าทางการยืนสง่าผ่าเผย' },
      { key: 'c_elegance', name: 'ความสง่างาม', max: 15, desc: 'กิริยา ความสง่างามโดยรวม' },
      { key: 'c_voice', name: 'น้ำเสียง', max: 5, desc: 'ความชัดเจน มีพลัง น่าฟัง' },
    ]
  },
  {
    category: 'ความงามของใบหน้า / กิริยามารยาท',
    maxTotal: 40,
    items: [
      { key: 'c_face_symmetry', name: 'ใบหน้าสมส่วน', max: 30, desc: 'ความงามของใบหน้า รอยยิ้ม เสน่ห์บุคลิก' },
      { key: 'c_wai', name: 'การไหว้', max: 10, desc: 'ความถูกต้องตามมารยาทไทย สุภาพสง่างาม' },
    ]
  }
];

export const CRITERIA_ROUND_2_BOTH = [
  {
    category: 'รูปร่าง / บุคลิกภาพ',
    maxTotal: 30,
    items: [
      { key: 'c_r2_walk', name: 'การเดิน', max: 10, desc: 'ความสง่างาม ความมั่นใจบนเวที' },
      { key: 'c_r2_stand', name: 'การยืน', max: 10, desc: 'ท่วงท่า ความสง่าผ่าเผย' },
      { key: 'c_r2_wai', name: 'การไหว้', max: 10, desc: 'ความถูกต้องและงดงามตามแบบแผนไทย' },
    ]
  },
  {
    category: 'ปฏิภาณไหวพริบในการตอบคำถาม',
    maxTotal: 20,
    items: [
      { key: 'c_r2_situation', name: 'การเชื่อมโยงกับสถานการณ์', max: 20, desc: 'การประยุกต์และเชื่อมโยงคำตอบกับสถานการณ์ปัจจุบัน' },
    ]
  },
  {
    category: 'ตอบคำถามตรงประเด็น',
    maxTotal: 50,
    items: [
      { key: 'c_r2_knowledge', name: 'มีความรู้', max: 30, desc: 'ความรู้ความเข้าใจ สาระประโยชน์ในคำตอบ' },
      { key: 'c_r2_relevance', name: 'ตรงประเด็น', max: 20, desc: 'ความกระชับ ตรงตามคำถาม ไม่วกวน' },
    ]
  }
];

export function getCriteria(round, category) {
  if (Number(round) === 2) {
    return CRITERIA_ROUND_2_BOTH;
  }
  if (category === 'MEN') {
    return CRITERIA_ROUND_1_MEN;
  }
  return CRITERIA_ROUND_1_WOMEN;
}

export function calculateTotalScore(criteriaGroup, scores) {
  let total = 0;
  for (const group of criteriaGroup) {
    for (const item of group.items) {
      const val = Number(scores[item.key]) || 0;
      total += Math.min(Math.max(val, 0), item.max);
    }
  }
  return Math.round(total * 100) / 100;
}
