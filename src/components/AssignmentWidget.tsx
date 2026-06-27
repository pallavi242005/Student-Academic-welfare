import React, { useState } from 'react';
import { Assignment } from '../types';
import { SUBJECT_OPTIONS } from '../data/defaults';
import { syncAssignmentToCalendar, deleteAssignmentFromCalendar } from '../lib/calendar';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Plus,
  Square,
  Trash2,
  CalendarCheck2,
  AlertCircle,
  X,
  FileText,
  UserCheck
} from 'lucide-react';

interface AssignmentWidgetProps {
  assignments: Assignment[];
  onAddAssignment: (assignment: Assignment) => void;
  onToggleComplete: (id: string) => void;
  onDeleteAssignment: (id: string) => void;
  onUpdateAssignmentSync: (id: string, googleEventId: string | undefined) => void;
  googleToken: string | null;
  onTriggerGoogleSignIn: () => Promise<void>;
}

export default function AssignmentWidget({
  assignments,
  onAddAssignment,
  onToggleComplete,
  onDeleteAssignment,
  onUpdateAssignmentSync,
  googleToken,
  onTriggerGoogleSignIn
}: AssignmentWidgetProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  // Sync state per assignment
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newAssignment: Assignment = {
      id: 'assignment_' + Date.now(),
      title,
      subject,
      dueDate,
      dueTime,
      completed: false,
      priority,
      notes: notes || undefined,
    };

    onAddAssignment(newAssignment);

    // Reset Form
    setTitle('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('23:59');
    setPriority('medium');
    setNotes('');
    setShowAddModal(false);
  };

  const handleSyncToCalendar = async (item: Assignment) => {
    if (!googleToken) {
      const confirmLogin = window.confirm('Please sign in with Google to sync assignments to your Google Calendar. Connect now?');
      if (confirmLogin) {
        await onTriggerGoogleSignIn();
      }
      return;
    }

    // MANDATORY confirmation dialog for modifying calendar events as per guidelines
    const isUpdate = !!item.googleEventId;
    const confirmMessage = isUpdate
      ? `Are you sure you want to update the Google Calendar event for "${item.title}"?`
      : `Sync "${item.title}" to your primary Google Calendar as a new event?`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setSyncingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      const eventId = await syncAssignmentToCalendar(item, googleToken);
      onUpdateAssignmentSync(item.id, eventId);
      alert('Successfully synced to Google Calendar!');
    } catch (error: any) {
      console.error(error);
      alert(`Sync failed: ${error.message || error}`);
    } finally {
      setSyncingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRemoveFromCalendar = async (item: Assignment) => {
    if (!item.googleEventId || !googleToken) return;

    // MANDATORY confirmation dialog
    const confirmed = window.confirm(`Remove the Google Calendar event for "${item.title}"?`);
    if (!confirmed) return;

    setSyncingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      await deleteAssignmentFromCalendar(item.googleEventId, googleToken);
      onUpdateAssignmentSync(item.id, undefined);
      alert('Event removed from Google Calendar.');
    } catch (error: any) {
      console.error(error);
      alert(`Failed to delete event: ${error.message || error}`);
    } finally {
      setSyncingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Processing assignments list
  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'completed') return item.completed;
    if (filter === 'pending') return !item.completed;
    return true;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = `${a.dueDate}T${a.dueTime || '00:00'}`;
      const dateB = `${b.dueDate}T${b.dueTime || '00:00'}`;
      return dateA.localeCompare(dateB);
    } else {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
  });

  const getPriorityStyle = (p: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'high':
        return 'bg-rose-500/10 border-rose-500 text-rose-400';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500 text-amber-400';
      case 'low':
        return 'bg-emerald-500/10 border-emerald-500 text-emerald-400';
    }
  };

  // Check if dates are overdue
  const isOverdue = (item: Assignment) => {
    if (item.completed) return false;
    const now = new Date();
    const due = new Date(`${item.dueDate}T${item.dueTime || '23:59'}`);
    return due < now;
  };

  return (
    <div id="assignments-widget" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Assignments & Deadlines
          </h3>
          <p className="text-xs text-slate-400 mt-1">Track assignments, projects, and upcoming exams</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
      </div>

      {/* Filter and sorting controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-5 pb-4 border-b border-slate-800">
        <div className="flex gap-2">
          {(['pending', 'completed', 'all'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border capitalize transition-all ${
                filter === mode
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode} ({assignments.filter((a) => (mode === 'all' ? true : mode === 'completed' ? a.completed : !a.completed)).length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="date">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {sortedAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
          <CheckSquare className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-400">All caught up!</p>
          <p className="text-xs text-slate-500 mt-1">No assignments found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((item) => {
            const overdue = isOverdue(item);
            const isSyncing = syncingIds[item.id];

            return (
              <div
                key={item.id}
                className={`p-4 bg-slate-950/30 border rounded-xl hover:border-slate-700 transition-all ${
                  item.completed ? 'opacity-60 border-slate-800/60' : overdue ? 'border-rose-500/30' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleComplete(item.id)}
                      className="p-1 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer mt-0.5"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-semibold text-slate-100 ${item.completed ? 'line-through text-slate-500' : ''}`}>
                          {item.title}
                        </h4>
                        {overdue && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded-md font-bold">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${getPriorityStyle(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{item.subject}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.dueTime || 'No time set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Calendar Sync Button */}
                    {item.googleEventId ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSyncToCalendar(item)}
                          disabled={isSyncing}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                          title="Update Google Calendar"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                          {isSyncing ? 'Syncing...' : 'Update Cal'}
                        </button>
                        <button
                          onClick={() => handleRemoveFromCalendar(item)}
                          disabled={isSyncing}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Remove from Google Calendar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSyncToCalendar(item)}
                        disabled={isSyncing}
                        className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-1"
                        title="Sync to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {isSyncing ? 'Syncing...' : 'Sync to Cal'}
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteAssignment(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-900 flex items-start gap-1.5 text-xs text-slate-400 leading-relaxed">
                    <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="whitespace-pre-wrap">{item.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Assignment Modal */}
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
              <Plus className="w-5 h-5 text-emerald-400" /> Add New Assignment / Deadline
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assignment / Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithms Lab 4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Time</label>
                  <input
                    type="time"
                    required
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Priority Level</label>
                <div className="flex gap-3">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                        priority === p
                          ? getPriorityStyle(p) + ' ring-2 ring-emerald-500/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Requirements, reference materials, or specific links..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
