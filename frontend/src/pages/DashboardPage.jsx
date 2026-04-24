import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Shield, Lock, MessageSquareLock, Upload, Activity, AlertTriangle, Check, Eye, TrendingUp } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [logsRes, alertsRes] = await Promise.all([api.get('/monitoring/logs?limit=5'), api.get('/monitoring/security-alerts')]);
        setRecentLogs(logsRes.data.logs || []); setStats(logsRes.data.stats || []); setAlerts(alertsRes.data.alerts || []);
      } catch (err) { console.error('Dashboard fetch error:', err); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const getEventIcon = (type) => {
    const icons = { LOGIN_SUCCESS: <Check className="w-4 h-4" style={{color:'#24A47F'}} />, LOGIN_FAILED: <AlertTriangle className="w-4 h-4" style={{color:'#D8372A'}} />, LOGOUT: <Lock className="w-4 h-4" style={{color:'#666'}} />, FILE_UPLOAD: <Upload className="w-4 h-4" style={{color:'#3574D6'}} />, MESSAGE_SENT: <MessageSquareLock className="w-4 h-4" style={{color:'#3574D6'}} />, SUSPICIOUS_ACTIVITY: <AlertTriangle className="w-4 h-4" style={{color:'#FE7838'}} />, ACCOUNT_LOCKED: <Lock className="w-4 h-4" style={{color:'#D8372A'}} /> };
    return icons[type] || <Activity className="w-4 h-4" style={{color:'#666'}} />;
  };

  const getEventBg = (type) => {
    if (type.includes('FAILED') || type.includes('LOCKED') || type.includes('SUSPICIOUS')) return { background: '#FFF7F8', borderLeft: '3px solid #D8372A' };
    if (type.includes('SUCCESS') || type.includes('VERIFIED')) return { background: '#ECFAF5', borderLeft: '3px solid #24A47F' };
    return { background: '#FAFAFA', borderLeft: '3px solid #E1E1E1' };
  };

  const features = [
    { icon: Lock, label: 'AES-256-GCM', desc: 'End-to-end encryption', color: '#3574D6', bg: '#ECF3FF' },
    { icon: Shield, label: '2FA Enabled', desc: 'Two-factor auth', color: '#24A47F', bg: '#ECFAF5' },
    { icon: Eye, label: 'Privacy Controls', desc: 'Granular visibility', color: '#15372C', bg: '#EFF1F0' },
    { icon: Activity, label: 'Threat Detection', desc: 'Real-time monitoring', color: '#FE7838', bg: '#FFF6EB' },
  ];

  return (
    <div className="page-container">
      <div className="mb-8 animate-fade-in">
        <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Dashboard</p>
        <h1 className="page-title">Welcome back, {user?.username}</h1>
        <p className="page-subtitle">Your security overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((f, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{animationDelay:`${i*60}ms`}}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{background:f.bg}}>
              <f.icon className="w-5 h-5" style={{color:f.color}} />
            </div>
            <h3 className="text-sm font-semibold" style={{color:'#222'}}>{f.label}</h3>
            <p className="text-xs mt-0.5" style={{color:'#666'}}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2" style={{color:'#222'}}><Activity className="w-4 h-4" style={{color:'#24A47F'}} /> Recent Activity</h2>
              <span className="text-xs" style={{color:'#999'}}>{recentLogs.length} events</span>
            </div>
            {loading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12"/>)}</div> : recentLogs.length > 0 ? (
              <div className="space-y-2">{recentLogs.map((log, i) => (
                <div key={log.id||i} className="flex items-center gap-3 p-3 rounded-lg" style={getEventBg(log.event_type)}>
                  {getEventIcon(log.event_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{color:'#222'}}>{log.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs" style={{color:'#999'}}>{log.ip_address&&`IP: ${log.ip_address} · `}{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}</div>
            ) : (<div className="text-center py-10"><Activity className="w-10 h-10 mx-auto mb-2" style={{color:'#E1E1E1'}} /><p className="text-sm" style={{color:'#999'}}>No recent activity</p></div>)}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4" style={{color:'#222'}}><AlertTriangle className="w-4 h-4" style={{color:'#FE7838'}} /> Security Alerts</h2>
            {alerts.length > 0 ? (
              <div className="space-y-2">{alerts.slice(0,3).map((a,i)=>(
                <div key={i} className="p-3 rounded-lg" style={{background:'#FFF6EB',border:'1px solid #FFECD4'}}>
                  <p className="text-xs font-medium" style={{color:'#B06D00'}}>{a.metadata?.message||'Security event detected'}</p>
                  <p className="text-xs mt-1" style={{color:'#999'}}>{new Date(a.timestamp).toLocaleString()}</p>
                </div>
              ))}</div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{background:'#ECFAF5'}}>
                  <Shield className="w-6 h-6" style={{color:'#24A47F'}} />
                </div>
                <p className="text-sm font-medium" style={{color:'#24A47F'}}>All clear</p>
                <p className="text-xs" style={{color:'#999'}}>No security alerts</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4" style={{color:'#222'}}><TrendingUp className="w-4 h-4" style={{color:'#24A47F'}} /> 30-Day Stats</h2>
            {stats && stats.length > 0 ? (
              <div className="space-y-3">{stats.slice(0,5).map((s,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs" style={{color:'#666'}}>{s.event_type.replace(/_/g,' ')}</span>
                  <span className="text-sm font-mono font-semibold" style={{color:'#222'}}>{s.count}</span>
                </div>
              ))}</div>
            ) : <p className="text-center text-sm" style={{color:'#999'}}>No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
