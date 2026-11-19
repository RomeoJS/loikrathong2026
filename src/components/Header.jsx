import React from 'react';
import { Award, Users, FileText, Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  category,
  setCategory,
  round,
  setRound,
  judge,
  setJudge,
  judges = []
}) {
  return (
    <header className="bg-slate-900 border-b border-amber-500/30 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      {/* Top Banner with University Official Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Event Title */}
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-1.5 rounded-lg border border-amber-400/30 shadow-inner flex items-center justify-center">
              <img
                src="/images/header_logo.png"
                alt="ตรามหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ"
                className="h-14 w-auto object-contain filter drop-shadow"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  RMUTK 2569
                </span>
                <span className="text-xs text-slate-400">เวทีกลาง สำนักงานอธิการบดี</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                ระบบตัดสินคะแนน เทพบุตรและนางนพมาศ ๒๕๖๙
              </h1>
              <p className="text-xs text-amber-200/80">
                มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ ประจำปี ๒๕๖๙
              </p>
            </div>
          </div>

          {/* Quick Round & Category Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <button
                onClick={() => setCategory('WOMEN')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  category === 'WOMEN'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌸</span>
                <span>นางนพมาศ (หญิง)</span>
              </button>
              <button
                onClick={() => setCategory('MEN')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  category === 'MEN'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👑</span>
                <span>เทพบุตร (ชาย)</span>
              </button>
            </div>

            {/* Round Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <button
                onClick={() => setRound(1)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  round === 1
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                รอบที่ ๑ (คัดเหลือ ๖)
              </button>
              <button
                onClick={() => setRound(2)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  round === 2
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                รอบที่ ๒ (ตัดสินชิงชนะเลิศ ๓)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-800 bg-slate-950/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('judge')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'judge'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>ฝั่งกรรมการตัดสิน (Judge Portal)</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>ฝั่งแอดมิน / คณะกรรมการกลาง (Admin Dashboard)</span>
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'print'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>พิมพ์แบบฟอร์มคะแนนทางการ (Official Print)</span>
            </button>

            <button
              onClick={() => setActiveTab('management')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'management'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>จัดการข้อมูล (Manage Data)</span>
            </button>
          </div>

          {/* Current Judge Indicator if on Judge tab */}
          {activeTab === 'judge' && (
            <div className="flex items-center gap-2 text-xs bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">ท่านกำลังให้คะแนนในฐานะ:</span>
              <span className="text-amber-300 font-semibold">{judge ? judge.name : 'ยังไม่เลือกกรรมการ'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
