import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  Building2,
  Tag
} from 'lucide-react';

export default function AddContestantModal({
  isOpen,
  onClose,
  defaultCategory = 'WOMEN',
  onSuccess
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [number, setNumber] = useState('');
  const [prefix, setPrefix] = useState(defaultCategory === 'WOMEN' ? 'นางสาว' : 'นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [school, setSchool] = useState('มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ');
  const [imageUrl, setImageUrl] = useState('');
  const [isCustomImageInput, setIsCustomImageInput] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setPrefix(defaultCategory === 'WOMEN' ? 'นางสาว' : 'นาย');
      setNumber('');
      setFirstName('');
      setLastName('');
      setSchool('มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ');
      setImageUrl('');
      setErrorMsg('');
      setIsCustomImageInput(false);
    }
  }, [isOpen, defaultCategory]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'WOMEN') {
      if (prefix === 'นาย') setPrefix('นางสาว');
    } else {
      if (prefix === 'นางสาว' || prefix === 'น.ส.') setPrefix('นาย');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/contestants/upload-photo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else {
        setErrorMsg('ไม่สามารถอัปโหลดรูปภาพได้');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/contestants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          number: number ? parseInt(number, 10) : undefined,
          prefix: prefix.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          school: school.trim(),
          image_url: imageUrl || '/images/placeholder.svg'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
        setSaving(false);
        return;
      }

      if (onSuccess) {
        onSuccess(data.contestant);
      }
      onClose();
    } catch (err) {
      console.error('Save contestant error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>เพิ่มข้อมูลผู้เข้าประกวด</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ระบบประกวดเทพบุตรและนางนพมาศ ประจำปี ๒๕๖๙
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Category Toggle */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              ประเภทการประกวด <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('WOMEN')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  category === 'WOMEN'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🌸</span>
                <span>นางนพมาศ</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('MEN')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  category === 'MEN'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-950/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>👑</span>
                <span>เทพบุตร</span>
              </button>
            </div>
          </div>

          {/* Number & Prefix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>หมายเลขผู้เข้าประกวด</span>
                <span className="text-[10px] text-slate-400 font-normal">(เว้นว่างเพื่อเรียงต่อท้าย)</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="เช่น 1, 2, 16..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 pl-9 pr-3 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                คำนำหน้า <span className="text-amber-400">*</span>
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrefix(category === 'WOMEN' ? 'นางสาว' : 'นาย')}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                    prefix === (category === 'WOMEN' ? 'นางสาว' : 'นาย')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {category === 'WOMEN' ? 'นางสาว' : 'นาย'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrefix(category === 'WOMEN' ? 'น.ส.' : 'นาย')}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                    prefix === 'น.ส.'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {category === 'WOMEN' ? 'น.ส.' : 'นาย'}
                </button>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="กำหนดเอง"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Name & Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                ชื่อ <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="กรอกชื่อผู้เข้าประกวด"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                นามสกุล <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="กรอกนามสกุล"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* School / Affiliation */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              สถานศึกษา / คณะ / หน่วยงานที่สังกัด
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="เช่น คณะศิลปศาสตร์ มทร.กรุงเทพ หรือ มหาวิทยาลัย..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Upload & Preview */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">
                รูปถ่ายผู้เข้าประกวด
              </label>
              <button
                type="button"
                onClick={() => setIsCustomImageInput(!isCustomImageInput)}
                className="text-[10px] text-amber-400 hover:underline"
              >
                {isCustomImageInput ? 'เลือกวิธีอัปโหลดไฟล์' : 'ระบุ URL รูปภาพแทน'}
              </button>
            </div>

            {isCustomImageInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... หรือ /images/..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-2 text-white font-mono text-xs focus:outline-none"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-2 py-1 text-slate-400 hover:text-rose-400 text-xs"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                {/* Thumbnail Preview */}
                <div className="w-16 h-20 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 relative group">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[9px] mt-1">ไม่มีรูป</span>
                    </div>
                  )}

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 text-[10px] transition-opacity"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>

                {/* Upload action */}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50 text-xs"
                  >
                    {uploading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploading ? 'กำลังอัปโหลด...' : imageUrl ? 'เปลี่ยนรูปภาพใหม่' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}</span>
                  </button>
                  <p className="text-[10px] text-slate-500">
                    รองรับไฟล์ JPG, PNG, WEBP (หากไม่มีรูป สามารถเพิ่มภายหลังได้)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกและเพิ่มผู้เข้าประกวด'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
