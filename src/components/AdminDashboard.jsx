import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Award, 
  RefreshCw, 
  Sparkles, 
  TrendingUp, 
  Eye, 
  X, 
  Medal,
  ChevronRight,
  Sliders,
  Crown,
  LayoutGrid,
  Table
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboard({
  category,
  round,
  setRound,
  onDataChanged
}) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('judges'); // 'judges' | 'criteria'
  const [selectedScoreDetail, setSelectedScoreDetail] = useState(null);
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [selectedQualifyIds, setSelectedQualifyIds] = useState([]);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardsForm, setAwardsForm] = useState({
    winner_id: '',
    runner_up_1_id: '',
    runner_up_2_id: '',
    costume_id: '',
    popular_id: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/summary?category=${category}&round=${round}`);
      const data = await res.json();
      setSummaryData(data);

      if (data && data.contestants) {
        const qualified = data.contestants.filter(c => c.round1_qualified === 1).map(c => c.id);
        if (qualified.length > 0) {
          setSelectedQualifyIds(qualified);
        } else {
          setSelectedQualifyIds(data.contestants.slice(0, 6).map(c => c.id));
        }

        const w = data.contestants.find(c => c.round2_rank === 1)?.id || data.contestants[0]?.id || '';
        const r1 = data.contestants.find(c => c.round2_rank === 2)?.id || data.contestants[1]?.id || '';
        const r2 = data.contestants.find(c => c.round2_rank === 3)?.id || data.contestants[2]?.id || '';
        const cos = data.contestants.find(c => c.award_costume === 1)?.id || '';
        const pop = data.contestants.find(c => c.award_popular === 1)?.id || '';

        setAwardsForm({
          winner_id: w,
          runner_up_1_id: r1,
          runner_up_2_id: r2,
          costume_id: cos,
          popular_id: pop
        });
      }
    } catch (err) {
      console.error('Failed to load admin summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [category, round]);

  const handleConfirmQualify = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/qualify-round-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          contestant_ids: selectedQualifyIds
        })
      });
      const result = await res.json();
      if (result.success) {
        setShowQualifyModal(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        await fetchSummary();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการคัดเลือก');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizeAwards = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/finalize-round-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          ...awardsForm
        })
      });
      const result = await res.json();
      if (result.success) {
        setShowAwardModal(false);
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        await fetchSummary();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกผลรางวัล');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!window.confirm(`คุณต้องการจำลองคะแนนตัวอย่างของกรรมการ ๓ ท่านสำหรับ ${category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'} รอบที่ ${round} หรือไม่?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/seed-demo-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, round })
      });
      const result = await res.json();
      if (result.success) {
        await fetchSummary();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetScores = async () => {
    if (!window.confirm(`⚠️ คำเตือน: คุณต้องการล้างคะแนนทั้งหมดของ ${category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'} ในรอบที่ ${round} ใช่หรือไม่?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/reset-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, round })
      });
      const result = await res.json();
      if (result.success) {
        await fetchSummary();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="ml-3 text-slate-300">กำลังประมวลผลคะแนนเฉลี่ย ๓ ท่าน...</span>
      </div>
    );
  }

  const contestants = summaryData?.contestants || [];
  const judges = (summaryData?.judges || []).slice(0, 3);
  const isWomen = category === 'WOMEN';

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Toolbar */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-400">
                {category === 'WOMEN' ? 'การประกวดนางนพมาศ' : 'การประกวดเทพบุตร'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                ตารางสรุปคะแนนและจัดอันดับ รอบที่ {round === 1 ? '๑ (คัดเหลือ ๖ คน)' : '๒ (ชิงชนะเลิศ)'}
              </span>
            </h2>
            <p className="text-xs text-amber-200/80 mt-1">
              * เกณฑ์การคำนวณ: รวมคะแนนของกรรมการทั้ง ๓ ท่านในแต่ละช่องเกณฑ์แล้วหาร ๓
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {round === 1 ? (
              <button
                onClick={() => setShowQualifyModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
              >
                <Crown className="w-4 h-4" />
                <span>คัดเลือก ๖ คนเข้ารอบ ๒</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAwardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
              >
                <Crown className="w-4 h-4" />
                <span>สรุปผลรางวัล & ชนะเลิศ</span>
              </button>
            )}

            <button
              onClick={handleSeedDemo}
              disabled={actionLoading}
              title="สุ่มกรอกคะแนนสมจริงของกรรมการ ๓ ท่านเพื่อทดสอบระบบ"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>จำลองคะแนน (๓ กรรมการ)</span>
            </button>

            <button
              onClick={handleResetScores}
              disabled={actionLoading}
              title="ล้างคะแนนในรอบนี้ทั้งหมด"
              className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-500/50 text-xs font-medium transition-colors"
            >
              ล้างคะแนน
            </button>

            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="รีเฟรชคะแนนล่าสุด"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">ผู้เข้าประกวดทั้งหมด</div>
            <div className="text-xl font-bold text-white mt-0.5">{contestants.length} คน</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">กรรมการตัดสิน</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">๓ ท่าน</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">อันดับ ๑ ปัจจุบัน (คะแนนเฉลี่ย)</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 truncate">
              {contestants[0] ? `#${contestants[0].number} ${contestants[0].first_name} (${contestants[0].average_score} คะแนน)` : '-'}
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">
              {round === 1 ? 'ผ่านเข้ารอบ ๒ แล้ว' : 'ผู้ชนะเลิศอันดับ ๑'}
            </div>
            <div className="text-sm font-bold text-amber-300 mt-1 truncate">
              {round === 1
                ? `${contestants.filter(c => c.round1_qualified === 1).length} / 6 คน`
                : contestants.find(c => c.round2_rank === 1)
                  ? `#${contestants.find(c => c.round2_rank === 1).number} ${contestants.find(c => c.round2_rank === 1).first_name}`
                  : 'ยังไม่ได้ระบุ'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Scores Matrix & Judges Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              ตารางสรุปคะแนนกรรมการ ๓ ท่าน & คะแนนเฉลี่ยแต่ละช่อง
            </h3>
          </div>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('judges')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'judges' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              แสดงคะแนนรายกรรมการ (ก.๑, ก.๒, ก.๓)
            </button>
            <button
              onClick={() => setViewMode('criteria')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'criteria' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              แสดงเกณฑ์เฉลี่ยแต่ละช่อง (หาร ๓)
            </button>
          </div>
        </div>

        {/* MODE 1: JUDGES VIEW */}
        {viewMode === 'judges' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-xs">
                  <th className="py-3.5 px-3 font-semibold text-center w-12">อันดับ</th>
                  <th className="py-3.5 px-3 font-semibold text-center w-16">หมายเลข</th>
                  <th className="py-3.5 px-3 font-semibold">ผู้เข้าประกวด</th>
                  <th className="py-3.5 px-3 font-semibold">สถานศึกษา</th>
                  {judges.map((j) => (
                    <th key={j.id} className="py-3.5 px-2 font-semibold text-center w-28">
                      <div className="text-xs text-amber-300 truncate">
                        {j.name}
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-3 font-bold text-amber-400 text-center bg-slate-900/60 w-28">
                    คะแนนรวม (๓ ท่าน)
                  </th>
                  <th className="py-3.5 px-3 font-bold text-emerald-400 text-center bg-slate-900/60 w-28">
                    คะแนนเฉลี่ย (หาร ๓)
                  </th>
                  <th className="py-3.5 px-3 font-semibold text-center">สถานะ / รางวัล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {contestants.map((c, index) => {
                  const isTop6 = index < 6;
                  const isQualified = c.round1_qualified === 1;
                  const rank1 = c.round2_rank === 1;
                  const rank2 = c.round2_rank === 2;
                  const rank3 = c.round2_rank === 3;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        round === 1 && isQualified
                          ? 'bg-amber-500/5'
                          : rank1
                          ? 'bg-amber-400/10 font-medium'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center">
                        {c.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                            1
                          </span>
                        ) : c.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md">
                            2
                          </span>
                        ) : c.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">{c.rank}</span>
                        )}
                      </td>

                      {/* Number */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                          #{String(c.number).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Photo & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={c.image_url || '/images/placeholder.svg'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover object-top border border-slate-700"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/placeholder.svg';
                            }}
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {c.prefix}{c.first_name} {c.last_name}
                            </div>
                            {round === 1 && isQualified && (
                              <span className="inline-block mt-0.5 text-[10px] text-amber-300 font-medium bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                                ผ่านเข้ารอบ ๒
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* School */}
                      <td className="py-3 px-3 text-xs text-slate-300 max-w-[160px] truncate">
                        {c.school}
                      </td>

                      {/* 3 Judges Columns */}
                      {judges.map((j) => {
                        const scoreData = c.judge_scores[j.id];
                        return (
                          <td key={j.id} className="py-3 px-2 text-center">
                            {scoreData ? (
                              <button
                                onClick={() => setSelectedScoreDetail({
                                  contestant: c,
                                  judge: j,
                                  score: scoreData.details
                                })}
                                className="group px-2.5 py-1 rounded bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold border border-slate-700/60 hover:border-amber-400 transition-all shadow-sm"
                                title="คลิกเพื่อดูเกณฑ์ย่อยของกรรมการท่านนี้"
                              >
                                <span>{scoreData.total}</span>
                              </button>
                            ) : (
                              <span className="text-slate-600 text-xs">รอลงคะแนน</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Sum */}
                      <td className="py-3 px-3 text-center bg-slate-950/40">
                        <span className="font-black text-amber-300 text-sm">
                          {c.total_sum}
                        </span>
                      </td>

                      {/* Average Score (Divided by 3) */}
                      <td className="py-3 px-3 text-center bg-slate-950/40">
                        <span className="font-black text-emerald-400 text-base">
                          {c.average_score}
                        </span>
                      </td>

                      {/* Badges / Awards */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {rank1 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-400 text-slate-950 border border-amber-300 flex items-center gap-1 shadow">
                              👑 ชนะเลิศ
                            </span>
                          )}
                          {rank2 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-300 text-slate-950 border border-slate-200">
                              🥈 รองอันดับ ๑
                            </span>
                          )}
                          {rank3 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-700 text-white border border-amber-600">
                              🥉 รองอันดับ ๒
                            </span>
                          )}
                          {c.award_costume === 1 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              แต่งกายงาม
                            </span>
                          )}
                          {c.award_popular === 1 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              ขวัญใจ มทร.กรุงเทพ
                            </span>
                          )}
                          {round === 1 && !isQualified && isTop6 && (
                            <span className="px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700 rounded">
                              Top 6
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: CRITERIA BREAKDOWN VIEW (EACH CHANNEL AVERAGED BY 3) */}
        {viewMode === 'criteria' && (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800">
                  <th className="py-3 px-2 w-10">อันดับ</th>
                  <th className="py-3 px-2 w-12">หมายเลข</th>
                  <th className="py-3 px-3 text-left">ผู้เข้าประกวด</th>
                  {round === 1 ? (
                    <>
                      <th className="py-3 px-2 text-amber-300">ชุด ({isWomen ? 15 : 20})</th>
                      <th className="py-3 px-2 text-amber-300">ผม ({isWomen ? 10 : 5})</th>
                      <th className="py-3 px-2 text-amber-300">รองเท้า (5)</th>
                      <th className="py-3 px-2 text-amber-300">เดิน (5)</th>
                      <th className="py-3 px-2 text-amber-300">ยืน (5)</th>
                      <th className="py-3 px-2 text-amber-300">สง่างาม (15)</th>
                      <th className="py-3 px-2 text-amber-300">น้ำเสียง (5)</th>
                      <th className="py-3 px-2 text-amber-300">ใบหน้า (30)</th>
                      <th className="py-3 px-2 text-amber-300">ไหว้ (10)</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-2 text-amber-300">เดิน (10)</th>
                      <th className="py-3 px-2 text-amber-300">ยืน (10)</th>
                      <th className="py-3 px-2 text-amber-300">ไหว้ (10)</th>
                      <th className="py-3 px-2 text-amber-300">สถานการณ์ (20)</th>
                      <th className="py-3 px-2 text-amber-300">มีความรู้ (30)</th>
                      <th className="py-3 px-2 text-amber-300">ตรงประเด็น (20)</th>
                    </>
                  )}
                  <th className="py-3 px-3 font-bold text-emerald-400 bg-slate-950/60">
                    รวมคะแนนเฉลี่ย (๑๐๐)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {contestants.map((c) => {
                  const ca = c.criteria_averages || {};
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 font-semibold text-slate-300">{c.rank}</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-amber-400">#{c.number}</td>
                      <td className="py-2.5 px-3 text-left font-medium text-white truncate max-w-[150px]">
                        {c.prefix}{c.first_name} {c.last_name}
                      </td>
                      {round === 1 ? (
                        <>
                          <td className="py-2.5 px-2">{ca.c_dress_accuracy ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_hair ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_shoes ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_walk ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_stand ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_elegance ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_voice ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_face_symmetry ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_wai ?? '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-2">{ca.c_r2_walk ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_r2_stand ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_r2_wai ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_r2_situation ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_r2_knowledge ?? '-'}</td>
                          <td className="py-2.5 px-2">{ca.c_r2_relevance ?? '-'}</td>
                        </>
                      )}
                      <td className="py-2.5 px-3 font-bold text-emerald-400 bg-slate-950/60 text-sm">
                        {c.average_score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: DETAILED CRITERIA BREAKDOWN ================= */}
      {selectedScoreDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-amber-300 font-semibold">คะแนนอย่างละเอียด</span>
                <h3 className="text-lg font-bold text-white">
                  {selectedScoreDetail.contestant.prefix}{selectedScoreDetail.contestant.first_name} {selectedScoreDetail.contestant.last_name}
                </h3>
                <p className="text-xs text-slate-400">
                  ประเมินโดย: {selectedScoreDetail.judge.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-white text-sm">คะแนนรวมทั้งหมด</span>
                <span className="text-xl font-black text-amber-400">
                  {selectedScoreDetail.score.total_score} / 100
                </span>
              </div>

              {round === 1 ? (
                <>
                  <div className="text-xs font-bold text-amber-300 pt-2">หมวดการแต่งกาย (๓๐ คะแนน)</div>
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>ความถูกต้องของชุด</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_dress_accuracy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ทรงผม</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_hair}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>รองเท้า</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_shoes}</span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-amber-300 pt-2">หมวดบุคลิกภาพ (๓๐ คะแนน)</div>
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>การเดิน</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_walk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>การยืน</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_stand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ความสง่างาม</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_elegance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>น้ำเสียง</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_voice}</span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-amber-300 pt-2">หมวดความงามของใบหน้า / กิริยามารยาท (๔๐ คะแนน)</div>
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>ใบหน้าสมส่วน</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_face_symmetry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>การไหว้</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_wai}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-amber-300 pt-2">หมวดรูปร่าง / บุคลิกภาพ (๓๐ คะแนน)</div>
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>การเดิน (๑๐)</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_r2_walk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>การยืน (๑๐)</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_r2_stand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>การไหว้ (๑๐)</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_r2_wai}</span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-amber-300 pt-2">หมวดปฏิภาณไหวพริบ (๒๐ คะแนน)</div>
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>การเชื่อมโยงกับสถานการณ์ (๒๐)</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_r2_situation}</span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-amber-300 pt-2">หมวดตอบคำถามตรงประเด็น (๕๐ คะแนน)</div>
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>มีความรู้ (๓๐)</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_r2_knowledge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ตรงประเด็น (๒๐)</span>
                      <span className="font-semibold text-amber-300">{selectedScoreDetail.score.c_r2_relevance}</span>
                    </div>
                  </div>
                </>
              )}

              {selectedScoreDetail.score.comment && (
                <div className="pt-2">
                  <div className="text-xs text-slate-400 font-medium">ความเห็นกรรมการ:</div>
                  <div className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800 mt-1 italic">
                    "{selectedScoreDetail.score.comment}"
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUALIFY TOP 6 FOR ROUND 2 ================= */}
      {showQualifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>คัดเลือก ๖ คนสุดท้ายเพื่อเข้าสู่รอบที่ ๒</span>
                </h3>
                <p className="text-xs text-slate-400">
                  ระบบได้เลือก Top 6 ที่ได้คะแนนเฉลี่ยสูงสุดให้อัตโนมัติ (สามารถปรับเปลี่ยนได้หากคะแนนเท่ากัน)
                </p>
              </div>
              <button
                onClick={() => setShowQualifyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 max-h-[55vh] overflow-y-auto">
              {contestants.map((c) => {
                const isSelected = selectedQualifyIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQualifyIds([...selectedQualifyIds, c.id]);
                          } else {
                            setSelectedQualifyIds(selectedQualifyIds.filter(id => id !== c.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
                      />
                      <span className="font-mono font-bold text-xs text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                        #{String(c.number).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {c.prefix}{c.first_name} {c.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.school}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-300">เฉลี่ย {c.average_score}</div>
                      <div className="text-[10px] text-slate-400">รวม ๓ ท่าน: {c.total_sum}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                เลือกแล้ว: <b className="text-amber-400">{selectedQualifyIds.length}</b> จาก ๖ คน
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQualifyModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={actionLoading || selectedQualifyIds.length === 0}
                  onClick={handleConfirmQualify}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {actionLoading ? 'กำลังบันทึก...' : 'ยืนยันและเปิดรอบที่ ๒'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: FINALIZE AWARDS (ROUND 2) ================= */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>ประกาศและบันทึกผลรางวัลอย่างเป็นทางการ</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {category === 'WOMEN' ? 'การตัดสินนางนพมาศ' : 'การตัดสินเทพบุตร'} ประจำปี ๒๕๖๙
                </p>
              </div>
              <button
                onClick={() => setShowAwardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                <label className="block font-bold text-amber-300 mb-1">
                  👑 รางวัลชนะเลิศ ({category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'})
                </label>
                <select
                  value={awardsForm.winner_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, winner_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {contestants.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name} (คะแนนเฉลี่ย: {c.average_score})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <label className="block font-bold text-slate-200 mb-1">
                  🥈 รางวัลรองชนะเลิศ อันดับ ๑
                </label>
                <select
                  value={awardsForm.runner_up_1_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, runner_up_1_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {contestants.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name} (คะแนนเฉลี่ย: {c.average_score})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <label className="block font-bold text-slate-200 mb-1">
                  🥉 รางวัลรองชนะเลิศ อันดับ ๒
                </label>
                <select
                  value={awardsForm.runner_up_2_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, runner_up_2_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {contestants.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name} (คะแนนเฉลี่ย: {c.average_score})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <label className="block font-bold text-purple-300 mb-1">
                  ✨ รางวัลแต่งกายงาม ราชมงคลกรุงเทพ
                </label>
                <select
                  value={awardsForm.costume_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, costume_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {contestants.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <label className="block font-bold text-rose-300 mb-1">
                  💖 รางวัลขวัญใจราชมงคลกรุงเทพ
                </label>
                <select
                  value={awardsForm.popular_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, popular_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {contestants.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAwardModal(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleFinalizeAwards}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                {actionLoading ? 'กำลังบันทึก...' : 'ยืนยันและสรุปผลรางวัล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
