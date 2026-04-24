import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Shield, Lock, MessageSquareLock, Upload, Activity,
  AlertTriangle, Check, Clock, Eye, TrendingUp, Users
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [logsRes, alertsRes] = await Promise.all([
          api.get('/monitoring/logs?limit=5'),
          api.get('/monitoring/security-alerts'),
        ]);
        setRecentLogs(logsRes.data.logs || []);
        setStats(logsRes.data.stats || []);
        setAlerts(alertsRes.data.alerts || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getEventIcon = (type) => {
    const icons = {
      LOGIN_SUCCESS: <Check className="w-4 h-4 text-emerald-400" />,
      LOGIN_FAILED: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      LOGOUT: <Lock className="w-4 h-4 text-navy-400" />,
      FILE_UPLOAD: <Upload className="w-4 h-4 text-electric" />,
      MESSAGE_SENT: <MessageSquareLock className="w-4 h-4 text-cyan-accent" />,
      SUSPICIOUS_ACTIVITY: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      ACCOUNT_LOCKED: <Lock className="w-4 h-4 text-rose-400" />,
    };
    return icons[type] || <Activity className="w-4 h-4 text-navy-400" />;
  };

  const getEventColor = (type) => {
    if (type.includes('FAILED') || type.includes('LOCKED') || type.includes('SUSPICIOUS')) return 'border-rose-500/30 bg-rose-500/5';
    if (type.includes('SUCCESS') || type.includes('VERIFIED')) return 'border-emerald-500/30 bg-emerald-500/5';
    return 'border-navy-600/30 bg-navy-800/30';
  };

  const securityFeatures = [
    { icon: Lock, label: 'AES-256-GCM', desc: 'End-to-end encryption', color: 'text-electric' },
    { icon: Shield, label: '2FA Enabled', desc: 'Two-factor authentication', color: 'text-emerald-400' },
    { icon: Eye, label: 'Privacy Controls', desc: 'Granular visibility', color: 'text-cyan-accent' },
    { icon: Activity, label: 'Threat Detection', desc: 'Real-time monitoring', color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-navy-50">
          Welcome back, <span className="gradient-text">{user?.username}</span>
        </h1>
        <p className="text-navy-400 text-sm mt-1">Your security dashboard at a glance</p>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {securityFeatures.map((feat, i) => (
          <div
            key={i}
            className="glass rounded-xl p-4 hover:border-electric/30 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <feat.icon className={`w-8 h-8 ${feat.color} mb-3`} />
            <h3 className="text-sm font-semibold text-navy-100">{feat.label}</h3>
            <p className="text-xs text-navy-400 mt-0.5">{feat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-electric" />
                Recent Activity
              </h2>
              <span className="text-xs text-navy-500">{recentLogs.length} events</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-navy-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map((log, i) => (
                  <div
                    key={log.id || i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getEventColor(log.event_type)} transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex-shrink-0">{getEventIcon(log.event_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-200">
                        {log.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-navy-500">
                        {log.ip_address && `IP: ${log.ip_address} • `}
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-navy-600 mx-auto mb-2" />
                <p className="text-navy-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Status */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-navy-100 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Security Alerts
            </h2>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-amber-300">
                      {alert.metadata?.message || 'Security event detected'}
                    </p>
                    <p className="text-xs text-navy-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-sm text-emerald-400">All clear</p>
                <p className="text-xs text-navy-500">No security alerts</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-navy-100 flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-electric" />
              30-Day Stats
            </h2>
            {stats && stats.length > 0 ? (
              <div className="space-y-2">
                {stats.slice(0, 5).map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-navy-400">{stat.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-mono font-semibold text-navy-200">{stat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-navy-500">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
