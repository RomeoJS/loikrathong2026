import React, { useState, useEffect } from 'react';
import { Printer, Download, Eye, CheckCircle2 } from 'lucide-react';

export default function PrintReports({
  category,
  round,
  judges = []
}) {
  const [reportType, setReportType] = useState('r1_sheet'); // 'r1_sheet' | 'r2_sheet' | 'award_sheet'
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrintData = async () => {
    setLoading(true);
    try {
      const targetRound = reportType === 'r2_sheet' ? 2 : 1;
      const res = await fetch(`/api/admin/summary?category=${category}&round=${targetRound}`);
      const data = await res.json();
      setContestants(data.contestants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrintData();
  }, [category, reportType]);

  const handlePrint = () => {
    window.print();
  };

  const isWomen = category === 'WOMEN';
  const categoryTitle = isWomen ? 'นางนพมาศ' : 'เทพบุตร';
  const activeJudges = judges.slice(0, 3);

  // Awards finder
  const winner = contestants.find(c => c.round2_rank === 1);
  const runner1 = contestants.find(c => c.round2_rank === 2);
  const runner2 = contestants.find(c => c.round2_rank === 3);
  const costume = contestants.find(c => c.award_costume === 1);
  const popular = contestants.find(c => c.award_popular === 1);

  return (
    <div className="space-y-6">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span>พิมพ์เอกสารและรายงานทางการ (ผลรวมกรรมการ ๓ ท่านหาร ๓)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            แบบฟอร์มเอกสารได้รับการจัดทำตามรูปแบบทางการ มทร.กรุงเทพ (กรรมการตัดสิน ๓ ท่าน)
          </p>
        </div>

        {/* Form Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setReportType('r1_sheet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                reportType === 'r1_sheet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ใบคะแนนรอบแรก
            </button>
            <button
              onClick={() => setReportType('r2_sheet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                reportType === 'r2_sheet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ใบคะแนนรอบสอง (๖ คน)
            </button>
            <button
              onClick={() => setReportType('award_sheet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                reportType === 'award_sheet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ใบประกาศผลรางวัล (๕ รางวัล)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสาร / บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* ================= PRINT PREVIEW CONTAINER (Paper Sheet) ================= */}
      <div className="bg-white text-slate-950 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-5xl mx-auto border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        {/* Document Header with Official RMUTK Logos */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <img
            src="/images/header_logo.png"
            alt="ตรามหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ"
            className="h-16 w-full object-contain"
          />
        </div>

        {/* ----------------- REPORT TYPE 1: ROUND 1 SCORE SHEET ----------------- */}
        {reportType === 'r1_sheet' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-slate-900">
                รายชื่อผู้เข้าประกวด{categoryTitle} ราชมงคลกรุงเทพ ประจำปี ๒๕๖๙
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                รอบแรก วันที่ ๒๔ พฤศจิกายน ๒๕๖๙ (คะแนนเฉลี่ยจากกรรมการ ๓ ท่าน)
              </p>
              <p className="text-xs text-slate-700">
                ณ เวทีกลางสำนักงานอธิการบดี มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ
              </p>
            </div>

            <table className="w-full text-center border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th rowSpan={2} className="border border-slate-900 p-1 w-10">ลำดับ</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-44">ชื่อ-สกุล</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-36">สถานศึกษา</th>
                  <th colSpan={3} className="border border-slate-900 p-1">การแต่งกาย (เฉลี่ย)</th>
                  <th colSpan={4} className="border border-slate-900 p-1">บุคลิกภาพ (เฉลี่ย)</th>
                  <th colSpan={2} className="border border-slate-900 p-1">ความงามของใบหน้า/กิริยา (เฉลี่ย)</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-16 bg-slate-200">รวมคะแนน ๑๐๐</th>
                </tr>
                <tr className="bg-slate-50 text-[10px]">
                  <th className="border border-slate-900 p-0.5">ชุด {isWomen ? 15 : 20}</th>
                  <th className="border border-slate-900 p-0.5">ผม {isWomen ? 10 : 5}</th>
                  <th className="border border-slate-900 p-0.5">รองเท้า 5</th>
                  <th className="border border-slate-900 p-0.5">เดิน 5</th>
                  <th className="border border-slate-900 p-0.5">ยืน 5</th>
                  <th className="border border-slate-900 p-0.5">สง่างาม 15</th>
                  <th className="border border-slate-900 p-0.5">น้ำเสียง 5</th>
                  <th className="border border-slate-900 p-0.5">ใบหน้า 30</th>
                  <th className="border border-slate-900 p-0.5">การไหว้ 10</th>
                </tr>
              </thead>
              <tbody>
                {contestants.map((c) => {
                  const ca = c.criteria_averages || {};
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="border border-slate-900 p-1 font-semibold">{c.number}</td>
                      <td className="border border-slate-900 p-1 text-left font-medium">
                        {c.prefix}{c.first_name} {c.last_name}
                      </td>
                      <td className="border border-slate-900 p-1 text-left text-[11px] truncate">
                        {c.school}
                      </td>
                      {/* Averaged Criteria slots (ผลรวมกรรมการ 3 ท่านหาร 3) */}
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_dress_accuracy > 0 ? ca.c_dress_accuracy : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_hair > 0 ? ca.c_hair : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_shoes > 0 ? ca.c_shoes : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_walk > 0 ? ca.c_walk : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_stand > 0 ? ca.c_stand : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_elegance > 0 ? ca.c_elegance : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_voice > 0 ? ca.c_voice : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_face_symmetry > 0 ? ca.c_face_symmetry : ''}</td>
                      <td className="border border-slate-900 p-1 text-[11px]">{ca.c_wai > 0 ? ca.c_wai : ''}</td>
                      <td className="border border-slate-900 p-1 font-bold text-center bg-slate-50">
                        {c.average_score > 0 ? c.average_score : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 3 Judges Signature Lines */}
            <div className="mt-10 pt-4">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                {activeJudges.map((j) => (
                  <div key={j.id} className="space-y-1">
                    <p>.......................................................................</p>
                    <p className="font-semibold text-slate-800">{j.name}</p>
                    <p className="text-[10px] text-slate-600">{j.title || 'กรรมการตัดสิน'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- REPORT TYPE 2: ROUND 2 SCORE SHEET ----------------- */}
        {reportType === 'r2_sheet' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-slate-900">
                รายชื่อผู้เข้าประกวด{categoryTitle} ราชมงคลกรุงเทพ ประจำปี ๒๕๖๙
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                รอบสอง วันที่ ๒๔ พฤศจิกายน ๒๕๖๙ (คะแนนเฉลี่ยจากกรรมการ ๓ ท่าน)
              </p>
              <p className="text-xs text-slate-700">
                ณ เวทีกลางสำนักงานอธิการบดี มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ
              </p>
            </div>

            <table className="w-full text-center border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th rowSpan={2} className="border border-slate-900 p-1 w-10">ลำดับ</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-44">ชื่อ-สกุล</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-36">สถานศึกษา</th>
                  <th colSpan={3} className="border border-slate-900 p-1">รูปร่าง/บุคลิกภาพ (เฉลี่ย)</th>
                  <th className="border border-slate-900 p-1">ปฏิภาณไหวพริบ (เฉลี่ย)</th>
                  <th colSpan={2} className="border border-slate-900 p-1">ตอบคำถามตรงประเด็น (เฉลี่ย)</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-16 bg-slate-200">รวมคะแนน ๑๐๐</th>
                </tr>
                <tr className="bg-slate-50 text-[10px]">
                  <th className="border border-slate-900 p-0.5">เดิน 10</th>
                  <th className="border border-slate-900 p-0.5">ยืน 10</th>
                  <th className="border border-slate-900 p-0.5">ไหว้ 10</th>
                  <th className="border border-slate-900 p-0.5">เชื่อมโยงสถานการณ์ 20</th>
                  <th className="border border-slate-900 p-0.5">มีความรู้ 30</th>
                  <th className="border border-slate-900 p-0.5">ตรงประเด็น 20</th>
                </tr>
              </thead>
              <tbody>
                {(contestants.filter(c => c.round1_qualified === 1).length > 0
                  ? contestants.filter(c => c.round1_qualified === 1)
                  : contestants.slice(0, 6)
                ).map((c, idx) => {
                  const ca = c.criteria_averages || {};
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="border border-slate-900 p-2 font-semibold">{idx + 1}</td>
                      <td className="border border-slate-900 p-2 text-left font-medium">
                        {c.prefix}{c.first_name} {c.last_name}
                      </td>
                      <td className="border border-slate-900 p-2 text-left text-[11px]">
                        {c.school}
                      </td>
                      <td className="border border-slate-900 p-2">{ca.c_r2_walk > 0 ? ca.c_r2_walk : ''}</td>
                      <td className="border border-slate-900 p-2">{ca.c_r2_stand > 0 ? ca.c_r2_stand : ''}</td>
                      <td className="border border-slate-900 p-2">{ca.c_r2_wai > 0 ? ca.c_r2_wai : ''}</td>
                      <td className="border border-slate-900 p-2">{ca.c_r2_situation > 0 ? ca.c_r2_situation : ''}</td>
                      <td className="border border-slate-900 p-2">{ca.c_r2_knowledge > 0 ? ca.c_r2_knowledge : ''}</td>
                      <td className="border border-slate-900 p-2">{ca.c_r2_relevance > 0 ? ca.c_r2_relevance : ''}</td>
                      <td className="border border-slate-900 p-2 font-bold text-center bg-slate-50">
                        {c.average_score > 0 ? c.average_score : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 3 Judges Signature Lines */}
            <div className="mt-10 pt-4">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                {activeJudges.map((j) => (
                  <div key={j.id} className="space-y-1">
                    <p>.......................................................................</p>
                    <p className="font-semibold text-slate-800">{j.name}</p>
                    <p className="text-[10px] text-slate-600">{j.title || 'กรรมการตัดสิน'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- REPORT TYPE 3: OFFICIAL AWARDS CERTIFICATE ----------------- */}
        {reportType === 'award_sheet' && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                ผลการตัดสินประกวด{categoryTitle} ราชมงคลกรุงเทพ ประจำปี ๒๕๖๙
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                วันที่ ๒๔ พฤศจิกายน ๒๕๖๙ (ตัดสินโดยคณะกรรมการ ๓ ท่าน)
              </p>
              <p className="text-xs text-slate-700">
                ณ มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-900 text-sm mb-8">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-900 p-2.5 text-left w-1/2">ผลการตัดสิน</th>
                  <th className="border border-slate-900 p-2.5 text-left w-1/2">ได้แก่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                <tr>
                  <td className="border border-slate-900 p-3 font-semibold">
                    รางวัล{isWomen ? 'นางนพมาศ' : 'เทพบุตร'}แต่งกายงาม ราชมงคลกรุงเทพ
                  </td>
                  <td className="border border-slate-900 p-3">
                    หมายเลข {costume ? String(costume.number).padStart(2, '0') : '................'} {' '}
                    {costume ? `${costume.prefix}${costume.first_name} ${costume.last_name}` : (isWomen ? 'นางสาว .................................................' : 'นาย .................................................')}
                  </td>
                </tr>

                <tr>
                  <td className="border border-slate-900 p-3 font-semibold">
                    รางวัล{isWomen ? 'นางนพมาศ' : 'เทพบุตร'} ขวัญใจราชมงคลกรุงเทพ
                  </td>
                  <td className="border border-slate-900 p-3">
                    หมายเลข {popular ? String(popular.number).padStart(2, '0') : '................'} {' '}
                    {popular ? `${popular.prefix}${popular.first_name} ${popular.last_name}` : (isWomen ? 'นางสาว .................................................' : 'นาย .................................................')}
                  </td>
                </tr>

                <tr>
                  <td className="border border-slate-900 p-3 font-semibold">
                    รางวัลรองชนะเลิศ อันดับ ๒ {categoryTitle}ราชมงคลกรุงเทพ
                  </td>
                  <td className="border border-slate-900 p-3">
                    หมายเลข {runner2 ? String(runner2.number).padStart(2, '0') : '................'} {' '}
                    {runner2 ? `${runner2.prefix}${runner2.first_name} ${runner2.last_name}` : (isWomen ? 'นางสาว .................................................' : 'นาย .................................................')}
                  </td>
                </tr>

                <tr>
                  <td className="border border-slate-900 p-3 font-semibold">
                    รางวัลรองชนะเลิศ อันดับ ๑ {categoryTitle}ราชมงคลกรุงเทพ
                  </td>
                  <td className="border border-slate-900 p-3">
                    หมายเลข {runner1 ? String(runner1.number).padStart(2, '0') : '................'} {' '}
                    {runner1 ? `${runner1.prefix}${runner1.first_name} ${runner1.last_name}` : (isWomen ? 'นางสาว .................................................' : 'นาย .................................................')}
                  </td>
                </tr>

                <tr className="bg-amber-50">
                  <td className="border border-slate-900 p-3 font-bold text-base">
                    รางวัลชนะเลิศ{categoryTitle} ราชมงคลกรุงเทพ ประจำปี ๒๕๖๙
                  </td>
                  <td className="border border-slate-900 p-3 font-bold text-base">
                    หมายเลข {winner ? String(winner.number).padStart(2, '0') : '................'} {' '}
                    {winner ? `${winner.prefix}${winner.first_name} ${winner.last_name}` : (isWomen ? 'นางสาว .................................................' : 'นาย .................................................')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3 Judges Signature Lines */}
            <div className="mt-12 pt-6">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                {activeJudges.map((j) => (
                  <div key={j.id} className="space-y-1">
                    <p>(.......................................................................)</p>
                    <p className="font-semibold text-slate-800">{j.name}</p>
                    <p className="text-[10px] text-slate-600">{j.title || 'กรรมการตัดสิน'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
