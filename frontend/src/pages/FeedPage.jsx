import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Heart, MessageCircle, Send, Plus, X, Image as ImageIcon, Sparkles, Clock, User, Hash, Loader2, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => { fetchFeed(); const i = setInterval(fetchFeedSilent, 5000); return () => clearInterval(i); }, []);

  const fetchFeed = async () => { try { const r = await api.get('/posts/feed'); setPosts(r.data.posts || []); } catch (e) {} finally { setLoading(false); } };
  const fetchFeedSilent = async () => { try { const r = await api.get('/posts/feed'); setPosts(r.data.posts || []); } catch (e) {} };

  const handleImageSelect = (e) => { const f = e.target.files[0]; if (f) { setImageFile(f); const r = new FileReader(); r.onloadend = () => setImagePreview(r.result); r.readAsDataURL(f); } };

  const handleCreatePost = async (e) => {
    e.preventDefault(); if (!caption.trim() && !imageFile) return; setCreating(true);
    try { const fd = new FormData(); fd.append('caption', caption.trim()); fd.append('hashtags', hashtags.trim()); if (imageFile) fd.append('image', imageFile);
      await api.post('/posts/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCaption(''); setHashtags(''); setImageFile(null); setImagePreview(null); setShowCreate(false); fetchFeed();
    } catch (e) {} finally { setCreating(false); }
  };

  const handleLike = async (postId, isLiked) => {
    try { if (isLiked) await api.post(`/posts/${postId}/unlike`); else await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: !isLiked, likes_count: isLiked ? parseInt(p.likes_count)-1 : parseInt(p.likes_count)+1, recent_likers: isLiked ? p.recent_likers.filter(l=>l.username!==user.username) : [{username:user.username,display_name:user.display_name},...p.recent_likers].slice(0,3) } : p));
    } catch (e) {}
  };

  const toggleComments = async (postId) => { const x = expandedComments[postId]; setExpandedComments({...expandedComments,[postId]:!x}); if (!x) await refreshComments(postId); };
  const refreshComments = async (postId) => { setLoadingComments({...loadingComments,[postId]:true}); try { const r = await api.get(`/posts/${postId}/comments`); setComments({...comments,[postId]:r.data.comments||[]}); } catch (e) {} finally { setLoadingComments({...loadingComments,[postId]:false}); } };

  const handleComment = async (postId) => {
    const t = commentText[postId]; if (!t?.trim()) return; const reply = replyingTo[postId];
    try { await api.post(`/posts/${postId}/comment`, { content: t.trim(), parent_id: reply?.commentId || null }); setCommentText({...commentText,[postId]:''}); setReplyingTo({...replyingTo,[postId]:null}); setPosts(posts.map(p => p.id === postId ? {...p,comments_count:parseInt(p.comments_count)+1} : p)); await refreshComments(postId); } catch (e) {}
  };

  const handleCommentLike = async (postId, commentId, isLiked) => { try { if (isLiked) await api.post(`/posts/comments/${commentId}/unlike`); else await api.post(`/posts/comments/${commentId}/like`); await refreshComments(postId); } catch (e) {} };

  const formatTime = (ts) => { const d=new Date(ts),now=new Date(),diff=(now-d)/1000; if(diff<60)return'Just now';if(diff<3600)return`${Math.floor(diff/60)}m`;if(diff<86400)return`${Math.floor(diff/3600)}h`;return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); };

  const renderLikedBy = (post) => { const c=parseInt(post.likes_count)||0,l=post.recent_likers||[];if(c===0)return null;const n=l.map(x=>x.display_name||x.username);let t='';if(c===1)t=n[0]||'1 person';else if(c===2)t=`${n[0]} and ${n[1]||'1 other'}`;else t=`${n[0]} and ${c-1} others`;return(<p className="text-xs px-5 pb-1" style={{color:'#666'}}><Heart className="w-3 h-3 inline mr-1" style={{fill:'#D8372A',color:'#D8372A'}} />Liked by <span className="font-semibold" style={{color:'#222'}}>{t}</span></p>); };

  const renderComment = (c, postId, isReply=false) => (
    <div key={c.id} className={`flex gap-2.5 ${isReply?'ml-8':''}`}>
      <div className={`${isReply?'w-6 h-6':'w-7 h-7'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`} style={{background:'#24A47F'}}>
        <User className={`${isReply?'w-3 h-3':'w-3.5 h-3.5'} text-white`} />
      </div>
      <div className="flex-1">
        <p className="text-sm" style={{color:'#424242'}}><span className="font-semibold mr-1.5" style={{color:'#222'}}>{c.display_name||c.username}</span>{c.content}</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs" style={{color:'#C8C8C8'}}>{formatTime(c.created_at)}</p>
          <button onClick={()=>handleCommentLike(postId,c.id,c.is_liked)} className="flex items-center gap-1 group">
            <Heart className="w-3 h-3 transition-all" style={c.is_liked?{fill:'#D8372A',color:'#D8372A'}:{color:'#C8C8C8'}} />
            {parseInt(c.likes_count)>0&&<span style={{color:c.is_liked?'#D8372A':'#C8C8C8',fontSize:'10px'}}>{c.likes_count}</span>}
          </button>
          {!isReply&&<button onClick={()=>setReplyingTo({...replyingTo,[postId]:{commentId:c.id,username:c.display_name||c.username}})} className="font-medium" style={{color:'#24A47F',fontSize:'11px'}}>Reply</button>}
        </div>
        {!isReply && c.replies && c.replies.length>0 && (
          <div className="mt-2">
            <button onClick={()=>setExpandedReplies({...expandedReplies,[c.id]:!expandedReplies[c.id]})} className="flex items-center gap-1 font-medium" style={{color:'#24A47F',fontSize:'11px'}}>
              {expandedReplies[c.id]?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}{c.replies.length} {c.replies.length===1?'reply':'replies'}
            </button>
            {expandedReplies[c.id]&&<div className="space-y-2.5 mt-2">{c.replies.map(r=>renderComment(r,postId,true))}</div>}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return (<div className="max-w-2xl mx-auto px-4 py-8"><div className="space-y-6">{[1,2,3].map(i=><div key={i} className="skeleton h-80 rounded-xl"/>)}</div></div>);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 animate-fade-in flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Community</p>
          <h1 className="page-title">Feed</h1>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-green"><Plus className="w-4 h-4" /> New Post</button>
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
          <div className="card-elevated w-full max-w-lg mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{color:'#222'}}>Create post</h2>
              <button onClick={()=>{setShowCreate(false);setImagePreview(null);setImageFile(null);}} style={{color:'#999'}}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden"><img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl" /><button type="button" onClick={()=>{setImageFile(null);setImagePreview(null);}} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"><X className="w-4 h-4"/></button></div>
                ) : (
                  <button type="button" onClick={()=>fileInputRef.current?.click()} className="w-full py-12 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors" style={{borderColor:'#E1E1E1',color:'#999'}}>
                    <ImageIcon className="w-8 h-8" /><span className="text-sm">Click to upload an image</span></button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
              <textarea value={caption} onChange={(e)=>setCaption(e.target.value)} placeholder="What's on your mind?" rows={3} className="input-field resize-none mb-3" />
              <div className="relative"><Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#C8C8C8'}} /><input type="text" value={hashtags} onChange={(e)=>setHashtags(e.target.value)} placeholder="Add hashtags" className="input-field pl-10" /></div>
              <button type="submit" disabled={creating||(!caption.trim()&&!imageFile)} className="btn-green w-full mt-5 py-2.5">
                {creating?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}{creating?'Publishing...':'Publish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-5">
        {posts.length > 0 ? posts.map((post, idx) => (
          <div key={post.id} className="card overflow-hidden animate-slide-up" style={{animationDelay:`${idx*50}ms`}}>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Link to={`/user/${post.username}`} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#24A47F'}}>
                {post.avatar_url?<img src={post.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover"/>:<User className="w-4 h-4 text-white"/>}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/user/${post.username}`} className="text-sm font-semibold block" style={{color:'#222'}}>{post.display_name||post.username}</Link>
                <p className="text-xs flex items-center gap-1" style={{color:'#999'}}><Clock className="w-3 h-3"/>{formatTime(post.created_at)}</p>
              </div>
            </div>
            {post.image_url&&<div style={{background:'#F3F3F3'}}><img src={`${API_BASE}${post.image_url}`} alt="Post" className="w-full max-h-[500px] object-cover" loading="lazy"/></div>}
            <div className="px-5 py-3 flex items-center gap-5">
              <button onClick={()=>handleLike(post.id,post.is_liked)} className="flex items-center gap-1.5 group">
                <Heart className={`w-5 h-5 transition-all ${post.is_liked?'scale-110':''}`} style={post.is_liked?{fill:'#D8372A',color:'#D8372A'}:{color:'#999'}} />
                <span className="text-sm font-medium" style={{color:post.is_liked?'#D8372A':'#666'}}>{parseInt(post.likes_count)||0}</span>
              </button>
              <button onClick={()=>toggleComments(post.id)} className="flex items-center gap-1.5 group">
                <MessageCircle className="w-5 h-5" style={{color:'#999'}} />
                <span className="text-sm font-medium" style={{color:'#666'}}>{parseInt(post.comments_count)||0}</span>
              </button>
            </div>
            {renderLikedBy(post)}
            <div className="px-5 pb-3">
              {post.caption&&<p className="text-sm" style={{color:'#424242'}}><Link to={`/user/${post.username}`} className="font-semibold mr-1.5" style={{color:'#222'}}>{post.username}</Link>{post.caption}</p>}
              {post.hashtags&&<p className="text-xs mt-1" style={{color:'#24A47F'}}>{post.hashtags.split(' ').map(t=>(t.startsWith('#')?t:`#${t}`)).join(' ')}</p>}
            </div>
            {expandedComments[post.id] && (
              <div className="px-5 pb-4 pt-3" style={{borderTop:'1px solid #F3F3F3'}}>
                {loadingComments[post.id] ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{color:'#24A47F'}}/></div> : (
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                    {(comments[post.id]||[]).length>0?(comments[post.id]||[]).map(c=>renderComment(c,post.id)):(<p className="text-xs text-center py-2" style={{color:'#999'}}>No comments yet</p>)}
                  </div>
                )}
                {replyingTo[post.id]&&(
                  <div className="flex items-center gap-2 mb-2 px-1"><CornerDownRight className="w-3.5 h-3.5" style={{color:'#24A47F'}} /><span className="text-xs" style={{color:'#666'}}>Replying to <span className="font-semibold" style={{color:'#24A47F'}}>{replyingTo[post.id].username}</span></span><button onClick={()=>setReplyingTo({...replyingTo,[post.id]:null})} className="ml-auto" style={{color:'#C8C8C8'}}><X className="w-3 h-3"/></button></div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={commentText[post.id]||''} onChange={(e)=>setCommentText({...commentText,[post.id]:e.target.value})} onKeyDown={(e)=>e.key==='Enter'&&handleComment(post.id)} placeholder={replyingTo[post.id]?`Reply to ${replyingTo[post.id].username}...`:'Add a comment...'} className="input-field flex-1 py-2 text-sm" />
                  <button onClick={()=>handleComment(post.id)} disabled={!commentText[post.id]?.trim()} className="btn-green px-3 py-2 disabled:opacity-40"><Send className="w-4 h-4"/></button>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="card p-12 text-center animate-fade-in">
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{color:'#E1E1E1'}} />
            <h3 className="text-lg font-semibold" style={{color:'#666'}}>No posts yet</h3>
            <p className="text-sm mt-1" style={{color:'#999'}}>Be the first to share something!</p>
            <button onClick={()=>setShowCreate(true)} className="btn-green mt-4">Create Post</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
