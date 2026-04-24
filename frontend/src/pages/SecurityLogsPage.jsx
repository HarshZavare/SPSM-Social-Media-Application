import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Activity, Shield, Filter, Check, AlertTriangle, Lock, Upload, LogOut, MessageSquareLock, User, Key, Clock, Share2, Download, FileDown, Calendar, X } from 'lucide-react';

const SecurityLogsPage = () => {
  const [logs,setLogs]=useState([]);const [stats,setStats]=useState([]);const [filter,setFilter]=useState('');const [loading,setLoading]=useState(true);
  const [showExport,setShowExport]=useState(false);const [exportDate,setExportDate]=useState('');const [exporting,setExporting]=useState(false);

  const eventTypes=['','LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','REGISTER','PASSWORD_CHANGE','PASSWORD_RESET','FILE_UPLOAD','FILE_DOWNLOAD','FILE_SHARE','FILE_RECEIVED','PRIVACY_UPDATE','TWO_FA_ENABLED','ACCOUNT_LOCKED','SUSPICIOUS_ACTIVITY','OTP_VERIFIED','MESSAGE_SENT'];
  useEffect(()=>{(async()=>{setLoading(true);try{const p=filter?`?eventType=${filter}&limit=50`:'?limit=50';const r=await api.get(`/monitoring/logs${p}`);setLogs(r.data.logs||[]);setStats(r.data.stats||[]);}catch(e){}finally{setLoading(false);}})();},[filter]);

  const handleExport=async()=>{setExporting(true);try{let p='';if(exportDate)p+=`?endDate=${exportDate}`;if(filter)p+=p?`&eventType=${filter}`:`?eventType=${filter}`;const r=await api.get(`/monitoring/export-csv${p}`,{responseType:'blob'});const u=window.URL.createObjectURL(new Blob([r.data]));const a=document.createElement('a');a.href=u;a.setAttribute('download',`logs_${exportDate||new Date().toISOString().split('T')[0]}.csv`);document.body.appendChild(a);a.click();a.remove();window.URL.revokeObjectURL(u);setShowExport(false);}catch(e){}finally{setExporting(false);}};

  const getIcon=(t)=>{const m={LOGIN_SUCCESS:<Check className="w-3.5 h-3.5" style={{color:'#24A47F'}}/>,LOGIN_FAILED:<AlertTriangle className="w-3.5 h-3.5" style={{color:'#D8372A'}}/>,LOGOUT:<LogOut className="w-3.5 h-3.5" style={{color:'#666'}}/>,REGISTER:<User className="w-3.5 h-3.5" style={{color:'#3574D6'}}/>,PASSWORD_CHANGE:<Key className="w-3.5 h-3.5" style={{color:'#FE7838'}}/>,PASSWORD_RESET:<Key className="w-3.5 h-3.5" style={{color:'#FE7838'}}/>,PASSWORD_RESET_REQUEST:<Key className="w-3.5 h-3.5" style={{color:'#FE7838'}}/>,FILE_UPLOAD:<Upload className="w-3.5 h-3.5" style={{color:'#3574D6'}}/>,FILE_DOWNLOAD:<Download className="w-3.5 h-3.5" style={{color:'#3574D6'}}/>,FILE_SHARE:<Share2 className="w-3.5 h-3.5" style={{color:'#7B05B2'}}/>,FILE_RECEIVED:<Download className="w-3.5 h-3.5" style={{color:'#24A47F'}}/>,PRIVACY_UPDATE:<Shield className="w-3.5 h-3.5" style={{color:'#3574D6'}}/>,TWO_FA_ENABLED:<Lock className="w-3.5 h-3.5" style={{color:'#24A47F'}}/>,ACCOUNT_LOCKED:<Lock className="w-3.5 h-3.5" style={{color:'#D8372A'}}/>,SUSPICIOUS_ACTIVITY:<AlertTriangle className="w-3.5 h-3.5" style={{color:'#FE7838'}}/>,OTP_VERIFIED:<Check className="w-3.5 h-3.5" style={{color:'#24A47F'}}/>,MESSAGE_SENT:<MessageSquareLock className="w-3.5 h-3.5" style={{color:'#3574D6'}}/>};return m[t]||<Activity className="w-3.5 h-3.5" style={{color:'#666'}}/>;};
  const getBadge=(t)=>{if(t.includes('FAILED')||t.includes('LOCKED')||t.includes('SUSPICIOUS'))return'badge-danger';if(t.includes('SUCCESS')||t.includes('VERIFIED')||t.includes('ENABLED'))return'badge-success';return'badge-neutral';};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Audit</p>
          <h1 className="page-title">Security Logs</h1>
          <p className="page-subtitle">Complete audit trail of all events</p>
        </div>
        <button onClick={()=>setShowExport(true)} className="btn-green"><FileDown className="w-4 h-4"/> Export CSV</button>
      </div>

      {showExport&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
          <div className="card-elevated w-full max-w-md mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold" style={{color:'#222'}}>Export Logs</h2><button onClick={()=>setShowExport(false)} style={{color:'#999'}}><X className="w-5 h-5"/></button></div>
            <div className="mb-4"><label className="text-sm font-medium mb-1.5 flex items-center gap-2" style={{color:'#424242'}}><Calendar className="w-4 h-4" style={{color:'#24A47F'}}/>Export till date</label><input type="date" value={exportDate} onChange={(e)=>setExportDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="input-field mt-2"/><p className="text-xs mt-1" style={{color:'#999'}}>{exportDate?`Till ${new Date(exportDate+'T00:00:00').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`:'Leave empty for all'}</p></div>
            {filter&&<div className="mb-4 px-3 py-2 rounded-lg" style={{background:'#ECFAF5',border:'1px solid #C9F0E6'}}><p className="text-xs" style={{color:'#047957'}}><Filter className="w-3 h-3 inline mr-1"/>Filtered: {filter.replace(/_/g,' ')}</p></div>}
            <div className="flex gap-3"><button onClick={()=>setShowExport(false)} className="btn-outline flex-1">Cancel</button><button onClick={handleExport} disabled={exporting} className="btn-green flex-1">{exporting?<Loader2 className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}{exporting?'Exporting...':'Download'}</button></div>
          </div>
        </div>
      )}

      {stats.length>0&&<div className="flex gap-3 mb-6 overflow-x-auto pb-2">{stats.slice(0,6).map((s,i)=>(<div key={i} className="card px-3 py-2 flex items-center gap-2 whitespace-nowrap flex-shrink-0">{getIcon(s.event_type)}<span className="text-xs" style={{color:'#666'}}>{s.event_type.replace(/_/g,' ')}</span><span className="text-sm font-semibold font-mono" style={{color:'#222'}}>{s.count}</span></div>))}</div>}

      <div className="card p-3 mb-6 flex items-center gap-4 flex-wrap">
        <Filter className="w-4 h-4 flex-shrink-0" style={{color:'#999'}} />
        <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="input-field w-auto py-2 text-sm"><option value="">All Events</option>{eventTypes.filter(Boolean).map(t=>(<option key={t} value={t}>{t.replace(/_/g,' ')}</option>))}</select>
        <span className="text-xs font-medium ml-auto" style={{color:'#999'}}>{logs.length} events</span>
      </div>

      <div className="card overflow-hidden">
        {loading?<div className="p-6 space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="skeleton h-10"/>)}</div>:logs.length>0?(
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{borderBottom:'1px solid #E1E1E1',background:'#FAFAFA'}}>
                <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider" style={{color:'#526B63'}}>Event</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider" style={{color:'#526B63'}}>IP</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider" style={{color:'#526B63'}}>Details</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider" style={{color:'#526B63'}}>Time</th>
              </tr></thead>
              <tbody>{logs.map((log,i)=>(
                <tr key={log.id||i} className="transition-colors" style={{borderBottom:'1px solid #F3F3F3'}}
                  onMouseEnter={(e)=>{e.currentTarget.style.background='#FAFAFA';}} onMouseLeave={(e)=>{e.currentTarget.style.background='transparent';}}>
                  <td className="py-2.5 px-4"><div className="flex items-center gap-2">{getIcon(log.event_type)}<span className={`badge ${getBadge(log.event_type)}`}>{log.event_type.replace(/_/g,' ')}</span></div></td>
                  <td className="py-2.5 px-4"><span className="text-sm font-mono" style={{color:'#666'}}>{log.ip_address||'—'}</span></td>
                  <td className="py-2.5 px-4"><span className="text-xs max-w-xs truncate block" style={{color:'#999'}}>{log.metadata?JSON.stringify(log.metadata).slice(0,60):'—'}</span></td>
                  <td className="py-2.5 px-4"><div className="flex items-center gap-1 text-xs" style={{color:'#666'}}><Clock className="w-3 h-3"/>{new Date(log.timestamp).toLocaleString()}</div></td>
                </tr>))}</tbody>
            </table>
          </div>
        ):(<div className="text-center py-16"><Activity className="w-12 h-12 mx-auto mb-3" style={{color:'#E1E1E1'}}/><p className="text-sm" style={{color:'#999'}}>No logs found</p></div>)}
      </div>
    </div>
  );
};

export default SecurityLogsPage;
