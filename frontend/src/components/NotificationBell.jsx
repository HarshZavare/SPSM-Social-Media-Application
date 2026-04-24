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
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id = null, e = null) => {
    if (e) e.stopPropagation();
    try {
      await api.post('/notifications/read', { notificationId: id });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    } else {
      // Default fallback navigation based on type
      if (notif.type === 'friend_request' || notif.type === 'friend_accept') navigate('/friends');
      else if (notif.type === 'new_message') navigate('/messages');
      else if (notif.type === 'new_post') navigate('/feed');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-navy-300 hover:text-navy-100 hover:bg-navy-700/50 transition-all duration-200"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-navy-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-strong border border-navy-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="p-4 border-b border-navy-700/50 flex items-center justify-between bg-navy-800/50">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => handleMarkAsRead(null, e)}
                className="text-xs text-electric hover:text-electric-light transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-navy-400">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-700/30">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-navy-700/30 transition-colors cursor-pointer flex gap-3 ${
                      !notif.is_read ? 'bg-navy-800/30' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {notif.from_avatar_url ? (
                        <img src={notif.from_avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-navy-600" />
                      ) : (
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                          {notif.from_username ? notif.from_username.charAt(0).toUpperCase() : <Bell className="w-4 h-4 text-white/70" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'text-white font-medium' : 'text-navy-100'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-navy-300 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-navy-400 mt-1">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-electric flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
