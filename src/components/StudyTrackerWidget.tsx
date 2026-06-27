import React, { useState, useEffect, useRef } from 'react';
import { StudySession } from '../types';
import { SUBJECT_OPTIONS } from '../data/defaults';
import { Play, Pause, RotateCcw, Award, Clock, Plus, BarChart3, ListChecks, HelpCircle, X, CheckCircle2 } from 'lucide-react';

interface StudyTrackerWidgetProps {
  sessions: StudySession[];
  onAddSession: (session: StudySession) => void;
  onClearSessions: () => void;
}

export default function StudyTrackerWidget({
  sessions,
  onAddSession,
  onClearSessions,
}: StudyTrackerWidgetProps) {
  // Pomodoro timer states
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECT_OPTIONS[0]);
  const [sessionNotes, setSessionNotes] = useState('');

  // Manual log modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [manualSubject, setManualSubject] = useState(SUBJECT_OPTIONS[0]);
  const [manualDuration, setManualDuration] = useState(30);
  const [manualNotes, setManualNotes] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize total values
  const totalSecondsRef = useRef(25 * 60);

  // Sync totalSeconds with mode adjustments
  useEffect(() => {
    if (!isActive) {
      const mins = mode === 'study' ? 25 : 5;
      setMinutes(mins);
      setSeconds(0);
      totalSecondsRef.current = mins * 60;
    }
  }, [mode, isActive]);

  // Tick timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Finished!
            playCompletionSound();
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds]);

  const playCompletionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.45); // C6

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTimerComplete = () => {
    setIsActive(false);

    if (mode === 'study') {
      const completedSession: StudySession = {
        id: 'session_' + Date.now(),
        subject: selectedSubject,
        duration: 25, // Pomodoro is 25m
        date: new Date().toISOString(),
        notes: sessionNotes || 'Pomodoro study session completed!',
        type: 'pomodoro',
      };
      onAddSession(completedSession);
      alert(`🎉 Fantastic job! 25-minute Pomodoro study block for "${selectedSubject}" is logged! Take a well-deserved 5-minute break.`);
      setSessionNotes('');
      setMode('break');
    } else {
      alert('Break is over! Ready to focus? Let\'s lock in.');
      setMode('study');
    }
  };

  const handleReset = () => {
    setIsActive(false);
    const mins = mode === 'study' ? 25 : 5;
    setMinutes(mins);
    setSeconds(0);
    totalSecondsRef.current = mins * 60;
  };

  const handleManualLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualDuration <= 0) return;

    const manualSession: StudySession = {
      id: 'session_' + Date.now(),
      subject: manualSubject,
      duration: Number(manualDuration),
      date: new Date().toISOString(),
      notes: manualNotes || 'Manual study session logged.',
      type: 'custom',
    };

    onAddSession(manualSession);
    setManualNotes('');
    setShowLogModal(false);
    alert('Session logged successfully!');
  };

  // Calculate stats
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const subjectBreakdown = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.subject] = (acc[s.subject] || 0) + s.duration;
    return acc;
  }, {});

  const currentSeconds = minutes * 60 + seconds;
  const progressPercent = ((totalSecondsRef.current - currentSeconds) / totalSecondsRef.current) * 100;

  // Render donut circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div id="study-tracker-widget" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Focus Pomodoro
            </h3>
            <p className="text-xs text-slate-400 mt-1">Boost performance with timed study blocks</p>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Session
          </button>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 mb-6">
          <button
            onClick={() => {
              setMode('study');
              setIsActive(false);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'study' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📚 Study Time (25m)
          </button>
          <button
            onClick={() => {
              setMode('break');
              setIsActive(false);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'break' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☕ Break Time (5m)
          </button>
        </div>

        {/* Circular Timer Visual */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              {/* Outer boundary */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r={radius}
                className={`transition-all duration-300 ${mode === 'study' ? 'stroke-indigo-500' : 'stroke-emerald-500'}`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-mono font-bold tracking-tight text-slate-100">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                {mode === 'study' ? 'Focus Block' : 'Short Rest'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer ${
                isActive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isActive ? 'Pause' : 'Start Focus'}
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Session subject association */}
        {mode === 'study' && (
          <div className="space-y-3 mb-6 bg-slate-950/20 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Associate Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-950 text-slate-300 rounded-lg border border-slate-850 text-xs focus:outline-none"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Session Target Notes</label>
              <input
                type="text"
                placeholder="What is your focus for this session? (e.g. review lecture)"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-lg border border-slate-850 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Study Analytics breakdown */}
        <div className="border-t border-slate-800/80 pt-5 mt-5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Study Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Logged</p>
              <p className="text-lg font-bold text-slate-100 mt-1">{totalStudyMinutes}m</p>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Sessions</p>
              <p className="text-lg font-bold text-slate-100 mt-1">{sessions.length}</p>
            </div>
          </div>

          <div className="space-y-2">
            {Object.keys(subjectBreakdown).map((sub) => (
              <div key={sub} className="flex justify-between items-center text-xs">
                <span className="text-slate-400 truncate max-w-[150px]">{sub}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full"
                      style={{ width: `${(subjectBreakdown[sub] / (totalStudyMinutes || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-300 font-mono font-bold">{subjectBreakdown[sub]}m</span>
                </div>
              </div>
            ))}
          </div>

          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Delete study logs? This action is irreversible.')) {
                  onClearSessions();
                }
              }}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors mt-4 block"
            >
              Clear Session Logs
            </button>
          )}
        </div>
      </div>

      {/* Manual session log modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Log Study Session Manually
            </h4>
            <form onSubmit={handleManualLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                <select
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="480"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Session Summary</label>
                <textarea
                  rows={3}
                  placeholder="Practiced calculus derivations, summarized historical timelines, etc."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Log Study Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
