import React, { useState, useEffect, useRef } from 'react';
import { Alarm } from '../types';
import { DAY_OPTIONS, SUBJECT_OPTIONS } from '../data/defaults';
import { Clock, Plus, Trash2, Volume2, VolumeX, Bell, AlertTriangle, X, Check } from 'lucide-react';

interface AlarmWidgetProps {
  alarms: Alarm[];
  onAddAlarm: (alarm: Alarm) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  activeAlarm: Alarm | null;
  onTriggerAlarm: (alarm: Alarm | null) => void;
}

export default function AlarmWidget({
  alarms,
  onAddAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  activeAlarm,
  onTriggerAlarm,
}: AlarmWidgetProps) {
  const [time, setTime] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Alarm Form State
  const [title, setTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('07:30');
  const [repeatDays, setRepeatDays] = useState<typeof DAY_OPTIONS[number][]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [isExamReminder, setIsExamReminder] = useState(false);
  const [associatedSubject, setAssociatedSubject] = useState(SUBJECT_OPTIONS[0]);

  // Tick the clock every second and check alarms
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = weekdays[now.getDay()] as typeof DAY_OPTIONS[number];

      // Check if any active alarms are matched
      alarms.forEach((alarm) => {
        if (
          alarm.enabled &&
          alarm.time === currentTimeString &&
          alarm.days.includes(currentDay) &&
          !alarm.triggeredToday &&
          !activeAlarm
        ) {
          onTriggerAlarm(alarm);
        }
      });

      // Reset triggered alarms at midnight
      if (currentTimeString === '00:00') {
        alarms.forEach(a => {
          a.triggeredToday = false;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, activeAlarm, onTriggerAlarm]);

  // Audio Playback
  useEffect(() => {
    if (activeAlarm && soundEnabled) {
      startBuzzer();
    } else {
      stopBuzzer();
    }
    return () => stopBuzzer();
  }, [activeAlarm, soundEnabled]);

  const startBuzzer = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create recurring beep oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard beep
      
      // Ring sequence: rapid double beep every second
      gain.gain.setValueAtTime(0, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      // Start looping volume beeps
      let isBeeping = false;
      const intervalId = setInterval(() => {
        if (!gainNodeRef.current) {
          clearInterval(intervalId);
          return;
        }
        isBeeping = !isBeeping;
        gainNodeRef.current.gain.setValueAtTime(isBeeping ? 0.3 : 0, ctx.currentTime);
        // Change frequency based on urgency (exam reminders ring higher)
        const freq = activeAlarm?.isExamReminder ? 880 : 550;
        oscillatorRef.current?.frequency.setValueAtTime(isBeeping ? freq : 0, ctx.currentTime);
      }, 250);

      (osc as any).beepingInterval = intervalId;
    } catch (e) {
      console.error('Failed to play alarm audio:', e);
    }
  };

  const stopBuzzer = () => {
    if (oscillatorRef.current) {
      clearInterval((oscillatorRef.current as any).beepingInterval);
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  const handleAddAlarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repeatDays.length === 0) {
      alert('Please select at least one day for repeat.');
      return;
    }

    const newAlarm: Alarm = {
      id: 'alarm_' + Date.now(),
      title: title || 'Scheduled Alarm',
      time: alarmTime,
      days: repeatDays,
      enabled: true,
      isExamReminder,
      associatedSubject: isExamReminder ? associatedSubject : undefined,
    };

    onAddAlarm(newAlarm);

    // Reset Form
    setTitle('');
    setAlarmTime('07:30');
    setRepeatDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    setIsExamReminder(false);
    setShowAddModal(false);
  };

  const handleToggleDay = (day: typeof DAY_OPTIONS[number]) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const dismissActiveAlarm = () => {
    if (activeAlarm) {
      activeAlarm.triggeredToday = true;
      onTriggerAlarm(null);
    }
  };

  const snoozeActiveAlarm = () => {
    if (activeAlarm) {
      // Set snooze: adjust alarm time in memory 5 minutes forward (or just dismiss and retrigger later)
      alert('Snoozed for 5 minutes (simulated).');
      dismissActiveAlarm();
    }
  };

  return (
    <div id="alarms-widget" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Clock & Reminders
            </h3>
            <p className="text-xs text-slate-400 mt-1">Real-time alerts for study and classes</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Alarm
          </button>
        </div>

        {/* Big Clock Display */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
              title={soundEnabled ? 'Mute buzzer' : 'Unmute buzzer'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-4xl font-mono font-bold tracking-widest text-amber-400">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Alarms List */}
        {alarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
            <Bell className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No alarms programmed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3 bg-slate-950/30 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                  alarm.enabled ? 'border-slate-800' : 'border-slate-900 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${alarm.isExamReminder ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    {alarm.isExamReminder ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-100">{alarm.time}</span>
                      {alarm.isExamReminder && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded font-bold uppercase">
                          Exam Alert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{alarm.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      {alarm.days.length === 7 ? 'Everyday' : alarm.days.map((d) => d.substring(0, 3)).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAlarm(alarm.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      alarm.enabled ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        alarm.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => onDeleteAlarm(alarm.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ringing Alarm Overlay */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-pulse-slow">
          <div className="text-center max-w-md w-full p-8 bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Pulsing Bell Icon */}
            <div className={`p-6 rounded-full mb-6 relative animate-bounce ${activeAlarm.isExamReminder ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Bell className="w-16 h-16 animate-wiggle" />
            </div>

            <h2 className="text-2xl font-mono font-black tracking-widest text-slate-100 mb-2 animate-pulse">
              ALARM TRIGGERED
            </h2>
            <p className="text-4xl font-mono font-bold text-amber-400 mb-4">{activeAlarm.time}</p>

            <h3 className="text-lg font-bold text-slate-100 mb-2">{activeAlarm.title}</h3>
            
            {activeAlarm.isExamReminder && activeAlarm.associatedSubject && (
              <p className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-full font-bold uppercase mb-6 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Exam Reminder: {activeAlarm.associatedSubject}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 w-full mt-6">
              <button
                onClick={snoozeActiveAlarm}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Snooze (5m)
              </button>
              <button
                onClick={dismissActiveAlarm}
                className={`py-3 px-4 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg ${
                  activeAlarm.isExamReminder
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                }`}
              >
                <Check className="w-4 h-4" /> Dismiss Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alarm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> Program Alarm / Exam Alert
            </h4>
            <form onSubmit={handleAddAlarmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Alarm Title / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wake up, Study slot, Calculus prep..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Time (24h format)</label>
                  <input
                    type="time"
                    required
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 py-2 bg-slate-950/40 px-3 rounded-xl border border-slate-800 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExamReminder}
                      onChange={(e) => setIsExamReminder(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Exam Reminder?</span>
                  </label>
                </div>
              </div>

              {isExamReminder && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Associated Subject</label>
                  <select
                    value={associatedSubject}
                    onChange={(e) => setAssociatedSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-amber-500 transition-all"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Repeat Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_OPTIONS.map((d) => {
                    const isSelected = repeatDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleDay(d)}
                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {d.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Schedule Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
