import React from 'react';
import { Assignment, Alarm } from '../types';
import { AlertCircle, CalendarClock, Sparkles, X, ChevronRight } from 'lucide-react';

interface NotificationBannerProps {
  assignments: Assignment[];
  alarms: Alarm[];
}

export default function NotificationBanner({ assignments, alarms }: NotificationBannerProps) {
  // Find urgent items
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const urgentAssignments = assignments.filter((a) => {
    if (a.completed) return false;
    return a.dueDate === todayStr || a.dueDate === tomorrowStr;
  });

  const examReminders = alarms.filter((al) => al.enabled && al.isExamReminder);

  if (urgentAssignments.length === 0 && examReminders.length === 0) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-100">Your schedule is pristine!</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">No immediate deadlines or exam reminders for today or tomorrow. Keep up the amazing work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {urgentAssignments.map((a) => {
        const isToday = a.dueDate === todayStr;
        return (
          <div
            key={a.id}
            className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-pulse-slow ${
              isToday
                ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                : 'bg-amber-500/10 border-amber-500 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isToday ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest leading-none">
                  Deadline Alert: {isToday ? 'Due Today' : 'Due Tomorrow'}
                </span>
                <h4 className="text-xs font-bold text-slate-100 mt-0.5">{a.title}</h4>
                <p className="text-[10px] opacity-80 mt-0.5">Subject: {a.subject} • Priority: {a.priority}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] font-mono opacity-85 bg-black/20 px-2 py-1 rounded-md font-bold">
                Time: {a.dueTime || '23:59'}
              </span>
            </div>
          </div>
        );
      })}

      {examReminders.map((al) => (
        <div
          key={al.id}
          className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-md text-indigo-300"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest leading-none">Exam Notification Mode Active</span>
              <h4 className="text-xs font-bold text-slate-100 mt-0.5">{al.title}</h4>
              <p className="text-[10px] opacity-80 mt-0.5">
                Subject: {al.associatedSubject || 'General Study'} • Set for {al.time}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono opacity-85 bg-black/20 px-2 py-1 rounded-md font-bold">
            Alert Active
          </div>
        </div>
      ))}
    </div>
  );
}
