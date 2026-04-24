import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, UserPlus, Check, X, Clock, Loader2, UserCheck } from 'lucide-react';

const FriendsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = async ()=>{try{const r=await api.get('/friends/users');setUsers(r.data.users);}catch(e){setError(e.response?.data?.message||'Failed');}finally{setLoading(false);}};
  useEffect(()=>{fetchUsers();},[]);

  const handleSend = async (id)=>{setActionLoading(id);try{await api.post('/friends/request',{friendId:id});await fetchUsers();}catch(e){setError(e.response?.data?.message||'Failed');}finally{setActionLoading(null);}};
  const handleAccept = async (id)=>{setActionLoading(id);try{await api.put('/friends/accept',{requesterId:id});await fetchUsers();}catch(e){setError(e.response?.data?.message||'Failed');}finally{setActionLoading(null);}};
  const handleReject = async (id)=>{setActionLoading(id);try{await api.post('/friends/reject',{requesterId:id});await fetchUsers();}catch(e){setError(e.response?.data?.message||'Failed');}finally{setActionLoading(null);}};

  const pending = users.filter(u=>u.status==='pending'&&u.requester_id===u.id);
  const friends = users.filter(u=>u.status==='accepted');
  const others = users.filter(u=>!u.status||(u.status==='pending'&&u.requester_id!==u.id));

  if (loading) return (<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{color:'#24A47F'}}/></div>);

  return (
    <div className="page-container">
      <div className="mb-8 animate-fade-in">
        <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Network</p>
        <h1 className="page-title">Friends</h1>
        <p className="page-subtitle">Connect with others and manage requests</p>
      </div>

      {error&&<div className="mb-6 p-3 rounded-lg text-sm flex items-center justify-between" style={{background:'#FFF7F8',border:'1px solid #FFE5E3',color:'#D8372A'}}>{error}<button onClick={()=>setError('')}><X className="w-4 h-4"/></button></div>}

      <div className="space-y-8">
        {pending.length>0&&(
          <section className="animate-slide-up">
            <h2 className="text-sm font-semibold uppercase tracking-wider pb-3 mb-4" style={{color:'#526B63',borderBottom:'1px solid #E1E1E1'}}>Pending Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map(u=>(
                <div key={u.id} className="card p-4 flex items-center justify-between" style={{borderLeft:'3px solid #FE7838'}}>
                  <div><p className="font-semibold text-sm" style={{color:'#222'}}>{u.display_name||u.username}</p><p className="text-xs" style={{color:'#999'}}>@{u.username}</p></div>
                  <div className="flex gap-2">
                    <button onClick={()=>handleAccept(u.id)} disabled={actionLoading===u.id} className="p-2 rounded-lg transition-colors" style={{background:'#ECFAF5',color:'#24A47F'}}>{actionLoading===u.id?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}</button>
                    <button onClick={()=>handleReject(u.id)} disabled={actionLoading===u.id} className="p-2 rounded-lg transition-colors" style={{background:'#FFF7F8',color:'#D8372A'}}><X className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {friends.length>0&&(
          <section className="animate-slide-up" style={{animationDelay:'80ms'}}>
            <h2 className="text-sm font-semibold uppercase tracking-wider pb-3 mb-4" style={{color:'#526B63',borderBottom:'1px solid #E1E1E1'}}>My Friends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(u=>(
                <div key={u.id} className="card p-4 flex items-center justify-between" style={{borderLeft:'3px solid #24A47F'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:'#ECFAF5'}}><UserCheck className="w-4 h-4" style={{color:'#24A47F'}}/></div>
                    <div><p className="font-semibold text-sm" style={{color:'#222'}}>{u.display_name||u.username}</p><p className="text-xs" style={{color:'#999'}}>@{u.username}</p></div>
                  </div>
                  <span className="badge badge-success">Friends</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="animate-slide-up" style={{animationDelay:'160ms'}}>
          <h2 className="text-sm font-semibold uppercase tracking-wider pb-3 mb-4" style={{color:'#526B63',borderBottom:'1px solid #E1E1E1'}}>Discover People</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.length===0?<p className="text-sm" style={{color:'#999'}}>No other users found yet.</p>:others.map(u=>(
              <div key={u.id} className="card p-4 flex items-center justify-between">
                <div><p className="font-semibold text-sm" style={{color:'#222'}}>{u.display_name||u.username}</p><p className="text-xs" style={{color:'#999'}}>@{u.username}</p></div>
                {u.status==='pending'?<span className="badge badge-warning"><Clock className="w-3 h-3"/> Sent</span>:(
                  <button onClick={()=>handleSend(u.id)} disabled={actionLoading===u.id} className="btn-green py-2 px-3 text-sm">
                    {actionLoading===u.id?<Loader2 className="w-4 h-4 animate-spin"/>:<UserPlus className="w-4 h-4"/>}Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FriendsPage;
