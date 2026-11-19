import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, User, ArrowRight, Sparkles, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [roleTab, setRoleTab] = useState('judge'); // 'judge' | 'admin'
  const [selectedJudgeNum, setSelectedJudgeNum] = useState(1);
  const [judgePassword, setJudgePassword] = useState('1234');
  
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const username = roleTab === 'judge' ? `judge${selectedJudgeNum}` : adminUsername;
    const password = roleTab === 'judge' ? judgePassword : adminPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username, password) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'ล็อกอินไม่สำเร็จ');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        
        {/* University Logo & Event Heading */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white/10 p-2 rounded-2xl border border-amber-400/30 shadow-inner mb-3">
            <img
              src="/images/header_logo.png"
              alt="ตรามหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ"
              className="h-16 w-auto object-contain mx-auto filter drop-shadow"
            />
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            ระบบตัดสินคะแนนดิจิทัล RMUTK ๒๕๖๙
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            เข้าสู่ระบบตัดสินคะแนน
          </h2>
          <p className="text-xs text-amber-200/70 mt-1">
            การประกวดเทพบุตรและนางนพมาศ ราชมงคลกรุงเทพ
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setRoleTab('judge'); setErrorMsg(''); }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              roleTab === 'judge'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>กรรมการตัดสิน (๓ ท่าน)</span>
          </button>
          <button
            type="button"
            onClick={() => { setRoleTab('admin'); setErrorMsg(''); }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              roleTab === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ผู้ดูแลระบบ (Admin)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleLogin} className="space-y-4">
          {roleTab === 'judge' ? (
            <>
              {/* Select Judge (1, 2, or 3) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  เลือกกรรมการผู้ทรงคุณวุฒิ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => {
                    const isSelected = selectedJudgeNum === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedJudgeNum(num)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-sm">กรรมการท่านที่</div>
                        <div className="text-lg font-black text-amber-400 mt-0.5">
                          {num === 1 ? '๑' : num === 2 ? '๒' : '๓'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Judge Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  รหัสผ่าน / PIN กรรมการท่านที่ {selectedJudgeNum}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={judgePassword}
                    onChange={(e) => setJudgePassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น: 1234)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * รหัสผ่านเริ่มต้นคือ: <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">1234</code>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Admin Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ชื่อผู้ใช้งานผู้ดูแลระบบ (Admin Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="กรอกชื่อผู้ใช้ admin"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Admin Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านแอดมิน"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * บัญชีเริ่มต้น: <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">admin</code> / <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">admin123</code>
                </p>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all mt-4"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick One-Click Demo Login */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>เข้าสู่ระบบด่วนสำหรับการทดสอบ (One-click Quick Login)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('judge1', '1234')}
              className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-lg text-xs text-amber-300 transition-colors"
            >
              กรรมการ ๑
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('judge2', '1234')}
              className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-lg text-xs text-amber-300 transition-colors"
            >
              กรรมการ ๒
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('judge3', '1234')}
              className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-lg text-xs text-amber-300 transition-colors"
            >
              กรรมการ ๓
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-lg text-xs text-emerald-300 transition-colors"
            >
              แอดมิน (Admin)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
