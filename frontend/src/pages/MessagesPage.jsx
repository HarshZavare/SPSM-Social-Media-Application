import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { MessageSquareLock, Send, Lock, Search, User, Shield, Check, CheckCheck } from 'lucide-react';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchId, setSearchId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    // Ping to keep 'Online' status alive
    api.post('/auth/ping').catch(() => {});
    
    const convInterval = setInterval(() => {
      fetchConversations();
    }, 3000); // 3 seconds interval for real-time status
    
    const pingInterval = setInterval(() => {
      api.post('/auth/ping').catch(() => {});
    }, 30000); // 30 seconds interval for ping
    
    return () => {
      clearInterval(convInterval);
      clearInterval(pingInterval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const formatLastSeen = (timestamp, isOnline) => {
    if (isOnline) return 'Online';
    if (!timestamp) return 'Status hidden';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Last seen today at ${timeString}`;
    if (isYesterday) return `Last seen yesterday at ${timeString}`;
    
    return `Last seen ${date.toLocaleDateString()} at ${timeString}`;
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  useEffect(() => {
    if (!selectedUser) return;
    const msgInterval = setInterval(async () => {
      try {
        const res = await api.get(`/messages/get/${selectedUser.id}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        // Silently fail polling
      }
    }, 2000);
    return () => clearInterval(msgInterval);
  }, [selectedUser]);

  const selectConversation = async (userId, username) => {
    setSelectedUser({ id: userId, username });
    setLoading(true);
    try {
      const res = await api.get(`/messages/get/${userId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setSendingMsg(true);
    try {
      await api.post('/messages/send', {
        receiverId: selectedUser.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      // Refresh messages
      const res = await api.get(`/messages/get/${selectedUser.id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSendingMsg(false);
    }
  };

    const startNewChat = () => {
    // No-op, search is now a local filter
  };

  const filteredConversations = conversations.filter(conv => 
    (conv.other_username && conv.other_username.toLowerCase().includes(searchId.toLowerCase())) ||
    (conv.other_display_name && conv.other_display_name.toLowerCase().includes(searchId.toLowerCase()))
  );

  const activeConv = conversations.find(c => c.other_user_id === selectedUser?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-navy-50 flex items-center gap-2">
          <MessageSquareLock className="w-6 h-6 text-electric" />
          Encrypted Messages
        </h1>
        <p className="text-navy-400 text-sm mt-1">End-to-end encrypted with AES-256-GCM</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-navy-700/50 flex flex-col">
            <div className="p-4 border-b border-navy-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-navy-800/80 border border-navy-600/50
                           text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                  placeholder="Search friends..."
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv, i) => {
                  const isOnline = conv.is_online || formatLastSeen(conv.last_active_at, conv.is_online) === 'Online';
                  return (
                    <button
                      key={conv.other_user_id || i}
                      onClick={() => selectConversation(conv.other_user_id, conv.other_username)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                        hover:bg-navy-700/30 border-b border-navy-800/50
                        ${selectedUser?.id === conv.other_user_id ? 'bg-electric/10 border-l-2 border-l-electric' : ''}`}
                    >
                      <div className="relative w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-navy-900 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-100 truncate">
                          {conv.other_display_name || conv.other_username}
                        </p>
                        <p className="text-xs text-navy-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Encrypted
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageSquareLock className="w-10 h-10 text-navy-600 mx-auto mb-3" />
                  <p className="text-sm text-navy-500">No friends found</p>
                  <p className="text-xs text-navy-600 mt-1">Accept friend requests to start chatting</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-navy-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center relative">
                      <User className="w-5 h-5 text-white" />
                      {activeConv && (activeConv.is_online || formatLastSeen(activeConv.last_active_at, activeConv.is_online) === 'Online') && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-navy-900 rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-100">{selectedUser.username}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> End-to-end encrypted
                        </p>
                        <span className="text-navy-500 text-xs">•</span>
                        <p className="text-xs text-navy-400">
                           {activeConv ? formatLastSeen(activeConv.last_active_at, activeConv.is_online) : 'Status hidden'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Lock className="w-8 h-8 text-electric mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-navy-400">Decrypting messages...</p>
                      </div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <div
                        key={msg.id || i}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                            ${msg.isOwn
                              ? 'gradient-primary text-white rounded-br-md'
                              : 'bg-navy-700/80 text-navy-100 rounded-bl-md border border-navy-600/30'
                            }`}
                        >
                          <p>{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : ''}`}>
                            <Lock className="w-3 h-3 opacity-50" />
                            <span className="text-[10px] flex items-center gap-1 opacity-90">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.isOwn && (
                                msg.status === 'read' ? (
                                  <CheckCheck className="w-4 h-4 text-[#34B7F1]" strokeWidth={2.5} />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-300" strokeWidth={2.5} />
                                )
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Lock className="w-10 h-10 text-navy-600 mx-auto mb-2" />
                        <p className="text-sm text-navy-500">Start an encrypted conversation</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="px-6 py-4 border-t border-navy-700/50">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                               text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                      placeholder="Type an encrypted message..."
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMsg}
                      className="px-4 py-2.5 rounded-xl gradient-primary text-white
                               hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                               transition-all duration-300"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-navy-600 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Messages are encrypted with AES-256-GCM before storage
                  </p>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquareLock className="w-16 h-16 text-navy-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-navy-400">Select a conversation</h3>
                  <p className="text-sm text-navy-500 mt-1">Choose a chat or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
