import React from 'react';
import { Award, Users, FileText, Settings, ShieldCheck, LogOut, Sparkles, Crown } from 'lucide-react';

export default function Header({
  currentUser,
  onLogout,
  activeTab,
  setActiveTab,
  category,
  setCategory,
  round,
  setRound,
  judge,
  judges = []
}) {
  const isAdmin = currentUser?.role === 'admin';
  const isJudge = currentUser?.role === 'judge';

  return (
    <header className="bg-slate-900/95 border-b border-amber-500/20 sticky top-0 z-40 shadow-xl backdrop-blur-xl">
      {/* Top Banner (Clean, modern, no bulky logo) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Event Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300">
              <Crown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  RMUTK ๒๕๖๙ &bull; คณะกรรมการ ๓ ท่าน
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">เกณฑ์เฉลี่ยหาร ๓</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent leading-tight mt-0.5">
                ระบบตัดสินคะแนน เทพบุตรและนางนพมาศ ๒๕๖๙
              </h1>
            </div>
          </div>

          {/* Controls: Category, Round, and Account Profile */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setCategory('WOMEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  category === 'WOMEN'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌸</span>
                <span>นางนพมาศ</span>
              </button>
              <button
                onClick={() => setCategory('MEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  category === 'MEN'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👑</span>
                <span>เทพบุตร</span>
              </button>
            </div>

            {/* Round Selector (3 Stages) */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setRound(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  round === 1
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="รอบแรก: คัดเลือกผู้เข้าประกวด ๖ อันดับแรกเพื่อไปตอบคำถาม"
              >
                รอบที่ ๑ (คัด ๖ คนตอบคำถาม)
              </button>
              <button
                onClick={() => setRound(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  round === 2
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="รอบตอบคำถาม: คัดเลือกผู้ที่ได้คะแนนดีที่สุด ๓ คนเข้าสู่รอบเสี่ยงทาย"
              >
                รอบที่ ๒ (ตอบคำถาม - คัด ๓ คนเสี่ยงทาย)
              </button>
              <button
                onClick={() => setRound(3)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                  round === 3
                    ? 'bg-gradient-to-r from-purple-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
                title="รอบเสี่ยงทาย: ๓ คนสุดท้ายทำการเสี่ยงทายบนเวทีเพื่อตัดสินรางวัลชนะเลิศ"
              >
                <span>🔮</span>
                <span>รอบเสี่ยงทาย (๓ คนสุดท้าย)</span>
              </button>
            </div>

            {/* User Profile Pill & Logout */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 pl-3 pr-1 py-1 rounded-xl shadow-inner">
              <div className="text-right">
                <div className="text-[10px] flex items-center gap-1">
                  {isAdmin ? (
                    <span className="text-emerald-400 font-bold">● ผู้ดูแลระบบ</span>
                  ) : (
                    <span className="text-amber-400 font-bold">● กรรมการท่านที่ {currentUser?.judge_id}</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                  {currentUser?.name}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1.5">
          <div className="flex items-center space-x-1.5">
            
            <button
              onClick={() => setActiveTab('judge')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'judge'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isJudge ? 'หน้าลงคะแนนของท่าน' : 'ฝั่งกรรมการตัดสิน (Judge Portal)'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>แอดมิน / ตารางคะแนน & แก้ไขคะแนน</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('print')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'print'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>พิมพ์แบบฟอร์มคะแนนเฉลี่ย ๓ ท่าน</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('management')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'management'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>จัดการข้อมูล & บัญชี</span>
              </button>
            )}
          </div>

          {activeTab === 'judge' && (
            <div className="flex items-center gap-2 text-xs bg-slate-900 border border-amber-500/20 px-3 py-1 rounded-lg">
              <span className="text-slate-400 text-[11px]">กำลังลงคะแนน:</span>
              <span className="text-amber-300 font-semibold">{judge ? judge.name : 'กำลังโหลด...'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
