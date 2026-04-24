import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, UserPlus, Check, X, Clock, Loader2, UserCheck } from 'lucide-react';

const FriendsPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/friends/users');
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSendRequest = async (friendId) => {
    setActionLoading(friendId);
    try {
      await api.post('/friends/request', { friendId });
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    setActionLoading(requesterId);
    try {
      await api.put('/friends/accept', { requesterId });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requesterId) => {
    setActionLoading(requesterId);
    try {
      await api.post('/friends/reject', { requesterId });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter into categories for better UI structure
  const pendingIncoming = users.filter(u => u.status === 'pending' && u.requester_id === u.id);
  const friendsList = users.filter(u => u.status === 'accepted');
  const otherUsers = users.filter(u => 
    !u.status || (u.status === 'pending' && u.requester_id !== u.id)
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-electric animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
      <div className="bg-orb bg-orb-1" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center glow">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-50">Friends & Network</h1>
          <p className="text-navy-300 text-sm">Connect with others and manage your requests</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="float-right hover:text-rose-200"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-8">
        {/* Pending Incoming Requests */}
        {pendingIncoming.length > 0 && (
          <section className="animate-slide-up">
            <h2 className="text-lg font-semibold text-navy-100 border-b border-navy-700/50 pb-3 mb-4">Pending Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingIncoming.map(u => (
                <div key={u.id} className="glass p-5 rounded-xl flex items-center justify-between border-l-4 border-l-orange-500 hover:border-l-orange-400 transition-all">
                  <div>
                    <p className="font-semibold text-navy-50">{u.display_name || u.username}</p>
                    <p className="text-xs text-navy-400">@{u.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(u.id)}
                      disabled={actionLoading === u.id}
                      className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
                      title="Accept Request"
                    >
                      {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(u.id)}
                      disabled={actionLoading === u.id}
                      className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg transition-colors"
                      title="Reject Request"
                    >
                       <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Friends */}
        {friendsList.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-semibold text-navy-100 border-b border-navy-700/50 pb-3 mb-4">My Friends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendsList.map(u => (
                <div key={u.id} className="glass p-5 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500 hover:bg-navy-800/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy-50">{u.display_name || u.username}</p>
                      <p className="text-xs text-navy-400">@{u.username}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Friends
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discover Users */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-navy-100 border-b border-navy-700/50 pb-3 mb-4">Discover People</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherUsers.length === 0 ? (
              <p className="text-navy-400 text-sm">No other users found on the platform yet.</p>
            ) : (
              otherUsers.map(u => (
                <div key={u.id} className="glass p-5 rounded-xl flex items-center justify-between hover:bg-navy-800/40 transition-all group">
                  <div>
                    <p className="font-semibold text-navy-50">{u.display_name || u.username}</p>
                    <p className="text-xs text-navy-400">@{u.username}</p>
                  </div>
                  
                  {u.status === 'pending' ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Clock className="w-3.5 h-3.5" /> Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(u.id)}
                      disabled={actionLoading === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-electric/10 text-electric hover:bg-electric opacity-80 hover:opacity-100 hover:text-white transition-all transform hover:scale-105 active:scale-95 border border-electric/30"
                    >
                      {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Add
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FriendsPage;
