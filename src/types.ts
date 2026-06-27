export interface TimetableClass {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string; // Tailwind bg color class, e.g., "bg-indigo-500"
}

export interface Alarm {
  id: string;
  title: string;
  time: string; // "HH:MM"
  days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  enabled: boolean;
  isExamReminder?: boolean;
  associatedSubject?: string;
  triggeredToday?: boolean;
}

export interface StudySession {
  id: string;
  subject: string;
  duration: number; // minutes
  date: string; // ISO date string
  notes?: string;
  type: 'pomodoro' | 'custom';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  googleEventId?: string; // Id of synced Google Calendar Event
}

export interface DashboardWidget {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface StudentBackupData {
  classes: TimetableClass[];
  alarms: Alarm[];
  sessions: StudySession[];
  assignments: Assignment[];
  widgets: DashboardWidget[];
  themeMode: 'dark' | 'light';
}
