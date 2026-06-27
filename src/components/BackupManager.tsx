import React, { useRef, useState } from 'react';
import { StudentBackupData } from '../types';
import { Download, Upload, LogIn, LogOut, CheckCircle2, ShieldAlert, FileJson, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';

interface BackupManagerProps {
  currentData: StudentBackupData;
  onImportBackup: (importedData: StudentBackupData) => void;
  user: User | null;
  googleToken: string | null;
  isLoggingIn: boolean;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
}

export default function BackupManager({
  currentData,
  onImportBackup,
  user,
  googleToken,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout
}: BackupManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Export JSON file
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(currentData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `academic_dashboard_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export local backup.');
    }
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);

        // Basic verification
        if (
          parsedData &&
          Array.isArray(parsedData.classes) &&
          Array.isArray(parsedData.alarms) &&
          Array.isArray(parsedData.assignments) &&
          Array.isArray(parsedData.sessions)
        ) {
          const confirmOverwrite = window.confirm(
            'Valid backup file detected. Overwrite current academic schedule, assignments, and logged study sessions with this backup?'
          );
          if (confirmOverwrite) {
            onImportBackup(parsedData);
            alert('Backup restored successfully!');
          }
        } else {
          setImportError('Invalid backup schema. The JSON file must contain classes, alarms, assignments, and study sessions.');
        }
      } catch (err: any) {
        setImportError(`Failed to parse backup file: ${err.message || err}`);
      }
    };

    fileReader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="backup-manager-widget" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-indigo-400" />
          Backup & Account Synchronization
        </h3>
        <p className="text-xs text-slate-400 mt-1">Export local revisions offline or sync calendar events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offline Backup Panel */}
        <div className="p-5 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              Offline Data Backup
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All your timetables, exam alerts, pomodoro study histories, and task schedules are automatically cached offline in your browser. You can export a secure `.json` file to back up your data locally or migrate to another device.
            </p>
            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-start gap-1.5 mb-4 leading-normal">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Backup
            </button>
            <button
              onClick={triggerFileInput}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Import Backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Cloud Calendar Sync / Auth Panel */}
        <div className="p-5 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              Google Calendar Sync
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Connect your Google Workspace Account to synchronize study deadlines and assignments directly to your Google Calendar schedule. Synced events automatically schedule push alerts on your phone!
            </p>

            {user ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-emerald-400">Authenticated & Secure</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-950/60 text-slate-500 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Calendar Sync Off</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Log in to enable Google Workspace calendar exports.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            {user ? (
              <button
                onClick={onGoogleLogout}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition-all w-full cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Disconnect Google Sync
              </button>
            ) : (
              /* Google Sign-in Official Styled Button as requested by guidelines */
              <button
                onClick={onGoogleLogin}
                disabled={isLoggingIn}
                className={`gsi-material-button w-full cursor-pointer transition-all ${isLoggingIn ? 'opacity-50 pointer-events-none' : ''}`}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #747775',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  color: '#1f1f1f',
                  cursor: 'pointer',
                  fontFamily: '"Roboto", arial, sans-serif',
                  fontSize: '14px',
                  height: '40px',
                  letterSpacing: '0.25px',
                  outline: 'none',
                  overflow: 'hidden',
                  padding: '0 12px',
                  position: 'relative',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', height: '18px', width: '18px', marginRight: '10px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span style={{ fontWeight: 500 }}>{isLoggingIn ? 'Connecting...' : 'Connect Google Workspace'}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
