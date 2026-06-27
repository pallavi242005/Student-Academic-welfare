import React, { useState } from 'react';
import { TimetableClass } from '../types';
import { DAY_OPTIONS, COLOR_OPTIONS, SUBJECT_OPTIONS } from '../data/defaults';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, MapPin, User, ChevronRight, X } from 'lucide-react';

interface TimetableWidgetProps {
  classes: TimetableClass[];
  onAddClass: (newClass: TimetableClass) => void;
  onDeleteClass: (id: string) => void;
}

export default function TimetableWidget({ classes, onAddClass, onDeleteClass }: TimetableWidgetProps) {
  const [selectedDay, setSelectedDay] = useState<typeof DAY_OPTIONS[number]>('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState<typeof DAY_OPTIONS[number]>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].bg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    const newClass: TimetableClass = {
      id: 'class_' + Date.now(),
      subject,
      teacher: teacher || 'No instructor assigned',
      room: room || 'Virtual',
      day,
      startTime,
      endTime,
      color: selectedColor,
    };

    onAddClass(newClass);
    
    // Reset Form
    setSubject('');
    setTeacher('');
    setRoom('');
    setStartTime('09:00');
    setEndTime('10:30');
    setShowAddModal(false);
  };

  const sortedClasses = [...classes].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const filteredClasses = sortedClasses.filter((c) => c.day === selectedDay);

  return (
    <div id="timetable-widget" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            Timetable Schedule
          </h3>
          <p className="text-xs text-slate-400 mt-1">Plan your classes and lectures</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-slate-800 text-slate-100 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-slate-800 text-slate-100 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekly Overview
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Class
          </button>
        </div>
      </div>

      {viewMode === 'day' ? (
        <div>
          {/* Day navigation tab */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5 border-b border-slate-800 scrollbar-none">
            {DAY_OPTIONS.map((d) => {
              const count = classes.filter((c) => c.day === d).length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedDay === d
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {d.substring(0, 3)}
                  {count > 0 && (
                    <span className="w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
              <CalendarIcon className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">No classes scheduled</p>
              <p className="text-xs text-slate-500 mt-1">Enjoy your free day or add a study session!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClasses.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:scale-[1.01] ${item.color}`}
                >
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-w-[70px]">
                      <Clock className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-xs font-bold whitespace-nowrap">{item.startTime}</span>
                      <span className="text-[10px] text-slate-500">{item.endTime}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{item.subject}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {item.teacher}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {item.room}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteClass(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-950/40 rounded-lg transition-all self-end sm:self-auto cursor-pointer"
                    title="Remove class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Weekly view calendar grid */
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <div className="min-w-[800px] grid grid-cols-8 bg-slate-950/40 text-slate-300">
            {/* Header row */}
            <div className="p-3 font-semibold text-xs border-r border-b border-slate-800 text-slate-400">Time</div>
            {DAY_OPTIONS.map((d) => (
              <div key={d} className="p-3 font-semibold text-xs text-center border-b border-slate-800 text-slate-300">
                {d.substring(0, 3)}
              </div>
            ))}

            {/* Timetable slots */}
            {['Morning', 'Afternoon', 'Evening'].map((slot, idx) => (
              <React.Fragment key={slot}>
                <div className="p-3 text-xs font-medium text-slate-400 border-r border-b border-slate-800 flex items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300">{slot}</span>
                    <span className="text-[10px] text-slate-500">
                      {idx === 0 ? '08:00 - 12:00' : idx === 1 ? '12:00 - 17:00' : '17:00 - 21:00'}
                    </span>
                  </div>
                </div>

                {DAY_OPTIONS.map((d) => {
                  const dayClasses = sortedClasses.filter((c) => {
                    if (c.day !== d) return false;
                    const startHour = parseInt(c.startTime.split(':')[0], 10);
                    if (idx === 0) return startHour < 12;
                    if (idx === 1) return startHour >= 12 && startHour < 17;
                    return startHour >= 17;
                  });

                  return (
                    <div
                      key={d}
                      className="p-2 border-r border-b border-slate-800 bg-slate-900/20 min-h-[100px] flex flex-col gap-2"
                    >
                      {dayClasses.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border text-[11px] leading-tight flex flex-col justify-between h-full ${item.color}`}
                        >
                          <div>
                            <p className="font-bold line-clamp-1">{item.subject}</p>
                            <p className="text-[9px] opacity-80 mt-1 font-medium">{item.startTime} - {item.endTime}</p>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1 border-t border-slate-800/20 pt-1 text-[9px] opacity-70">
                            <span className="truncate">{item.room}</span>
                            <button
                              onClick={() => onDeleteClass(item.id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Add New Class
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject / Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithms & Data Structures"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Instructor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Carter"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Room / Lab</label>
                  <input
                    type="text"
                    placeholder="e.g. Turing Lab 3B"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as any)}
                    className="w-full px-2 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Starts</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ends</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Color Tag</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setSelectedColor(c.bg)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        c.bg.split(' ')[1] // border color
                      } ${
                        selectedColor === c.bg ? 'scale-110 shadow-lg ring-2 ring-indigo-500/50' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      title={c.name}
                    />
                  ))}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
