import React, { useState, useEffect } from 'react';
import { Settings, Edit2, Upload, User, Check, X, Shield, RefreshCw } from 'lucide-react';

export default function ManagementView({
  category,
  judges = [],
  onDataChanged
}) {
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingContestant, setEditingContestant] = useState(null);
  const [editingJudge, setEditingJudge] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchContestants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contestants?category=${category}`);
      const data = await res.json();
      setContestants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestants();
  }, [category]);

  // Handle Photo Upload
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
        // Update contestant record
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

  // Handle Save Contestant Info
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

  // Handle Save Judge Info
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
    } catch (err) {
      console.error(err);
      alert('บันทึกล้มเหลว');
    }
  };

  return (
    <div className="space-y-8">
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

      {/* Judges Management */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>จัดการข้อมูลคณะกรรมการตัดสิน (Judges)</span>
          </h2>
          <p className="text-xs text-slate-400">
            ปรับแต่งชื่อและตำแหน่งของกรรมการทั้ง ๖ ท่านให้ตรงตามรายนามจริง
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {judges.map((j) => (
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
