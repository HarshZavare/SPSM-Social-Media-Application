import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Activity, Shield, Filter, Check, AlertTriangle,
  Lock, Upload, LogOut, MessageSquareLock, User, Key, Clock, Share2, Download,
  FileDown, Calendar, X,
} from 'lucide-react';

const SecurityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [exportDate, setExportDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const eventTypes = [
    '', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER',
    'PASSWORD_CHANGE', 'PASSWORD_RESET', 'FILE_UPLOAD', 'FILE_DOWNLOAD',
    'FILE_SHARE', 'FILE_RECEIVED', 'PRIVACY_UPDATE', 'TWO_FA_ENABLED',
    'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'OTP_VERIFIED', 'MESSAGE_SENT',
  ];

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = filter ? `?eventType=${filter}&limit=50` : '?limit=50';
      const res = await api.get(`/monitoring/logs${params}`);
      setLogs(res.data.logs || []);
      setStats(res.data.stats || []);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let params = '';
      if (exportDate) {
        params += `?endDate=${exportDate}`;
      }
      if (filter) {
        params += params ? `&eventType=${filter}` : `?eventType=${filter}`;
      }
      const res = await api.get(`/monitoring/export-csv${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = exportDate || new Date().toISOString().split('T')[0];
      link.setAttribute('download', `security_logs_till_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowExport(false);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const getEventIcon = (type) => {
    const map = {
      LOGIN_SUCCESS: <Check className="w-4 h-4 text-emerald-400" />,
      LOGIN_FAILED: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      LOGOUT: <LogOut className="w-4 h-4 text-navy-400" />,
      REGISTER: <User className="w-4 h-4 text-electric" />,
      PASSWORD_CHANGE: <Key className="w-4 h-4 text-amber-400" />,
      PASSWORD_RESET: <Key className="w-4 h-4 text-amber-400" />,
      PASSWORD_RESET_REQUEST: <Key className="w-4 h-4 text-amber-400" />,
      FILE_UPLOAD: <Upload className="w-4 h-4 text-electric" />,
      FILE_DOWNLOAD: <Upload className="w-4 h-4 text-cyan-accent" />,
      FILE_SHARE: <Share2 className="w-4 h-4 text-violet-400" />,
      FILE_RECEIVED: <Download className="w-4 h-4 text-emerald-400" />,
      PRIVACY_UPDATE: <Shield className="w-4 h-4 text-electric" />,
      TWO_FA_ENABLED: <Lock className="w-4 h-4 text-emerald-400" />,
      ACCOUNT_LOCKED: <Lock className="w-4 h-4 text-rose-400" />,
      SUSPICIOUS_ACTIVITY: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      OTP_VERIFIED: <Check className="w-4 h-4 text-emerald-400" />,
      MESSAGE_SENT: <MessageSquareLock className="w-4 h-4 text-electric" />,
    };
    return map[type] || <Activity className="w-4 h-4 text-navy-400" />;
  };

  const getSeverityBadge = (type) => {
    if (type.includes('FAILED') || type.includes('LOCKED') || type.includes('SUSPICIOUS')) {
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
    if (type.includes('SUCCESS') || type.includes('VERIFIED') || type.includes('ENABLED')) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
    return 'bg-navy-600/30 text-navy-300 border border-navy-600/30';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-50 flex items-center gap-2">
            <Activity className="w-6 h-6 text-electric" />
            Security Logs
          </h1>
          <p className="text-navy-400 text-sm mt-1">Complete audit trail of all security events</p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                   hover:shadow-lg hover:shadow-electric/25 transition-all duration-300"
        >
          <FileDown className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md mx-4 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-navy-50 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-electric" />
                Export Security Logs
              </h2>
              <button onClick={() => setShowExport(false)} className="text-navy-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-navy-400 mb-4">
              Export your security logs as a CSV file. Choose a cut-off date to export logs up to that date.
            </p>

            {/* Date Picker */}
            <div className="mb-4">
              <label className="text-sm text-navy-300 font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-electric" />
                Export logs till date
              </label>
              <input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{ colorScheme: 'dark' }}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-navy-800/80 border border-navy-600/50
                         text-navy-100 text-sm focus:border-electric/50 transition-all cursor-pointer"
              />
              <p className="text-xs text-navy-500 mt-1.5">
                {exportDate
                  ? `Exporting logs till ${new Date(exportDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : 'Leave empty to export all logs'}
              </p>
            </div>

            {/* Current Filter Info */}
            {filter && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-electric/10 border border-electric/20">
                <p className="text-xs text-electric">
                  <Filter className="w-3 h-3 inline mr-1" />
                  Filtered by: {filter.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowExport(false)}
                className="flex-1 py-3 rounded-xl glass text-navy-300 text-sm font-semibold hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="flex-1 py-3 rounded-xl gradient-primary text-white text-sm font-semibold
                         hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50 transition-all
                         flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {stats.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {stats.slice(0, 6).map((stat, i) => (
            <div key={i} className="glass rounded-lg px-4 py-2 flex items-center gap-2 whitespace-nowrap flex-shrink-0">
              {getEventIcon(stat.event_type)}
              <span className="text-xs text-navy-300">{stat.event_type.replace(/_/g, ' ')}</span>
              <span className="text-sm font-bold text-navy-100">{stat.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap">
        <Filter className="w-4 h-4 text-navy-400 flex-shrink-0" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-navy-800/80 border border-navy-600/50 text-navy-200 text-sm
                   rounded-lg px-3 py-2 focus:border-electric/50 transition-all"
        >
          <option value="">All Events</option>
          {eventTypes.filter(Boolean).map(type => (
            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span className="text-xs text-navy-500 ml-auto">
          {logs.length} events found
        </span>
      </div>

      {/* Logs Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-navy-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Event</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">IP Address</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Details</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id || i}
                    className="border-b border-navy-800/30 hover:bg-navy-800/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.event_type)}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(log.event_type)}`}>
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-navy-300">{log.ip_address || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-navy-500 max-w-xs truncate block">
                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-navy-400">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Activity className="w-12 h-12 text-navy-700 mx-auto mb-3" />
            <p className="text-sm text-navy-500">No security logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityLogsPage;
