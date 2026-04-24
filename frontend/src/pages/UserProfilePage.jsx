import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, Heart, MessageCircle, Clock, Calendar, Users, Grid3X3, Info, Sparkles, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const UserProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile,setProfile]=useState(null);const [posts,setPosts]=useState([]);const [activeTab,setActiveTab]=useState('posts');const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{try{const r=await api.get(`/posts/user/${username}/profile`);setProfile(r.data.profile);}catch(e){}finally{setLoading(false);}})();(async()=>{try{const r=await api.get(`/posts/user/${username}/posts`);setPosts(r.data.posts||[]);}catch(e){}})();},[username]);

  const handleLike=async(id,liked)=>{try{if(liked)await api.post(`/posts/${id}/unlike`);else await api.post(`/posts/${id}/like`);setPosts(posts.map(p=>p.id===id?{...p,is_liked:!liked,likes_count:liked?parseInt(p.likes_count)-1:parseInt(p.likes_count)+1}:p));}catch(e){}};
  const formatTime=(ts)=>{const d=new Date(ts),now=new Date(),diff=(now-d)/1000;if(diff<60)return'Now';if(diff<3600)return`${Math.floor(diff/60)}m`;if(diff<86400)return`${Math.floor(diff/3600)}h`;return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});};
  const formatDate=(ts)=>new Date(ts).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const formatLastSeen=(on,la)=>{if(on)return'Online';if(!la)return'Offline';const d=new Date(la),now=new Date(),t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});if(d.toDateString()===now.toDateString())return`Today at ${t}`;const y=new Date(now);y.setDate(now.getDate()-1);if(d.toDateString()===y.toDateString())return`Yesterday at ${t}`;return`${d.toLocaleDateString()} at ${t}`;};

  if(loading)return(<div className="max-w-3xl mx-auto px-4 py-8"><div className="skeleton h-48 rounded-xl"/></div>);
  if(!profile)return(<div className="max-w-3xl mx-auto px-4 py-8"><div className="card p-12 text-center"><User className="w-12 h-12 mx-auto mb-4" style={{color:'#E1E1E1'}}/><h3 className="text-lg font-semibold" style={{color:'#666'}}>User not found</h3><Link to="/feed" className="mt-4 inline-block text-sm font-medium" style={{color:'#24A47F'}}>← Back</Link></div></div>);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/feed" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6" style={{color:'#666'}}><ArrowLeft className="w-4 h-4"/> Back to Feed</Link>

      <div className="card p-6 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{background:'#24A47F'}}>
              {profile.avatar_url?<img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover"/>:<User className="w-9 h-9 text-white"/>}
            </div>
            {profile.is_online&&<span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full" style={{background:'#3EC144',border:'3px solid white'}}/>}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1">
              <h1 className="text-2xl" style={{color:'#15372C',fontFamily:"'Instrument Serif', Georgia, serif"}}>{profile.display_name||profile.username}</h1>
              <span className="text-sm" style={{color:'#999'}}>@{profile.username}</span>
            </div>
            <p className="text-xs font-medium mb-3" style={{color:profile.is_online?'#24A47F':'#999'}}>{formatLastSeen(profile.is_online,profile.last_active_at)}</p>
            {profile.bio&&<p className="text-sm mb-3 max-w-md" style={{color:'#666'}}>{profile.bio}</p>}
            <div className="flex items-center justify-center sm:justify-start gap-6">
              <div className="text-center"><p className="text-lg font-semibold" style={{color:'#222'}}>{parseInt(profile.posts_count)||0}</p><p className="text-xs" style={{color:'#999'}}>Posts</p></div>
              <div className="text-center"><p className="text-lg font-semibold" style={{color:'#222'}}>{parseInt(profile.friends_count)||0}</p><p className="text-xs" style={{color:'#999'}}>Friends</p></div>
              <p className="text-xs flex items-center gap-1" style={{color:'#999'}}><Calendar className="w-3 h-3"/> Joined {formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-group mb-6">
        <button onClick={()=>setActiveTab('posts')} className={`tab-item flex items-center justify-center gap-2 ${activeTab==='posts'?'active':''}`}><Grid3X3 className="w-4 h-4"/> Posts</button>
        <button onClick={()=>setActiveTab('about')} className={`tab-item flex items-center justify-center gap-2 ${activeTab==='about'?'active':''}`}><Info className="w-4 h-4"/> About</button>
      </div>

      {activeTab==='posts'&&(
        <div className="space-y-5 animate-fade-in">
          {posts.length>0?posts.map((post,idx)=>(
            <div key={post.id} className="card overflow-hidden animate-slide-up" style={{animationDelay:`${idx*50}ms`}}>
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#24A47F'}}>{post.avatar_url?<img src={post.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover"/>:<User className="w-3.5 h-3.5 text-white"/>}</div>
                <div><p className="text-sm font-medium" style={{color:'#222'}}>{post.display_name||post.username}</p><p className="text-xs flex items-center gap-1" style={{color:'#999'}}><Clock className="w-3 h-3"/>{formatTime(post.created_at)}</p></div>
              </div>
              {post.image_url&&<img src={`${API_BASE}${post.image_url}`} alt="Post" className="w-full max-h-[500px] object-cover" loading="lazy"/>}
              <div className="px-5 py-3 flex items-center gap-5">
                <button onClick={()=>handleLike(post.id,post.is_liked)} className="flex items-center gap-1.5 group">
                  <Heart className={`w-5 h-5 transition-all ${post.is_liked?'scale-110':''}`} style={post.is_liked?{fill:'#D8372A',color:'#D8372A'}:{color:'#999'}} />
                  <span className="text-sm font-medium" style={{color:post.is_liked?'#D8372A':'#666'}}>{parseInt(post.likes_count)||0}</span>
                </button>
                <div className="flex items-center gap-1.5" style={{color:'#666'}}><MessageCircle className="w-5 h-5" style={{color:'#999'}}/><span className="text-sm font-medium">{parseInt(post.comments_count)||0}</span></div>
              </div>
              {post.caption&&<div className="px-5 pb-3"><p className="text-sm" style={{color:'#424242'}}><span className="font-semibold mr-1.5" style={{color:'#222'}}>{post.username}</span>{post.caption}</p>{post.hashtags&&<p className="text-xs mt-1" style={{color:'#24A47F'}}>{post.hashtags.split(' ').map(t=>t.startsWith('#')?t:'#'+t).join(' ')}</p>}</div>}
            </div>
          )):(<div className="card p-12 text-center"><Sparkles className="w-10 h-10 mx-auto mb-3" style={{color:'#E1E1E1'}}/><p className="font-semibold" style={{color:'#666'}}>No posts yet</p></div>)}
        </div>
      )}

      {activeTab==='about'&&(
        <div className="card p-6 animate-fade-in">
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{color:'#222'}}><Info className="w-4 h-4" style={{color:'#24A47F'}}/> About</h2>
          <div className="space-y-2">
            {[{icon:User,label:'Username',value:`@${profile.username}`},profile.display_name&&{icon:Sparkles,label:'Display Name',value:profile.display_name},profile.bio&&{icon:Info,label:'Bio',value:profile.bio},{icon:Calendar,label:'Joined',value:formatDate(profile.created_at)},{icon:Grid3X3,label:'Posts',value:String(parseInt(profile.posts_count)||0)},{icon:Users,label:'Friends',value:String(parseInt(profile.friends_count)||0)}].filter(Boolean).map((item,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{background:'#FAFAFA',border:'1px solid #F3F3F3'}}>
                <item.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color:'#24A47F'}}/>
                <div><p className="text-xs" style={{color:'#999'}}>{item.label}</p><p className="text-sm font-medium" style={{color:'#222'}}>{item.value}</p></div>
              </div>
            ))}
            <div className="flex items-start gap-3 p-3 rounded-lg" style={{background:'#FAFAFA',border:'1px solid #F3F3F3'}}>
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{background:profile.is_online?'#3EC144':'#C8C8C8'}}/>
              <div><p className="text-xs" style={{color:'#999'}}>Status</p><p className="text-sm font-medium" style={{color:profile.is_online?'#24A47F':'#666'}}>{formatLastSeen(profile.is_online,profile.last_active_at)}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
