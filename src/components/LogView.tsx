import React from 'react';
import { useLogStore, type LogEntry, type LogStatus } from '../stores/logStore';

const LogView: React.FC = () => {
  const { logEntries, clearLogs } = useLogStore();

  const getStatusColor = (status: LogStatus): string => {
    switch (status) {
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'retrying':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'queued':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: LogStatus) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'retrying':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'queued':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRetryInfo = (entry: LogEntry): string => {
    if (entry.status === 'retrying' && entry.retryAttempt && entry.maxRetries) {
      return ` (${entry.retryAttempt}/${entry.maxRetries})`;
    }
    return '';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Registration Log</h2>
          {logEntries.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Clear Log
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {logEntries.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No registration activity yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Actions will appear here as you register for courses
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logEntries.map((entry) => (
              <div key={entry.id} className="px-6 py-3 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(entry.status)}`}>
                    {getStatusIcon(entry.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.courseName} ({entry.courseCode})
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status.toUpperCase()}{getRetryInfo(entry)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {entry.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Statistics */}
      {logEntries.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Total: {logEntries.length} entries
            </span>
            <div className="space-x-4">
              <span>Success: {logEntries.filter(e => e.status === 'success').length}</span>
              <span>Failed: {logEntries.filter(e => e.status === 'failed').length}</span>
              <span>Pending: {logEntries.filter(e => e.status === 'pending' || e.status === 'retrying').length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogView;
