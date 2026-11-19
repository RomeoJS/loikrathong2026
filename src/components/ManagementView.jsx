import React, { useState, useEffect } from 'react';
import { Settings, Edit2, Upload, User, Check, X, Shield, RefreshCw, KeyRound, Lock } from 'lucide-react';

export default function ManagementView({
  category,
  judges = [],
  onDataChanged
}) {
  const [contestants, setContestants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingContestant, setEditingContestant] = useState(null);
  const [editingJudge, setEditingJudge] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const activeJudges = judges.slice(0, 3);

  const fetchContestants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contestants?category=${category}`);
      const data = await res.json();
      setContestants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchContestants();
    fetchUsers();
  }, [category]);

  const handlePhotoUpload = async (contestantId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(contestantId);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const uploadRes = await fetch('/api/contestants/upload-photo', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (uploadData.url) {
        await fetch(`/api/contestants/${contestantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: uploadData.url })
        });
        await fetchContestants();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSaveContestant = async () => {
    if (!editingContestant) return;
    try {
      await fetch(`/api/contestants/${editingContestant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: editingContestant.prefix,
          first_name: editingContestant.first_name,
          last_name: editingContestant.last_name,
          school: editingContestant.school
        })
      });
      setEditingContestant(null);
      await fetchContestants();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      alert('บันทึกล้มเหลว');
    }
  };

  const handleSaveJudge = async () => {
    if (!editingJudge) return;
    try {
      await fetch(`/api/judges/${editingJudge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingJudge.name,
          title: editingJudge.title
        })
      });
      setEditingJudge(null);
      if (onDataChanged) onDataChanged();
      await fetchUsers();
    } catch (err) {
      console.error(err);
      alert('บันทึกล้มเหลว');
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingUser || !newPassword) return;
    try {
      const res = await fetch(`/api/auth/users/${editingUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        setPasswordSuccess(`เปลี่ยนรหัสผ่านของ ${editingUser.name} เรียบร้อยแล้ว`);
        setTimeout(() => setPasswordSuccess(''), 3000);
        setEditingUser(null);
        setNewPassword('');
        await fetchUsers();
      } else {
        alert('เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {passwordSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400">
          <Check className="w-5 h-5" />
          <span className="font-medium text-xs">{passwordSuccess}</span>
        </div>
      )}

      {/* Account & Password Management (Admin) */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>จัดการบัญชีผู้ใช้และรหัสผ่าน (Accounts & Passwords)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              กำหนดรหัสผ่านสำหรับกรรมการทั้ง ๓ ท่าน และผู้ดูแลระบบ (Admin)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    u.role === 'admin' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {u.role === 'admin' ? 'ADMIN' : `JUDGE ${u.judge_id}`}
                  </span>
                  <button
                    onClick={() => { setEditingUser(u); setNewPassword(''); }}
                    className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-900"
                    title="เปลี่ยนรหัสผ่าน"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-bold text-white text-sm mt-2">{u.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  ชื่อผู้ใช้: <code className="text-amber-400 font-mono">{u.username}</code>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  รหัสผ่าน: <code className="text-slate-300 font-mono">{u.password}</code>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-right">
                <button
                  onClick={() => { setEditingUser(u); setNewPassword(''); }}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-amber-300 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-colors"
                >
                  แก้ไขรหัสผ่าน
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Judges Management (3 judges) */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>ข้อมูลกรรมการตัดสิน (๓ ท่าน)</span>
          </h2>
          <p className="text-xs text-slate-400">
            ปรับแต่งชื่อและตำแหน่งของกรรมการทั้ง ๓ ท่าน
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {activeJudges.map((j) => (
            <div
              key={j.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">
                  กรรมการท่านที่ {j.id}
                </span>
                <div className="font-bold text-white text-sm mt-0.5">{j.name}</div>
                <div className="text-xs text-slate-400">{j.title}</div>
              </div>
              <button
                onClick={() => setEditingJudge({ ...j })}
                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg border border-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contestants Management */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              <span>จัดการข้อมูลผู้เข้าประกวด ({category === 'WOMEN' ? 'นางนพมาศ' : 'เทพบุตร'})</span>
            </h2>
            <p className="text-xs text-slate-400">
              แก้ไขชื่อ-สกุล, สถาบันการศึกษา หรือเปลี่ยน/อัปโหลดรูปภาพผู้เข้าประกวด
            </p>
          </div>
          <button
            onClick={fetchContestants}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {contestants.map((c) => (
            <div
              key={c.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="relative group">
                <img
                  src={c.image_url || '/images/placeholder.svg'}
                  alt=""
                  className="w-16 h-20 rounded-lg object-cover object-top border border-slate-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.svg';
                  }}
                />
                <label className="absolute inset-0 bg-slate-950/75 rounded-lg opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span className="text-[9px] text-white mt-1">เปลี่ยนรูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(c.id, e)}
                    className="hidden"
                    disabled={uploadingId === c.id}
                  />
                </label>
                {uploadingId === c.id && (
                  <div className="absolute inset-0 bg-slate-950/90 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    #{String(c.number).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setEditingContestant({ ...c })}
                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-semibold text-white text-sm truncate mt-1">
                  {c.prefix}{c.first_name} {c.last_name}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  {c.school}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= EDIT PASSWORD MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              เปลี่ยนรหัสผ่าน: {editingUser.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              ชื่อผู้ใช้: <code className="text-amber-300 font-mono">{editingUser.username}</code>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">รหัสผ่านใหม่</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={!newPassword}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                บันทึกรหัสผ่าน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT CONTESTANT MODAL ================= */}
      {editingContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              แก้ไขข้อมูลผู้เข้าประกวด หมายเลข #{editingContestant.number}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">คำนำหน้า</label>
                <input
                  type="text"
                  value={editingContestant.prefix}
                  onChange={(e) => setEditingContestant({ ...editingContestant, prefix: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ชื่อ</label>
                <input
                  type="text"
                  value={editingContestant.first_name}
                  onChange={(e) => setEditingContestant({ ...editingContestant, first_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">นามสกุล</label>
                <input
                  type="text"
                  value={editingContestant.last_name}
                  onChange={(e) => setEditingContestant({ ...editingContestant, last_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">สถานศึกษา / สังกัด</label>
                <input
                  type="text"
                  value={editingContestant.school}
                  onChange={(e) => setEditingContestant({ ...editingContestant, school: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingContestant(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveContestant}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT JUDGE MODAL ================= */}
      {editingJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              แก้ไขข้อมูลกรรมการตัดสิน ท่านที่ {editingJudge.id}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">ชื่อ-สกุล กรรมการ</label>
                <input
                  type="text"
                  value={editingJudge.name}
                  onChange={(e) => setEditingJudge({ ...editingJudge, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ตำแหน่ง / หน่วยงาน</label>
                <input
                  type="text"
                  value={editingJudge.title}
                  onChange={(e) => setEditingJudge({ ...editingJudge, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingJudge(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveJudge}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
