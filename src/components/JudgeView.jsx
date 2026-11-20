import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Save, 
  Sparkles, 
  Sliders, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getCriteria, calculateTotalScore } from '../utils/criteria';

export default function JudgeView({
  currentUser,
  category,
  round,
  judge,
  setJudge,
  judges = [],
  onScoreUpdated
}) {
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeContestant, setActiveContestant] = useState(null);
  const [scores, setScores] = useState({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // Fetch contestants whenever category, round, or judge changes
  const fetchContestants = async () => {
    if (!judge) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contestants?category=${category}&round=${round}&judge_id=${judge.id}`);
      const data = await res.json();
      setContestants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load contestants:', err);
      setContestants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestants();
  }, [category, round, judge?.id]);

  // Open scoring modal for a specific contestant
  const handleOpenScore = async (c) => {
    setActiveContestant(c);
    setScores({});
    setComment('');

    // Fetch existing score if any
    try {
      const res = await fetch(`/api/scores?judge_id=${judge.id}&contestant_id=${c.id}&round=${round}`);
      const existing = await res.json();
      if (existing) {
        setScores({
          c_dress_accuracy: existing.c_dress_accuracy ?? 0,
          c_hair: existing.c_hair ?? 0,
          c_shoes: existing.c_shoes ?? 0,
          c_walk: existing.c_walk ?? 0,
          c_stand: existing.c_stand ?? 0,
          c_elegance: existing.c_elegance ?? 0,
          c_voice: existing.c_voice ?? 0,
          c_face_symmetry: existing.c_face_symmetry ?? 0,
          c_wai: existing.c_wai ?? 0,
          c_r2_walk: existing.c_r2_walk ?? 0,
          c_r2_stand: existing.c_r2_stand ?? 0,
          c_r2_wai: existing.c_r2_wai ?? 0,
          c_r2_situation: existing.c_r2_situation ?? 0,
          c_r2_knowledge: existing.c_r2_knowledge ?? 0,
          c_r2_relevance: existing.c_r2_relevance ?? 0,
        });
        setComment(existing.comment || '');
      } else {
        // Default initialized based on criteria items
        const criteriaGroups = getCriteria(round, category);
        const init = {};
        for (const g of criteriaGroups) {
          for (const item of g.items) {
            init[item.key] = Math.round(item.max * 0.8);
          }
        }
        setScores(init);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreChange = (key, value, max) => {
    let num = Number(value);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > max) num = max;
    setScores(prev => ({ ...prev, [key]: num }));
  };

  const criteriaGroups = getCriteria(round, category);
  const currentTotal = calculateTotalScore(criteriaGroups, scores);

  const handleSaveScore = async (andNext = false) => {
    if (!activeContestant || !judge) return;
    setSaving(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judge_id: judge.id,
          contestant_id: activeContestant.id,
          round: Number(round),
          scores,
          comment
        })
      });
      const result = await res.json();
      if (result.success) {
        setToastMessage(`บันทึกคะแนนหมายเลข ${activeContestant.number} เรียบร้อยแล้ว (${result.total_score} คะแนน)`);
        setTimeout(() => setToastMessage(''), 3000);
        
        await fetchContestants();
        if (onScoreUpdated) onScoreUpdated();

        if (andNext) {
          const currentIndex = contestants.findIndex(c => c.id === activeContestant.id);
          if (currentIndex !== -1 && currentIndex + 1 < contestants.length) {
            handleOpenScore(contestants[currentIndex + 1]);
          } else {
            setActiveContestant(null);
          }
        } else {
          setActiveContestant(null);
        }
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('บันทึกล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  // Completion stats
  const scoredCount = contestants.filter(c => c.has_scored).length;
  const totalCount = contestants.length;
  const progressPercent = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-emerald-200" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Judge Selector Top Bar */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-amber-200 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>กรรมการตัดสิน (๓ ท่าน)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin ? 'ในฐานะแอดมิน คุณสามารถสลับเพื่อดูหรือช่วยเหลือการให้คะแนนของกรรมการแต่ละท่านได้' : `ท่านกำลังลงคะแนนในฐานะ: ${judge?.name}`}
            </p>
          </div>

          {/* Judges Switcher Buttons (Admin can switch, Judge is locked to their account) */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            {judges.slice(0, 3).map(j => {
              const isSelected = judge?.id === j.id;
              const disabled = !isAdmin && currentUser?.judge_id !== j.id;
              return (
                <button
                  key={j.id}
                  disabled={disabled}
                  onClick={() => setJudge(j)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 font-bold shadow-lg shadow-amber-500/20 scale-105'
                      : disabled
                      ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-400/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-semibold">{j.name}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    {round === 1 ? `รอบ ๑: ${j.scored_r1 || 0}/15` : `รอบ ๒: ${j.scored_r2 || 0}/6`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Info */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-sm">
              <span className="text-slate-400">สถานะการตัดสิน: </span>
              <span className="text-amber-300 font-semibold">{judge?.name}</span>
              <span className="text-slate-400 mx-2">|</span>
              <span className="text-slate-300">
                ลงคะแนนแล้ว <b className="text-amber-400">{scoredCount}</b> / {totalCount} คน
              </span>
            </div>
          </div>

          <div className="w-full sm:w-64 bg-slate-800 rounded-full h-3.5 p-0.5 border border-slate-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contestants Grid Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{category === 'WOMEN' ? '🌸 ผู้เข้าประกวดนางนพมาศ' : '👑 ผู้เข้าประกวดเทพบุตร'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {round === 1 ? 'รอบที่ ๑ (คัดเหลือ ๖ คน)' : 'รอบที่ ๒ (ตัดสินชิงชนะเลิศ)'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            * เกณฑ์คะแนนช่องต่างๆ จะนำผลรวมของกรรมการทั้ง ๓ ท่าน มารวมแล้วหาร ๓ เพื่อเป็นคะแนนตัดสินรอบชิงชนะเลิศ
          </p>
        </div>

        {round === 2 && contestants.length === 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>ยังไม่มีผู้ผ่านเข้ารอบ ๒ (รอแอดมินยืนยันผลการคัดเลือก ๖ คน)</span>
            </div>
            {isAdmin && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/qualify-round-1', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ category })
                    });
                    const data = await res.json();
                    if (data.success) {
                      await fetchContestants();
                      if (onScoreUpdated) onScoreUpdated();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ดึง ๖ คนแรกจากรอบ ๑ ทันที</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contestants Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {contestants.map(c => {
          const hasScored = c.has_scored;
          return (
            <div
              key={c.id}
              className={`group bg-slate-900/90 rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                hasScored
                  ? 'border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10'
              }`}
            >
              {/* Photo & Number Badge */}
              <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden">
                <img
                  src={c.image_url || '/images/placeholder.svg'}
                  alt={`${c.prefix} ${c.first_name} ${c.last_name}`}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.svg';
                  }}
                />

                {/* Number Badge */}
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-lg px-3 py-1 rounded-xl shadow-lg border border-amber-300">
                  #{String(c.number).padStart(2, '0')}
                </div>

                {/* Score Status Badge */}
                <div className="absolute top-3 right-3">
                  {hasScored ? (
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-400 flex items-center gap-1 shadow-md">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{c.total_score} / 100</span>
                    </span>
                  ) : (
                    <span className="bg-slate-900/80 backdrop-blur-md text-slate-400 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>รอลงคะแนน</span>
                    </span>
                  )}
                </div>

                {/* Dark gradient overlay at bottom of photo */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-base font-bold text-white leading-tight drop-shadow-md">
                    {c.prefix}{c.first_name} {c.last_name}
                  </h4>
                  <p className="text-xs text-amber-300/90 truncate mt-0.5 drop-shadow">
                    {c.school}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-3 bg-slate-900 border-t border-slate-800">
                <button
                  onClick={() => handleOpenScore(c)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    hasScored
                      ? 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{hasScored ? 'แก้ไขคะแนน' : 'เริ่มลงคะแนน'}</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= SCORING MODAL ================= */}
      {activeContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={activeContestant.image_url || '/images/placeholder.svg'}
                  alt=""
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.svg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md">
                      #{String(activeContestant.number).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-amber-300 font-medium">
                      {category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'} | รอบที่ {round === 1 ? '๑' : '๒'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {activeContestant.prefix}{activeContestant.first_name} {activeContestant.last_name}
                  </h3>
                  <p className="text-xs text-slate-400">{activeContestant.school}</p>
                </div>
              </div>

              {/* Total Score Real-time Display */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">คะแนนของท่าน</div>
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    {currentTotal}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveContestant(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - Criteria Sliders & Controls */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {criteriaGroups.map((group, groupIdx) => (
                <div 
                  key={groupIdx} 
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner"
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h4 className="text-base font-bold text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{group.category}</span>
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-amber-200 border border-slate-700">
                      คะแนนเต็มหมวดนี้ {group.maxTotal} คะแนน
                    </span>
                  </div>

                  <div className="space-y-5">
                    {group.items.map((item) => {
                      const val = scores[item.key] ?? 0;
                      return (
                        <div key={item.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-semibold text-slate-200">{item.name}</span>
                              <span className="text-xs text-slate-400 ml-2">({item.desc})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">คะแนนเต็ม {item.max}</span>
                              <div className="w-16">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.max}
                                  step={0.5}
                                  value={val}
                                  onChange={(e) => handleScoreChange(item.key, e.target.value, item.max)}
                                  className="w-full text-center bg-slate-900 border border-amber-500/50 rounded-lg py-1 px-2 text-sm font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Range Slider */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">0</span>
                            <input
                              type="range"
                              min={0}
                              max={item.max}
                              step={0.5}
                              value={val}
                              onChange={(e) => handleScoreChange(item.key, e.target.value, item.max)}
                              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <span className="text-xs text-amber-400 font-bold">{item.max}</span>
                          </div>

                          {/* Preset percentage buttons */}
                          <div className="flex justify-end gap-1.5 pt-1">
                            {[0.6, 0.7, 0.8, 0.9, 1.0].map((ratio) => {
                              const scorePreset = Math.round(item.max * ratio * 10) / 10;
                              return (
                                <button
                                  key={ratio}
                                  type="button"
                                  onClick={() => handleScoreChange(item.key, scorePreset, item.max)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700/60"
                                >
                                  {ratio * 100}% ({scorePreset})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Optional Comments */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ข้อเสนอแนะ / ความเห็นของกรรมการ (ถ้ามี)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ระบุความคิดเห็นหรือข้อสังเกตต่อผู้เข้าประกวด..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-950 p-4 sm:p-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                กรรมการ: <b className="text-amber-300">{judge?.name}</b>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveContestant(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveScore(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึก</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveScore(true)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>บันทึกและไปคนถัดไป</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
