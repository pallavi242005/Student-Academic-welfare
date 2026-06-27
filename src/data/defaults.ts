import { TimetableClass, Alarm, Assignment, DashboardWidget, StudySession } from '../types';

export const DEFAULT_CLASSES: TimetableClass[] = [
  {
    id: 'c1',
    subject: 'Algorithms & Data Structures',
    teacher: 'Dr. Evelyn Carter',
    room: 'Turing Lab 3B',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    color: 'bg-indigo-500/10 border-indigo-500 text-indigo-400',
  },
  {
    id: 'c2',
    subject: 'Calculus II',
    teacher: 'Prof. Marcus Vance',
    room: 'Euler Hall 402',
    day: 'Tuesday',
    startTime: '11:00',
    endTime: '12:30',
    color: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
  },
  {
    id: 'c3',
    subject: 'Astrophysics & Cosmology',
    teacher: 'Dr. Sarah Hawking',
    room: 'Newton Observatory',
    day: 'Wednesday',
    startTime: '14:00',
    endTime: '15:30',
    color: 'bg-amber-500/10 border-amber-500 text-amber-400',
  },
  {
    id: 'c4',
    subject: 'Human-Computer Interaction',
    teacher: 'Prof. Diana Norman',
    room: 'Design Studio 1A',
    day: 'Thursday',
    startTime: '10:00',
    endTime: '11:30',
    color: 'bg-rose-500/10 border-rose-500 text-rose-400',
  },
  {
    id: 'c5',
    subject: 'Machine Learning',
    teacher: 'Dr. Evelyn Carter',
    room: 'Turing Lab 3B',
    day: 'Friday',
    startTime: '13:00',
    endTime: '14:30',
    color: 'bg-cyan-500/10 border-cyan-500 text-cyan-400',
  }
];

export const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'a1',
    title: 'Morning Class Wakeup',
    time: '07:30',
    days: ['Monday', 'Wednesday', 'Thursday'],
    enabled: true,
  },
  {
    id: 'a2',
    title: 'Study Session Reminder',
    time: '18:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    enabled: true,
  }
];

// Helper to get formatted date string (tomorrow, soon)
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'as1',
    title: 'Implement Dijkstra Visualizer',
    subject: 'Algorithms & Data Structures',
    dueDate: getRelativeDate(1),
    dueTime: '23:59',
    completed: false,
    priority: 'high',
    notes: 'Must support weighted graphs and step-by-step trace.',
  },
  {
    id: 'as2',
    title: 'Calculus Problem Set 6',
    subject: 'Calculus II',
    dueDate: getRelativeDate(3),
    dueTime: '17:00',
    completed: false,
    priority: 'medium',
    notes: 'Chapter 8: Techniques of Integration, questions 1-15.',
  },
  {
    id: 'as3',
    title: 'Astrophysics Midterm Exam',
    subject: 'Astrophysics & Cosmology',
    dueDate: getRelativeDate(5),
    dueTime: '14:00',
    completed: false,
    priority: 'high',
    notes: 'Covers stellar nucleosynthesis, dark energy, and Hubble law.',
  }
];

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'timetable', title: 'Interactive Timetable', visible: true, order: 1 },
  { id: 'assignments', title: 'Assignments & Reminders', visible: true, order: 2 },
  { id: 'pomodoro', title: 'Pomodoro Study Tracker', visible: true, order: 3 },
  { id: 'alarms', title: 'Active Alarms & Alerts', visible: true, order: 4 },
  { id: 'backup', title: 'Backup & Google Sync', visible: true, order: 5 },
];

export const DEFAULT_SESSIONS: StudySession[] = [
  {
    id: 's1',
    subject: 'Algorithms & Data Structures',
    duration: 25,
    date: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
    type: 'pomodoro',
    notes: 'Finished reading Red-Black Trees.'
  },
  {
    id: 's2',
    subject: 'Calculus II',
    duration: 50,
    date: new Date(Date.now() - 3600000 * 2).toISOString(), // Today
    type: 'custom',
    notes: 'Practiced Integration by parts.'
  }
];

export const SUBJECT_OPTIONS = [
  'Algorithms & Data Structures',
  'Calculus II',
  'Astrophysics & Cosmology',
  'Human-Computer Interaction',
  'Machine Learning',
  'General Study',
  'Other'
];

export const DAY_OPTIONS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const COLOR_OPTIONS = [
  { name: 'Indigo', bg: 'bg-indigo-500/10 border-indigo-500 text-indigo-400' },
  { name: 'Emerald', bg: 'bg-emerald-500/10 border-emerald-500 text-emerald-400' },
  { name: 'Amber', bg: 'bg-amber-500/10 border-amber-500 text-amber-400' },
  { name: 'Rose', bg: 'bg-rose-500/10 border-rose-500 text-rose-400' },
  { name: 'Cyan', bg: 'bg-cyan-500/10 border-cyan-500 text-cyan-400' },
  { name: 'Violet', bg: 'bg-violet-500/10 border-violet-500 text-violet-400' },
];
