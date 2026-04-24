import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try { const res = await api.get('/notifications'); if (res.data.success) { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount); } } catch (err) { console.error('Failed to fetch notifications', err); }
  };

  useEffect(() => { fetchNotifications(); const i = setInterval(fetchNotifications, 30000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleMarkAsRead = async (id = null, e = null) => { if (e) e.stopPropagation(); try { await api.post('/notifications/read', { notificationId: id }); fetchNotifications(); } catch (err) { console.error('Failed to mark as read', err); } };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) handleMarkAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) navigate(notif.link);
    else if (notif.type === 'friend_request' || notif.type === 'friend_accept') navigate('/friends');
    else if (notif.type === 'new_message') navigate('/messages');
    else if (notif.type === 'new_post') navigate('/feed');
  };

  const formatTime = (d) => {
    const date = new Date(d); const now = new Date(); const m = Math.floor((now - date) / 60000);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (m < 1440) return `${Math.floor(m/60)}h ago`; if (m < 10080) return `${Math.floor(m/1440)}d ago`; return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors" style={{ color: '#424242' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F3F3'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#D8372A', boxShadow: '0 0 0 2px #FFF' }} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl overflow-hidden z-50 animate-scale-in"
          style={{ background: '#FFFFFF', border: '1px solid #E1E1E1', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E1E1E1' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#222222' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={(e) => handleMarkAsRead(null, e)} className="text-xs font-medium flex items-center gap-1" style={{ color: '#24A47F' }}>
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center" style={{ color: '#C8C8C8' }}>
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                  className="p-3.5 flex gap-3 cursor-pointer transition-colors"
                  style={{ background: !notif.is_read ? '#ECFAF5' : 'transparent', borderBottom: '1px solid #F3F3F3' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = !notif.is_read ? '#ECFAF5' : 'transparent'; }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: '#24A47F' }}>
                    {notif.from_username ? notif.from_username.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#222222', fontWeight: !notif.is_read ? 600 : 400 }}>{notif.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{notif.message}</p>
                    <p className="text-xs mt-1" style={{ color: '#C8C8C8' }}>{formatTime(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#24A47F' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
