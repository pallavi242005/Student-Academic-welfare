import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logoutUser } from './firebase';
import {
  TimetableClass,
  Alarm,
  Assignment,
  StudySession,
  DashboardWidget,
  StudentBackupData
} from './types';
import {
  DEFAULT_CLASSES,
  DEFAULT_ALARMS,
  DEFAULT_ASSIGNMENTS,
  DEFAULT_WIDGETS,
  DEFAULT_SESSIONS
} from './data/defaults';

// Components
import TimetableWidget from './components/TimetableWidget';
import AssignmentWidget from './components/AssignmentWidget';
import AlarmWidget from './components/AlarmWidget';
import StudyTrackerWidget from './components/StudyTrackerWidget';
import BackupManager from './components/BackupManager';
import DashboardCustomizer from './components/DashboardCustomizer';
import NotificationBanner from './components/NotificationBanner';

// Icons
import {
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  LayoutGrid,
  Settings2,
  CalendarDays,
  Activity,
  Award
} from 'lucide-react';

export default function App() {
  // Theme state
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Firebase / Auth state
  const [user, setUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Core academic state
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Alarm ringing overlay state
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);

  // Customizer visible toggle
  const [showCustomizer, setShowCustomizer] = useState(false);

  // 1. Initial State Loading
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('themeMode');
      if (storedTheme === 'light') {
        setThemeMode('light');
      }

      const storedClasses = localStorage.getItem('classes');
      setClasses(storedClasses ? JSON.parse(storedClasses) : DEFAULT_CLASSES);

      const storedAlarms = localStorage.getItem('alarms');
      setAlarms(storedAlarms ? JSON.parse(storedAlarms) : DEFAULT_ALARMS);

      const storedAssignments = localStorage.getItem('assignments');
      setAssignments(storedAssignments ? JSON.parse(storedAssignments) : DEFAULT_ASSIGNMENTS);

      const storedSessions = localStorage.getItem('sessions');
      setSessions(storedSessions ? JSON.parse(storedSessions) : DEFAULT_SESSIONS);

      const storedWidgets = localStorage.getItem('widgets');
      setWidgets(storedWidgets ? JSON.parse(storedWidgets) : DEFAULT_WIDGETS);
    } catch (err) {
      console.error('Failed to load storage:', err);
    }
  }, []);

  // 2. State Saving
  useEffect(() => {
    if (classes.length > 0) localStorage.setItem('classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    if (alarms.length > 0) localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    if (assignments.length > 0) localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (widgets.length > 0) localStorage.setItem('widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // 3. Initialize Firebase Auth and retrieve Calendar token
  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser, token) => {
        setUser(firebaseUser);
        setGoogleToken(token);
        setIsLoggingIn(false);
      },
      () => {
        setUser(null);
        setGoogleToken(null);
        setIsLoggingIn(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auth triggers
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setGoogleToken(res.accessToken);
      }
    } catch (err) {
      console.error('Auth trigger failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutUser();
    setUser(null);
    setGoogleToken(null);
  };

  // 4. Academic State Modifiers
  const handleAddClass = (newClass: TimetableClass) => {
    setClasses((prev) => [...prev, newClass]);
  };

  const handleDeleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddAlarm = (newAlarm: Alarm) => {
    setAlarms((prev) => [...prev, newAlarm]);
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((al) => (al.id === id ? { ...al, enabled: !al.enabled, triggeredToday: false } : al))
    );
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((al) => al.id !== id));
  };

  const handleAddAssignment = (newAssignment: Assignment) => {
    setAssignments((prev) => [...prev, newAssignment]);
  };

  const handleToggleComplete = (id: string) => {
    setAssignments((prev) =>
      prev.map((as) => (as.id === id ? { ...as, completed: !as.completed } : as))
    );
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((as) => as.id !== id));
  };

  const handleUpdateAssignmentSync = (id: string, googleEventId: string | undefined) => {
    setAssignments((prev) =>
      prev.map((as) => (as.id === id ? { ...as, googleEventId } : as))
    );
  };

  const handleAddSession = (newSession: StudySession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleClearSessions = () => {
    setSessions([]);
    localStorage.removeItem('sessions');
  };

  // 5. Layout customizer state modifiers
  const handleToggleWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleMoveWidget = (id: string, direction: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((w) => w.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Swap order values
    const temp = sorted[index].order;
    sorted[index].order = sorted[targetIndex].order;
    sorted[targetIndex].order = temp;

    setWidgets(sorted);
  };

  // 6. JSON Backup Restore
  const handleImportBackup = (imported: StudentBackupData) => {
    if (imported.classes) setClasses(imported.classes);
    if (imported.alarms) setAlarms(imported.alarms);
    if (imported.assignments) setAssignments(imported.assignments);
    if (imported.sessions) setSessions(imported.sessions);
    if (imported.widgets) setWidgets(imported.widgets);
    if (imported.themeMode) setThemeMode(imported.themeMode);
  };

  const backupDataPayload: StudentBackupData = {
    classes,
    alarms,
    assignments,
    sessions,
    widgets,
    themeMode,
  };

  const sortedVisibleWidgets = [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className={`min-h-screen transition-all duration-300 ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Visual Header */}
      <header className={`border-b transition-all ${themeMode === 'dark' ? 'border-slate-900 bg-slate-900/40' : 'border-slate-200 bg-white/70'} backdrop-blur-md sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center shadow-lg ${themeMode === 'dark' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/10' : 'bg-indigo-600 text-white'}`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wide font-sans flex items-center gap-1.5">
                STUDENT COCKPIT
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">All-In-One Academic Planner & Scheduler</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Customize Dashboard Trigger */}
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showCustomizer
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : themeMode === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Layout Customizer"
            >
              <Settings2 className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Customize Cockpit</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100'
              }`}
              title={themeMode === 'dark' ? 'Activate Light theme' : 'Activate Dark theme'}
            >
              {themeMode === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Warning Notification Banner */}
        <div className="mb-8">
          <NotificationBanner assignments={assignments} alarms={alarms} />
        </div>

        {/* Customizer Slider Panel */}
        {showCustomizer && (
          <div className="mb-8 animate-fade-in">
            <DashboardCustomizer
              widgets={widgets}
              onToggleWidget={handleToggleWidget}
              onMoveWidget={handleMoveWidget}
            />
          </div>
        )}

        {/* Customizable Bento Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {sortedVisibleWidgets.map((widget) => {
            switch (widget.id) {
              case 'timetable':
                return (
                  <div key={widget.id} className="xl:col-span-8 lg:col-span-12">
                    <TimetableWidget
                      classes={classes}
                      onAddClass={handleAddClass}
                      onDeleteClass={handleDeleteClass}
                    />
                  </div>
                );
              case 'assignments':
                return (
                  <div key={widget.id} className="xl:col-span-4 lg:col-span-12">
                    <AssignmentWidget
                      assignments={assignments}
                      onAddAssignment={handleAddAssignment}
                      onToggleComplete={handleToggleComplete}
                      onDeleteAssignment={handleDeleteAssignment}
                      onUpdateAssignmentSync={handleUpdateAssignmentSync}
                      googleToken={googleToken}
                      onTriggerGoogleSignIn={handleGoogleLogin}
                    />
                  </div>
                );
              case 'pomodoro':
                return (
                  <div key={widget.id} className="xl:col-span-6 lg:col-span-12">
                    <StudyTrackerWidget
                      sessions={sessions}
                      onAddSession={handleAddSession}
                      onClearSessions={handleClearSessions}
                    />
                  </div>
                );
              case 'alarms':
                return (
                  <div key={widget.id} className="xl:col-span-6 lg:col-span-12">
                    <AlarmWidget
                      alarms={alarms}
                      onAddAlarm={handleAddAlarm}
                      onToggleAlarm={handleToggleAlarm}
                      onDeleteAlarm={handleDeleteAlarm}
                      activeAlarm={activeAlarm}
                      onTriggerAlarm={setActiveAlarm}
                    />
                  </div>
                );
              case 'backup':
                return (
                  <div key={widget.id} className="xl:col-span-12 lg:col-span-12">
                    <BackupManager
                      currentData={backupDataPayload}
                      onImportBackup={handleImportBackup}
                      user={user}
                      googleToken={googleToken}
                      isLoggingIn={isLoggingIn}
                      onGoogleLogin={handleGoogleLogin}
                      onGoogleLogout={handleGoogleLogout}
                    />
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>

        {/* Empty layout guard */}
        {sortedVisibleWidgets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <LayoutGrid className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
            <h3 className="text-base font-bold text-slate-300">Your dashboard is empty</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-md">Click the "Customize Cockpit" settings button in the top menu to reveal and turn on panels!</p>
            <button
              onClick={() => setShowCustomizer(true)}
              className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/15"
            >
              Reveal Layout Customizer
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 mt-20 text-center text-xs text-slate-600 font-medium">
        <p>© {new Date().getFullYear()} Student Cockpit. Optimized for offline execution with secure Google Cloud synchronization.</p>
      </footer>
    </div>
  );
}
