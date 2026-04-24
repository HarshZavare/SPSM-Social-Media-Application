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

  useEffect(() => { fetchConversations(); api.post('/auth/ping').catch(()=>{}); const c=setInterval(fetchConversations,3000); const p=setInterval(()=>{api.post('/auth/ping').catch(()=>{});},30000); return ()=>{clearInterval(c);clearInterval(p);}; }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages.length]);

  const formatLastSeen = (ts, isOnline) => {
    if (isOnline) return 'Online'; if (!ts) return 'Status hidden';
    const d=new Date(ts),now=new Date(),today=d.toDateString()===now.toDateString(),y=new Date(now);y.setDate(now.getDate()-1);
    const yd=d.toDateString()===y.toDateString(),t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if(today)return`Last seen today at ${t}`;if(yd)return`Last seen yesterday at ${t}`;return`Last seen ${d.toLocaleDateString()} at ${t}`;
  };

  const fetchConversations = async () => { try { const r=await api.get('/messages/conversations'); setConversations(r.data.conversations||[]); } catch(e){} };

  useEffect(() => { if(!selectedUser)return; const i=setInterval(async()=>{try{const r=await api.get(`/messages/get/${selectedUser.id}`);setMessages(r.data.messages||[]);}catch(e){}},2000); return ()=>clearInterval(i); }, [selectedUser]);

  const selectConversation = async (userId,username) => { setSelectedUser({id:userId,username});setLoading(true);try{const r=await api.get(`/messages/get/${userId}`);setMessages(r.data.messages||[]);}catch(e){}finally{setLoading(false);} };
  const sendMessage = async (e) => { e.preventDefault();if(!newMessage.trim()||!selectedUser)return;setSendingMsg(true);try{await api.post('/messages/send',{receiverId:selectedUser.id,content:newMessage.trim()});setNewMessage('');const r=await api.get(`/messages/get/${selectedUser.id}`);setMessages(r.data.messages||[]);}catch(e){}finally{setSendingMsg(false);} };

  const filtered = conversations.filter(c=>(c.other_username&&c.other_username.toLowerCase().includes(searchId.toLowerCase()))||(c.other_display_name&&c.other_display_name.toLowerCase().includes(searchId.toLowerCase())));
  const activeConv = conversations.find(c=>c.other_user_id===selectedUser?.id);

  return (
    <div className="page-container">
      <div className="mb-6 animate-fade-in">
        <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Messaging</p>
        <h1 className="page-title">Encrypted Messages</h1>
        <p className="page-subtitle">End-to-end encrypted with AES-256-GCM</p>
      </div>
      <div className="card overflow-hidden" style={{height:'calc(100vh - 220px)'}}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-72 flex flex-col" style={{borderRight:'1px solid #E1E1E1'}}>
            <div className="p-3" style={{borderBottom:'1px solid #E1E1E1'}}>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#C8C8C8'}} /><input type="text" value={searchId} onChange={(e)=>setSearchId(e.target.value)} className="input-field pl-9 py-2 text-sm" placeholder="Search..." /></div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length>0?filtered.map((conv,i)=>{const on=conv.is_online;return(
                <button key={conv.other_user_id||i} onClick={()=>selectConversation(conv.other_user_id,conv.other_username)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{background:selectedUser?.id===conv.other_user_id?'#ECFAF5':'transparent',borderBottom:'1px solid #F3F3F3',borderLeft:selectedUser?.id===conv.other_user_id?'3px solid #24A47F':'3px solid transparent'}}
                  onMouseEnter={(e)=>{if(selectedUser?.id!==conv.other_user_id)e.currentTarget.style.background='#FAFAFA';}}
                  onMouseLeave={(e)=>{if(selectedUser?.id!==conv.other_user_id)e.currentTarget.style.background='transparent';}}>
                  <div className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#24A47F'}}><User className="w-4 h-4 text-white"/>{on&&<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full" style={{background:'#3EC144',border:'2px solid white'}}/>}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{color:'#222'}}>{conv.other_display_name||conv.other_username}</p><p className="text-xs" style={{color:'#999'}}>Encrypted</p></div>
                </button>);}):(
                <div className="text-center py-12 px-4"><MessageSquareLock className="w-10 h-10 mx-auto mb-3" style={{color:'#E1E1E1'}}/><p className="text-sm" style={{color:'#999'}}>No friends found</p></div>
              )}
            </div>
          </div>
          {/* Chat */}
          <div className="flex-1 flex flex-col" style={{background:'#FAFAFA'}}>
            {selectedUser?(
              <>
                <div className="px-5 py-3 flex items-center gap-3" style={{background:'#FFF',borderBottom:'1px solid #E1E1E1'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center relative" style={{background:'#24A47F'}}><User className="w-4 h-4 text-white"/>
                    {activeConv&&activeConv.is_online&&<span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{background:'#3EC144',border:'2px solid white'}}/>}
                  </div>
                  <div><p className="text-sm font-semibold" style={{color:'#222'}}>{selectedUser.username}</p><p className="text-xs flex items-center gap-1.5" style={{color:'#24A47F'}}><Shield className="w-3 h-3"/> E2E encrypted<span style={{color:'#E1E1E1'}}>·</span><span style={{color:'#999'}}>{activeConv?formatLastSeen(activeConv.last_active_at,activeConv.is_online):'Hidden'}</span></p></div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                  {loading?<div className="flex items-center justify-center h-full"><Lock className="w-8 h-8 animate-pulse" style={{color:'#24A47F'}}/></div>:messages.length>0?messages.map((msg,i)=>(
                    <div key={msg.id||i} className={`flex ${msg.isOwn?'justify-end':'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 text-sm ${msg.isOwn?'rounded-2xl rounded-br-sm':'rounded-2xl rounded-bl-sm'}`}
                        style={msg.isOwn?{background:'#15372C',color:'#FFF'}:{background:'#FFF',color:'#424242',border:'1px solid #E1E1E1'}}>
                        <p>{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.isOwn?'justify-end':''}`}>
                          <Lock className="w-3 h-3 opacity-40"/><span style={{fontSize:'10px',opacity:0.6}} className="flex items-center gap-1">{new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                            {msg.isOwn&&(msg.status==='read'?<CheckCheck className="w-3.5 h-3.5" style={{color:'#24A47F'}}/>:<Check className="w-3.5 h-3.5"/>)}</span>
                        </div>
                      </div>
                    </div>
                  )):<div className="flex items-center justify-center h-full text-center"><div><Lock className="w-10 h-10 mx-auto mb-2" style={{color:'#E1E1E1'}}/><p className="text-sm" style={{color:'#999'}}>Start an encrypted conversation</p></div></div>}
                  <div ref={messagesEndRef}/>
                </div>
                <form onSubmit={sendMessage} className="px-5 py-3" style={{background:'#FFF',borderTop:'1px solid #E1E1E1'}}>
                  <div className="flex gap-2"><input type="text" value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} className="input-field flex-1" placeholder="Type a message..."/>
                    <button type="submit" disabled={!newMessage.trim()||sendingMsg} className="btn-green px-4 disabled:opacity-40"><Send className="w-4 h-4"/></button></div>
                  <p className="flex items-center gap-1 mt-2" style={{color:'#C8C8C8',fontSize:'10px'}}><Lock className="w-3 h-3"/> Encrypted with AES-256-GCM</p>
                </form>
              </>
            ):(
              <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquareLock className="w-16 h-16 mx-auto mb-4" style={{color:'#E1E1E1'}}/><h3 className="text-lg font-semibold" style={{color:'#666'}}>Select a conversation</h3><p className="text-sm mt-1" style={{color:'#999'}}>Choose a chat or start a new one</p></div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
