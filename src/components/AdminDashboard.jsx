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
  Table,
  Edit3,
  Save,
  Search,
  Check,
  Filter,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import AddContestantModal from './AddContestantModal';

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
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'qualified'
  const [showAddContestantModal, setShowAddContestantModal] = useState(false);

  // Admin Direct Score Edit State
  const [editingScore, setEditingScore] = useState(null);
  // editingScore: { contestant, judgeId, scores: {}, comment: '', saving: false, successMsg: '' }

  // Qualify & Award Modals
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [selectedQualifyIds, setSelectedQualifyIds] = useState([]);
  const [qualifyCandidates, setQualifyCandidates] = useState([]);
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

  const contestants = summaryData?.contestants || [];
  const judges = (summaryData?.judges || []).slice(0, 3);
  const isWomen = category === 'WOMEN';

  // Helper to open Edit Score Modal
  const handleOpenEditScore = (contestant, targetJudgeId = 1) => {
    const jId = Number(targetJudgeId);
    const existing = contestant.judge_scores?.[jId]?.details;

    let initialScores = {};
    if (round === 1) {
      initialScores = {
        c_dress_accuracy: existing?.c_dress_accuracy ?? (isWomen ? 12 : 16),
        c_hair: existing?.c_hair ?? (isWomen ? 8 : 4),
        c_shoes: existing?.c_shoes ?? 4,
        c_walk: existing?.c_walk ?? 4,
        c_stand: existing?.c_stand ?? 4,
        c_elegance: existing?.c_elegance ?? 12,
        c_voice: existing?.c_voice ?? 4,
        c_face_symmetry: existing?.c_face_symmetry ?? 24,
        c_wai: existing?.c_wai ?? 8
      };
    } else {
      initialScores = {
        c_r2_walk: existing?.c_r2_walk ?? 8,
        c_r2_stand: existing?.c_r2_stand ?? 8,
        c_r2_wai: existing?.c_r2_wai ?? 8,
        c_r2_situation: existing?.c_r2_situation ?? 16,
        c_r2_knowledge: existing?.c_r2_knowledge ?? 25,
        c_r2_relevance: existing?.c_r2_relevance ?? 16
      };
    }

    setEditingScore({
      contestant,
      judgeId: jId,
      scores: initialScores,
      comment: existing?.comment || '',
      saving: false,
      successMsg: ''
    });
  };

  // Switch Judge inside Edit Modal
  const handleSwitchJudgeInEdit = (targetJudgeId) => {
    if (!editingScore) return;
    const jId = Number(targetJudgeId);
    const existing = editingScore.contestant.judge_scores?.[jId]?.details;

    let initialScores = {};
    if (round === 1) {
      initialScores = {
        c_dress_accuracy: existing?.c_dress_accuracy ?? (isWomen ? 12 : 16),
        c_hair: existing?.c_hair ?? (isWomen ? 8 : 4),
        c_shoes: existing?.c_shoes ?? 4,
        c_walk: existing?.c_walk ?? 4,
        c_stand: existing?.c_stand ?? 4,
        c_elegance: existing?.c_elegance ?? 12,
        c_voice: existing?.c_voice ?? 4,
        c_face_symmetry: existing?.c_face_symmetry ?? 24,
        c_wai: existing?.c_wai ?? 8
      };
    } else {
      initialScores = {
        c_r2_walk: existing?.c_r2_walk ?? 8,
        c_r2_stand: existing?.c_r2_stand ?? 8,
        c_r2_wai: existing?.c_r2_wai ?? 8,
        c_r2_situation: existing?.c_r2_situation ?? 16,
        c_r2_knowledge: existing?.c_r2_knowledge ?? 25,
        c_r2_relevance: existing?.c_r2_relevance ?? 16
      };
    }

    setEditingScore({
      ...editingScore,
      judgeId: jId,
      scores: initialScores,
      comment: existing?.comment || '',
      successMsg: ''
    });
  };

  // Update criterion value
  const handleScoreFieldChange = (key, val, maxVal) => {
    if (!editingScore) return;
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxVal) num = maxVal;
    num = Math.round(num * 10) / 10;

    setEditingScore({
      ...editingScore,
      scores: {
        ...editingScore.scores,
        [key]: num
      },
      successMsg: ''
    });
  };

  // Save edited score
  const handleSaveScore = async () => {
    if (!editingScore) return;
    setEditingScore(prev => ({ ...prev, saving: true, successMsg: '' }));

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judge_id: editingScore.judgeId,
          contestant_id: editingScore.contestant.id,
          round,
          scores: editingScore.scores,
          comment: editingScore.comment
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingScore(prev => ({ 
          ...prev, 
          saving: false, 
          successMsg: `บันทึกคะแนนของกรรมการท่านที่ ${editingScore.judgeId} สำเร็จ (รวม: ${data.total} คะแนน)` 
        }));

        // Refresh live summary data
        await fetchSummary();
        if (onDataChanged) onDataChanged();

        // Update contestant inside editing modal so subsequent tabs have fresh state
        setTimeout(() => {
          setEditingScore(prev => {
            if (!prev) return null;
            return { ...prev, successMsg: '' };
          });
        }, 3000);
      } else {
        alert(data.error || 'บันทึกคะแนนไม่สำเร็จ');
        setEditingScore(prev => ({ ...prev, saving: false }));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setEditingScore(prev => ({ ...prev, saving: false }));
    }
  };

  // Calculate current edit total
  const calculateEditTotal = () => {
    if (!editingScore || !editingScore.scores) return 0;
    const vals = Object.values(editingScore.scores);
    const sum = vals.reduce((a, b) => a + (parseFloat(b) || 0), 0);
    return Math.round(sum * 100) / 100;
  };

  const handleOpenQualifyModal = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/summary?category=${category}&round=1`);
      const data = await res.json();
      if (data && data.contestants) {
        setQualifyCandidates(data.contestants);
        const qualified = data.contestants.filter(c => c.round1_qualified === 1).map(c => c.id);
        if (qualified.length > 0) {
          setSelectedQualifyIds(qualified);
        } else {
          setSelectedQualifyIds(data.contestants.slice(0, 6).map(c => c.id));
        }
      }
      setShowQualifyModal(true);
    } catch (err) {
      console.error('Failed to load qualify modal candidates:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoQualifyTop6 = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/qualify-round-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      const result = await res.json();
      if (result.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        await fetchSummary();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดึงผู้เข้ารอบ');
    } finally {
      setActionLoading(false);
    }
  };

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
        // Automatically switch view to Round 2
        setRound(2);
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'active_round', value: 2 })
        }).catch(console.error);
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

  // Filter contestants by search & filter mode
  const filteredContestants = contestants.filter(c => {
    if (filterMode === 'qualified' && round === 1 && c.round1_qualified !== 1) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${c.prefix || ''}${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const num = String(c.number);
    const school = (c.school || '').toLowerCase();
    return fullName.includes(term) || num.includes(term) || school.includes(term);
  });

  if (loading && !summaryData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
          <Crown className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
        </div>
        <p className="text-sm font-semibold text-slate-300">กำลังประมวลผลคะแนนเฉลี่ย ๓ ท่าน...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= Top Banner & Control Console ================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 tracking-wider">
                ADMIN CONSOLE
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {category === 'WOMEN' ? 'การประกวดนางนพมาศ' : 'การประกวดเทพบุตร'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ระบบคิดคะแนนเฉลี่ย ๓ ท่าน
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-amber-400 drop-shadow" />
              <span>
                {round === 1
                  ? 'ตารางสรุปคะแนน รอบที่ ๑ (คัดเหลือ ๖ คน เพื่อไปตอบคำถาม)'
                  : round === 2
                    ? 'ตารางสรุปคะแนน รอบที่ ๒ (ตอบคำถาม - คัดคะแนนดีที่สุด ๓ คน เข้ารอบเสี่ยงทาย)'
                    : 'รอบที่ ๓: รอบเสี่ยงทาย & ประกาศผลรางวัลชนะเลิศ (๓ คนสุดท้าย)'}
              </span>
            </h2>

            <p className="text-xs text-amber-200/80 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {round === 1
                  ? 'ผู้เข้าประกวด ๖ อันดับแรกที่มีคะแนนเฉลี่ยสูงสุด จะผ่านเข้าสู่ "รอบตอบคำถาม" อัตโนมัติ (ไม่ต้องรอแอดมินยืนยัน)'
                  : round === 2
                    ? 'เมื่อกรรมการลงคะแนนตอบคำถามเสร็จ ระบบจะนำผู้ที่ได้คะแนนดีที่สุด ๓ คน เข้ารอบเสี่ยงทายอัตโนมัติ'
                    : 'ผู้ผ่านเข้ารอบเสี่ยงทาย ๓ คนสุดท้ายทำการเสี่ยงทายบนเวที เพื่อตัดสินรางวัลชนะเลิศ, รองอันดับ ๑, และรองอันดับ ๒'}
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {round === 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRound(2);
                    fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'active_round', value: 2 })
                    }).catch(console.error);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>ไปรอบตอบคำถาม (รอบ ๒)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleOpenQualifyModal}
                  disabled={actionLoading}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="ปรับเปลี่ยนรายชื่อ ๖ คนที่ผ่านเข้ารอบด้วยตนเอง (กรณีมีคะแนนเท่ากัน)"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>ปรับเปลี่ยน ๖ คน</span>
                </button>
              </div>
            )}

            {round === 2 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRound(3);
                    fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'active_round', value: 3 })
                    }).catch(console.error);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>🔮</span>
                  <span>ไปรอบเสี่ยงทาย (๓ คน)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAwardModal(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Trophy className="w-4 h-4" />
                  <span>สรุปรางวัล</span>
                </button>
                <button
                  onClick={handleOpenQualifyModal}
                  disabled={actionLoading}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="ปรับเปลี่ยนผู้เข้ารอบ ๖ คน"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>ปรับ ๖ คน</span>
                </button>
              </div>
            )}

            {round === 3 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAwardModal(true)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Trophy className="w-4 h-4" />
                  <span>บันทึกผลการเสี่ยงทาย & มอบรางวัล</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowAddContestantModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              title="เพิ่มผู้เข้าประกวดใหม่เข้าสู่ระบบ"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มผู้เข้าประกวด</span>
            </button>

            <button
              onClick={handleSeedDemo}
              disabled={actionLoading}
              title="สุ่มกรอกคะแนนสมจริงของกรรมการ ๓ ท่านเพื่อทดสอบระบบ"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{round === 3 ? 'จำลองผลเสี่ยงทาย' : 'จำลองคะแนน (๓ ท่าน)'}</span>
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
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shadow-sm"
              title="รีเฟรชคะแนนล่าสุด"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/90">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-medium text-slate-400">ผู้เข้าประกวดทั้งหมด</div>
            <div className="text-xl font-black text-white mt-0.5">{contestants.length} คน</div>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-medium text-slate-400">กรรมการตัดสิน</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">๓ ท่าน</div>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-medium text-slate-400">
              {round === 1
                ? 'อันดับ ๑ รอบแรก'
                : round === 2
                  ? 'อันดับ ๑ รอบตอบคำถาม'
                  : 'คะแนนเสี่ยงทาย / ผู้ชนะ'}
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-1 truncate">
              {contestants[0] ? `#${contestants[0].number} ${contestants[0].first_name} (${contestants[0].average_score} คะแนน)` : '-'}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-medium text-slate-400">
              {round === 1
                ? 'ผ่านเข้ารอบตอบคำถาม'
                : round === 2
                  ? 'ผ่านเข้ารอบเสี่ยงทาย'
                  : 'ผู้ชนะเลิศอันดับ ๑'}
            </div>
            <div className="text-sm font-bold text-amber-300 mt-1 truncate">
              {round === 1
                ? `${contestants.filter(c => c.round1_qualified === 1).length} / 6 คน`
                : round === 2
                  ? `${summaryData?.top3_prophecy?.length || 0} / 3 คน`
                  : contestants.find(c => c.round2_rank === 1)
                    ? `#${contestants.find(c => c.round2_rank === 1).number} ${contestants.find(c => c.round2_rank === 1).first_name}`
                    : 'ยังไม่ได้ระบุ'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= Filter & View Mode Controls ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตามชื่อ, หมายเลข หรือคณะ/สาขา..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {round === 1 && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterMode === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({contestants.length})
              </button>
              <button
                onClick={() => setFilterMode('qualified')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterMode === 'qualified' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                เฉพาะผู้เข้ารอบ ({contestants.filter(c => c.round1_qualified === 1).length})
              </button>
            </div>
          )}

          {/* Toggle View Mode */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('judges')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'judges' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>คะแนนรายกรรมการ (ก.๑, ก.๒, ก.๓)</span>
            </button>
            <button
              onClick={() => setViewMode('criteria')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'criteria' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>เกณฑ์เฉลี่ยแต่ละช่อง (หาร ๓)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Round 2 Empty State Banner */}
      {round === 2 && contestants.length === 0 && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">กำลังรอผลคะแนนรอบที่ ๑</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              ระบบจะดึง ๖ อันดับแรกที่มีคะแนนสูงสุดจากรอบที่ ๑ เข้าสู่รอบตอบคำถามให้อัตโนมัติทันทีที่มีการลงคะแนน
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleAutoQualifyTop6}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>ดึง ๖ อันดับแรกจากคะแนนรอบที่ ๑ ทันที</span>
            </button>
            <button
              onClick={handleOpenQualifyModal}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-colors"
            >
              เลือกรายชื่อผู้เข้ารอบด้วยตนเอง
            </button>
          </div>
        </div>
      )}

      {/* ================= TOP 3 FINALISTS FOR PROPHECY (ROUND 2 SHOWCASE) ================= */}
      {round === 2 && summaryData?.top3_prophecy?.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950/85 via-slate-900 to-amber-950/85 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-purple-500/30">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-bounce">🔮</span>
                <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-amber-200 to-white">
                  ผลคะแนนตอบคำถาม: ๓ คนสุดท้าย ผ่านเข้าสู่ "รอบเสี่ยงทาย"
                </h3>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                * ระบบคัดเลือกผู้ที่ได้คะแนนตอบคำถามดีที่สุด ๓ อันดับแรกให้อัตโนมัติ เพื่อขึ้นเวทีทำการเสี่ยงทายชิงตำแหน่งชนะเลิศ
              </p>
            </div>

            <button
              onClick={() => {
                setRound(3);
                fetch('/api/settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: 'active_round', value: 3 })
                }).catch(console.error);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-amber-500 to-amber-600 hover:from-purple-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 flex-shrink-0"
            >
              <span>🔮</span>
              <span>เปิดเวทีรอบเสี่ยงทาย (๓ คนสุดท้าย)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Finalists Podium Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {summaryData.top3_prophecy.map((c, idx) => (
              <div
                key={c.id}
                className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg backdrop-blur-sm relative overflow-hidden"
              >
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border-2 border-purple-400/60 shadow">
                  <img
                    src={c.image_url || '/images/placeholder.svg'}
                    alt={c.first_name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                    }`}>
                      อันดับ {idx + 1}
                    </span>
                    <span className="text-[10px] text-purple-200 font-bold bg-purple-500/30 px-2 py-0.5 rounded-full border border-purple-400/40">
                      ผ่านเข้ารอบเสี่ยงทาย
                    </span>
                  </div>
                  <div className="font-bold text-white text-sm mt-1 truncate">
                    #{c.number} {c.prefix}{c.first_name} {c.last_name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{c.school}</div>
                  <div className="text-xs font-black text-amber-300 mt-1">
                    คะแนนตอบคำถาม: {c.average_score} คะแนน
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= STAGE 3: PROPHECY CEREMONY & WINNERS PODIUM ================= */}
      {round === 3 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <span>🔮</span> รอบเสี่ยงทายบนเวที & สรุปรางวัลชนะเลิศ
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ผู้ผ่านเข้ารอบเสี่ยงทาย ๓ คนสุดท้าย
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/80">
                ผู้เข้าประกวดทั้ง ๓ ท่านที่มีคะแนนตอบคำถามดีที่สุด ขึ้นเวทีทำการเสี่ยงทาย เพื่อจัดอันดับผู้ชนะเลิศ, รองอันดับ ๑ และรองอันดับ ๒
              </p>
            </div>

            {/* 3 Finalists on Stage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {(summaryData?.contestants || []).slice(0, 3).map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-slate-950/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-3xl p-5 text-center shadow-xl flex flex-col items-center justify-between space-y-4 group transition-all"
                >
                  <div className="relative w-36 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg">
                    <img
                      src={c.image_url || '/images/placeholder.svg'}
                      alt={c.first_name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-base px-2.5 py-0.5 rounded-lg shadow">
                      #{String(c.number).padStart(2, '0')}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      🔮 ผู้ผ่านเข้ารอบเสี่ยงทาย
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">
                      {c.prefix}{c.first_name} {c.last_name}
                    </h3>
                    <p className="text-xs text-amber-300/80 truncate mt-0.5">{c.school}</p>
                    <div className="mt-2 text-xs font-semibold text-slate-400">
                      คะแนนตอบคำถาม: <b className="text-amber-400">{c.average_score}</b> คะแนน
                    </div>
                  </div>

                  {/* Award Status Badge if assigned */}
                  {c.round2_rank === 1 && (
                    <div className="w-full py-2 px-3 bg-amber-500/20 border border-amber-400 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>👑 รางวัลชนะเลิศ</span>
                    </div>
                  )}
                  {c.round2_rank === 2 && (
                    <div className="w-full py-2 px-3 bg-slate-400/20 border border-slate-300 rounded-xl text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Medal className="w-4 h-4 text-slate-300" />
                      <span>🥈 รางวัลรองอันดับ ๑</span>
                    </div>
                  )}
                  {c.round2_rank === 3 && (
                    <div className="w-full py-2 px-3 bg-amber-800/20 border border-amber-700 rounded-xl text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Medal className="w-4 h-4 text-amber-600" />
                      <span>🥉 รางวัลรองอันดับ ๒</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Button to record awards */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowAwardModal(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Trophy className="w-5 h-5" />
                <span>บันทึกผลการเสี่ยงทาย & ประกาศผลรางวัล</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Main Table: Scores Matrix & Controls ================= */}
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${round === 3 ? 'hidden' : ''}`}>
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              ตารางสรุปคะแนนกรรมการ ๓ ท่าน & จัดอันดับ
            </h3>
          </div>
          <span className="text-xs text-amber-300/80 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
            💡 คลิกปุ่ม <b className="text-amber-400">"แก้ไขคะแนน"</b> หรือคลิกที่ <b className="text-amber-400">ช่องคะแนน</b> เพื่อแก้ไข
          </span>
        </div>

        {/* MODE 1: JUDGES VIEW */}
        {viewMode === 'judges' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/95 text-slate-300 border-b border-slate-800 text-xs">
                  <th className="py-3.5 px-3 font-semibold text-center w-12">อันดับ</th>
                  <th className="py-3.5 px-3 font-semibold text-center w-16">หมายเลข</th>
                  <th className="py-3.5 px-3 font-semibold">ผู้เข้าประกวด</th>
                  <th className="py-3.5 px-3 font-semibold hidden md:table-cell">สถานศึกษา / สังกัด</th>
                  {judges.map((j) => (
                    <th key={j.id} className="py-3.5 px-2 font-semibold text-center w-28">
                      <div className="text-xs text-amber-300 font-bold truncate">
                        {j.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">กรรมการ {j.id}</div>
                    </th>
                  ))}
                  <th className="py-3.5 px-3 font-bold text-amber-400 text-center bg-slate-900/60 w-28">
                    รวม (๓ ท่าน)
                  </th>
                  <th className="py-3.5 px-3 font-bold text-emerald-400 text-center bg-slate-900/60 w-28">
                    เฉลี่ย (หาร ๓)
                  </th>
                  <th className="py-3.5 px-3 font-semibold text-center">จัดการคะแนน</th>
                  <th className="py-3.5 px-3 font-semibold text-center">สถานะ / รางวัล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredContestants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                      ไม่พบข้อมูลผู้เข้าประกวดที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredContestants.map((c, index) => {
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
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20">
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
                          <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 shadow-inner">
                            #{String(c.number).padStart(2, '0')}
                          </span>
                        </td>

                        {/* Photo & Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={c.image_url || '/images/placeholder.svg'}
                              alt=""
                              className="w-11 h-11 rounded-xl object-cover object-top border border-slate-700 shadow"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/placeholder.svg';
                              }}
                            />
                            <div>
                              <div className="font-bold text-white text-sm">
                                {c.prefix}{c.first_name} {c.last_name}
                              </div>
                              <div className="text-[11px] text-slate-400 md:hidden truncate max-w-[140px]">
                                {c.school}
                              </div>
                              {round === 1 && isQualified && (
                                <span className="inline-block mt-0.5 text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                  🌸 ผ่านเข้ารอบตอบคำถาม
                                </span>
                              )}
                              {round === 2 && c.is_top3_prophecy && (
                                <span className="inline-block mt-0.5 text-[10px] text-purple-200 font-bold bg-purple-500/30 px-2 py-0.5 rounded border border-purple-400/50 shadow-sm animate-pulse">
                                  🔮 ผ่านเข้ารอบเสี่ยงทาย (๓ คนสุดท้าย)
                                </span>
                              )}
                              {round === 2 && !c.is_top3_prophecy && c.average_score > 0 && (
                                <span className="inline-block mt-0.5 text-[10px] text-slate-400 font-medium bg-slate-800/60 px-1.5 py-0.5 rounded">
                                  อันดับ {c.rank} (ไม่ผ่านเข้ารอบเสี่ยงทาย)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* School */}
                        <td className="py-3 px-3 text-xs text-slate-300 max-w-[170px] truncate hidden md:table-cell">
                          {c.school}
                        </td>

                        {/* 3 Judges Columns (Click to View / Edit) */}
                        {judges.map((j) => {
                          const scoreData = c.judge_scores?.[j.id];
                          return (
                            <td key={j.id} className="py-3 px-2 text-center">
                              {scoreData ? (
                                <button
                                  onClick={() => handleOpenEditScore(c, j.id)}
                                  className="group px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500 text-slate-200 hover:text-slate-950 text-xs font-bold border border-slate-700/60 hover:border-amber-400 transition-all shadow-sm flex items-center justify-center gap-1 mx-auto"
                                  title={`คลิกเพื่อแก้ไขคะแนนของ ${j.name}`}
                                >
                                  <span>{scoreData.total}</span>
                                  <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenEditScore(c, j.id)}
                                  className="text-slate-500 hover:text-amber-400 text-xs underline decoration-dotted transition-colors"
                                  title="ยังไม่มีคะแนน คลิกเพื่อใส่คะแนน"
                                >
                                  รอลงคะแนน
                                </button>
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

                        {/* Direct Edit Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleOpenEditScore(c, 1)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold flex items-center gap-1 mx-auto transition-all shadow-sm"
                            title="แก้ไขคะแนนผู้เข้าประกวดท่านนี้"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไขคะแนน</span>
                          </button>
                        </td>

                        {/* Badges / Awards */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {rank1 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-400 text-slate-950 border border-amber-300 flex items-center gap-1 shadow">
                                👑 ชนะเลิศ
                              </span>
                            )}
                            {rank2 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-300 text-slate-950 border border-slate-200">
                                🥈 รองอันดับ ๑
                              </span>
                            )}
                            {rank3 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-700 text-white border border-amber-600">
                                🥉 รองอันดับ ๒
                              </span>
                            )}
                            {c.award_costume === 1 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                แต่งกายงาม
                              </span>
                            )}
                            {c.award_popular === 1 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                ขวัญใจ มทร.กรุงเทพ
                              </span>
                            )}
                            {round === 2 && c.is_top3_prophecy && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-purple-200 border border-purple-400/40 shadow-sm flex items-center gap-1">
                                <span>🔮</span>
                                <span>เข้ารอบเสี่ยงทาย</span>
                              </span>
                            )}
                            {round === 1 && !isQualified && isTop6 && (
                              <span className="px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700 rounded-lg">
                                Top 6
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: CRITERIA BREAKDOWN VIEW (EACH CHANNEL AVERAGED BY 3) */}
        {viewMode === 'criteria' && (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/95 text-slate-300 border-b border-slate-800">
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
                  <th className="py-3 px-2">แก้ไข</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredContestants.map((c) => {
                  const ca = c.criteria_averages || {};
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 font-semibold text-slate-300">{c.rank}</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-amber-400">#{c.number}</td>
                      <td className="py-2.5 px-3 text-left font-bold text-white truncate max-w-[150px]">
                        {c.prefix}{c.first_name} {c.last_name}
                      </td>
                      {round === 1 ? (
                        <>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_dress_accuracy ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_hair ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_shoes ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_walk ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_stand ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_elegance ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_voice ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_face_symmetry ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_wai ?? '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_r2_walk ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_r2_stand ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_r2_wai ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_r2_situation ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_r2_knowledge ?? '-'}</td>
                          <td className="py-2.5 px-2 font-semibold">{ca.c_r2_relevance ?? '-'}</td>
                        </>
                      )}
                      <td className="py-2.5 px-3 font-black text-emerald-400 bg-slate-950/60 text-sm">
                        {c.average_score}
                      </td>
                      <td className="py-2.5 px-2">
                        <button
                          onClick={() => handleOpenEditScore(c, 1)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 transition-colors"
                          title="แก้ไขคะแนน"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADMIN DIRECT SCORE EDITOR ================= */}
      {editingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <img
                  src={editingScore.contestant.image_url || '/images/placeholder.svg'}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover object-top border-2 border-amber-400/50 shadow"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.svg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                      #{String(editingScore.contestant.number).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-amber-300/80">
                      {category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'} รอบที่ {round}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {editingScore.contestant.prefix}{editingScore.contestant.first_name} {editingScore.contestant.last_name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                    {editingScore.contestant.school}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingScore(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message Banner */}
            {editingScore.successMsg && (
              <div className="mt-3 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{editingScore.successMsg}</span>
              </div>
            )}

            {/* Select Judge Tabs */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                เลือกกรรมการที่ต้องการแก้ไขคะแนน:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => {
                  const isSelected = editingScore.judgeId === num;
                  const currentScore = editingScore.contestant.judge_scores?.[num]?.total;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSwitchJudgeInEdit(num)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border-amber-400 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px]">กรรมการท่านที่ {num === 1 ? '๑' : num === 2 ? '๒' : '๓'}</div>
                      <div className="text-sm font-black text-amber-400 mt-0.5">
                        {currentScore ? `${currentScore} คะแนน` : 'ยังไม่มีคะแนน'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Total Score Display */}
            <div className="mt-4 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">คะแนนรวมของกรรมการท่านที่ {editingScore.judgeId}:</span>
                <div className="text-xs text-slate-500">* คำนวณจากเกณฑ์ย่อยทั้งหมดอัตโนมัติ</div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">
                  {calculateEditTotal()}
                </span>
                <span className="text-xs text-slate-400 font-semibold ml-1">/ 100</span>
              </div>
            </div>

            {/* Criteria Sliders / Inputs */}
            <div className="mt-4 max-h-[46vh] overflow-y-auto space-y-4 pr-1">
              {round === 1 ? (
                <>
                  {/* Category 1 */}
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-amber-300">
                      หมวดที่ ๑: การแต่งกาย ({isWomen ? '๓๐' : '๓๐'} คะแนน)
                    </div>

                    {/* Dress Accuracy */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">ความถูกต้องของชุด ({isWomen ? '๑๕' : '๒๐'} คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_dress_accuracy ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={isWomen ? 15 : 20}
                          step="0.5"
                          value={editingScore.scores.c_dress_accuracy ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_dress_accuracy', e.target.value, isWomen ? 15 : 20)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max={isWomen ? 15 : 20}
                          step="0.5"
                          value={editingScore.scores.c_dress_accuracy ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_dress_accuracy', e.target.value, isWomen ? 15 : 20)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Hair */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">ทรงผม ({isWomen ? '๑๐' : '๕'} คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_hair ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={isWomen ? 10 : 5}
                          step="0.5"
                          value={editingScore.scores.c_hair ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_hair', e.target.value, isWomen ? 10 : 5)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max={isWomen ? 10 : 5}
                          step="0.5"
                          value={editingScore.scores.c_hair ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_hair', e.target.value, isWomen ? 10 : 5)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Shoes */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">รองเท้า (๕ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_shoes ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_shoes ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_shoes', e.target.value, 5)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_shoes ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_shoes', e.target.value, 5)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-amber-300">
                      หมวดที่ ๒: บุคลิกภาพ ({isWomen ? '๓๐' : '๓๐'} คะแนน)
                    </div>

                    {/* Walk */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การเดิน (๕ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_walk ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_walk ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_walk', e.target.value, 5)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_walk ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_walk', e.target.value, 5)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Stand */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การยืน (๕ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_stand ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_stand ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_stand', e.target.value, 5)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_stand ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_stand', e.target.value, 5)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Elegance */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">ความสง่างาม (๑๕ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_elegance ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="15"
                          step="0.5"
                          value={editingScore.scores.c_elegance ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_elegance', e.target.value, 15)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="0.5"
                          value={editingScore.scores.c_elegance ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_elegance', e.target.value, 15)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Voice */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">น้ำเสียง (๕ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_voice ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_voice ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_voice', e.target.value, 5)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editingScore.scores.c_voice ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_voice', e.target.value, 5)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-amber-300">
                      หมวดที่ ๓: ความงามของใบหน้า / กิริยามารยาท (๔๐ คะแนน)
                    </div>

                    {/* Face Symmetry */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">ใบหน้าสมส่วน (๓๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_face_symmetry ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="0.5"
                          value={editingScore.scores.c_face_symmetry ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_face_symmetry', e.target.value, 30)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={editingScore.scores.c_face_symmetry ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_face_symmetry', e.target.value, 30)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Wai */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การไหว้ (๑๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_wai ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_wai ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_wai', e.target.value, 10)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_wai ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_wai', e.target.value, 10)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Round 2 Criteria */}
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-amber-300">
                      หมวดที่ ๑: รูปร่าง / บุคลิกภาพ (๓๐ คะแนน)
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การเดิน (๑๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_r2_walk ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_r2_walk ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_walk', e.target.value, 10)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_r2_walk ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_walk', e.target.value, 10)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การยืน (๑๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_r2_stand ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_r2_stand ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_stand', e.target.value, 10)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_r2_stand ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_stand', e.target.value, 10)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การไหว้ (๑๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_r2_wai ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_r2_wai ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_wai', e.target.value, 10)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={editingScore.scores.c_r2_wai ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_wai', e.target.value, 10)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Round 2 Q&A */}
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-amber-300">
                      หมวดที่ ๒: ไหวพริบ & การตอบคำถาม (๗๐ คะแนน)
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">การเชื่อมโยงกับสถานการณ์ (๒๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_r2_situation ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={editingScore.scores.c_r2_situation ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_situation', e.target.value, 20)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={editingScore.scores.c_r2_situation ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_situation', e.target.value, 20)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">มีความรู้ (๓๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_r2_knowledge ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="0.5"
                          value={editingScore.scores.c_r2_knowledge ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_knowledge', e.target.value, 30)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={editingScore.scores.c_r2_knowledge ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_knowledge', e.target.value, 30)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">ตอบตรงประเด็น (๒๐ คะแนน)</span>
                        <span className="font-bold text-amber-400">{editingScore.scores.c_r2_relevance ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={editingScore.scores.c_r2_relevance ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_relevance', e.target.value, 20)}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={editingScore.scores.c_r2_relevance ?? 0}
                          onChange={(e) => handleScoreFieldChange('c_r2_relevance', e.target.value, 20)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Comment Field */}
              <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ความเห็น / บันทึกเพิ่มเติมของกรรมการท่านนี้:
                </label>
                <textarea
                  rows={2}
                  value={editingScore.comment}
                  onChange={(e) => setEditingScore({ ...editingScore, comment: e.target.value })}
                  placeholder="ระบุข้อเสนอแนะหรือบันทึกของกรรมการ (ถ้ามี)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingScore(null)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                ปิดหน้าต่าง
              </button>

              <button
                type="button"
                disabled={editingScore.saving}
                onClick={handleSaveScore}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>{editingScore.saving ? 'กำลังบันทึกคะแนน...' : `บันทึกคะแนน (กรรมการ ${editingScore.judgeId})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                ปิดหน้าต่าง
              </button>

              <button
                onClick={() => {
                  const contestant = selectedScoreDetail.contestant;
                  const judgeId = selectedScoreDetail.judge.id;
                  setSelectedScoreDetail(null);
                  handleOpenEditScore(contestant, judgeId);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขคะแนนชุดนี้</span>
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
              {(qualifyCandidates.length > 0 ? qualifyCandidates : contestants).map((c) => {
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
                  <span>บันทึกผลการเสี่ยงทาย & ประกาศผลรางวัล</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {category === 'WOMEN' ? 'การประกวดนางนพมาศ' : 'การประกวดเทพบุตร'} ประจำปี ๒๕๖๙ (ตัดสินจาก ๓ คนสุดท้ายในรอบเสี่ยงทาย)
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
                  👑 รางวัลชนะเลิศ ({category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'}) - จาก ๓ คนสุดท้ายในรอบเสี่ยงทาย
                </label>
                <select
                  value={awardsForm.winner_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, winner_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {(summaryData?.top3_prophecy?.length > 0 ? summaryData.top3_prophecy : contestants).map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name} {c.average_score ? `(คะแนนตอบคำถาม: ${c.average_score})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <label className="block font-bold text-slate-200 mb-1">
                  🥈 รางวัลรองชนะเลิศ อันดับ ๑ - จาก ๓ คนสุดท้ายในรอบเสี่ยงทาย
                </label>
                <select
                  value={awardsForm.runner_up_1_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, runner_up_1_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {(summaryData?.top3_prophecy?.length > 0 ? summaryData.top3_prophecy : contestants).map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name} {c.average_score ? `(คะแนนตอบคำถาม: ${c.average_score})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <label className="block font-bold text-slate-200 mb-1">
                  🥉 รางวัลรองชนะเลิศ อันดับ ๒ - จาก ๓ คนสุดท้ายในรอบเสี่ยงทาย
                </label>
                <select
                  value={awardsForm.runner_up_2_id}
                  onChange={(e) => setAwardsForm({ ...awardsForm, runner_up_2_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">-- เลือกลำดับ --</option>
                  {(summaryData?.top3_prophecy?.length > 0 ? summaryData.top3_prophecy : contestants).map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.prefix}{c.first_name} {c.last_name} {c.average_score ? `(คะแนนตอบคำถาม: ${c.average_score})` : ''}
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

      {/* ================= ADD CONTESTANT MODAL ================= */}
      <AddContestantModal
        isOpen={showAddContestantModal}
        onClose={() => setShowAddContestantModal(false)}
        defaultCategory={category}
        onSuccess={async () => {
          await fetchSummary();
          if (onDataChanged) onDataChanged();
        }}
      />
    </div>
  );
}