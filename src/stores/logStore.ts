import { create } from 'zustand';

export type LogStatus = 'pending' | 'success' | 'retrying' | 'failed' | 'queued';

export interface LogEntry {
  id: string;
  timestamp: Date;
  courseId: number;
  courseName: string;
  courseCode: string;
  status: LogStatus;
  message: string;
  retryAttempt?: number;
  maxRetries?: number;
}

interface LogState {
  logEntries: LogEntry[];
  
  // Actions
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  updateLogEntry: (id: string, updates: Partial<LogEntry>) => void;
  clearLogs: () => void;
  getLogEntryByCourseId: (courseId: number) => LogEntry | undefined;
}

export const useLogStore = create<LogState>((set, get) => ({
  logEntries: [],

  addLogEntry: (entry) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `${entry.courseId}-${Date.now()}`,
      timestamp: new Date(),
    };
    
    set((state) => ({
      logEntries: [newEntry, ...state.logEntries]
    }));
  },

  updateLogEntry: (id, updates) => {
    set((state) => ({
      logEntries: state.logEntries.map(entry =>
        entry.id === id
          ? { ...entry, ...updates, timestamp: new Date() }
          : entry
      )
    }));
  },

  clearLogs: () => set({ logEntries: [] }),

  getLogEntryByCourseId: (courseId) => {
    const { logEntries } = get();
    return logEntries.find(entry => entry.courseId === courseId);
  },
}));
