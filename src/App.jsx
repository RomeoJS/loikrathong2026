import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import JudgeView from './components/JudgeView';
import AdminDashboard from './components/AdminDashboard';
import PrintReports from './components/PrintReports';
import ManagementView from './components/ManagementView';

export default function App() {
  const [activeTab, setActiveTab] = useState('judge'); // 'judge', 'admin', 'print', 'management'
  const [category, setCategory] = useState('WOMEN'); // 'WOMEN', 'MEN'
  const [round, setRound] = useState(1); // 1, 2
  const [judges, setJudges] = useState([]);
  const [activeJudge, setActiveJudge] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch judges from server
  const fetchJudges = async () => {
    try {
      const res = await fetch('/api/judges');
      const data = await res.json();
      if (Array.isArray(data)) {
        setJudges(data);
        if (!activeJudge && data.length > 0) {
          setActiveJudge(data[0]);
        } else if (activeJudge) {
          const updated = data.find(j => j.id === activeJudge.id);
          if (updated) setActiveJudge(updated);
        }
      } else {
        console.warn('API returned non-array judges:', data);
      }
    } catch (err) {
      console.error('Failed to load judges:', err);
    }
  };

  // Fetch global settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && typeof data === 'object') {
        if (data.active_round) setRound(Number(data.active_round));
        if (data.active_category) setCategory(data.active_category);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchJudges();
    fetchSettings();
  }, [refreshTrigger]);

  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-amber-500 selection:text-slate-900">
      {/* Header with Navigation and Festival Theme */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        category={category}
        setCategory={(cat) => {
          setCategory(cat);
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'active_category', value: cat })
          }).catch(console.error);
        }}
        round={round}
        setRound={(r) => {
          setRound(r);
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'active_round', value: r })
          }).catch(console.error);
        }}
        judge={activeJudge}
        setJudge={setActiveJudge}
        judges={judges}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'judge' && (
          <JudgeView
            category={category}
            round={round}
            judge={activeJudge}
            setJudge={setActiveJudge}
            judges={judges}
            onScoreUpdated={handleDataChanged}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            category={category}
            round={round}
            setRound={setRound}
            onDataChanged={handleDataChanged}
          />
        )}

        {activeTab === 'print' && (
          <PrintReports
            category={category}
            round={round}
            judges={judges}
          />
        )}

        {activeTab === 'management' && (
          <ManagementView
            category={category}
            judges={judges}
            onDataChanged={handleDataChanged}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            การประกวดเทพบุตรและนางนพมาศ ราชมงคลกรุงเทพ ประจำปี ๒๕๖๙ | ณ เวทีกลางสำนักงานอธิการบดี มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ
          </p>
          <p className="mt-1 text-slate-600">
            ระบบตัดสินคะแนนดิจิทัล &bull; พัฒนาโดย DeepMind AI Assistant &bull; พร้อมฐานข้อมูล MySQL/HeidiSQL & SQLite Cloud Mode
          </p>
        </div>
      </footer>
    </div>
  );
}
