import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Heart,
  MessageCircle,
  Send,
  Plus,
  X,
  Image as ImageIcon,
  Sparkles,
  Clock,
  User,
  Hash,
  Loader2,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
  const [replyingTo, setReplyingTo] = useState({}); // { postId: { commentId, username } }
  const [expandedReplies, setExpandedReplies] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFeed();
    const feedInterval = setInterval(() => {
      fetchFeedSilent();
    }, 5000);
    return () => clearInterval(feedInterval);
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts/feed');
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Fetch feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedSilent = async () => {
    try {
      const res = await api.get('/posts/feed');
      setPosts(res.data.posts || []);
    } catch (err) {}
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !imageFile) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption.trim());
      formData.append('hashtags', hashtags.trim());
      if (imageFile) formData.append('image', imageFile);
      await api.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCaption('');
      setHashtags('');
      setImageFile(null);
      setImagePreview(null);
      setShowCreate(false);
      fetchFeed();
    } catch (err) {
      console.error('Create post error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await api.post(`/posts/${postId}/unlike`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      setPosts(posts.map(p =>
        p.id === postId
          ? {
              ...p,
              is_liked: !isLiked,
              likes_count: isLiked ? parseInt(p.likes_count) - 1 : parseInt(p.likes_count) + 1,
              recent_likers: isLiked
                ? p.recent_likers.filter(l => l.username !== user.username)
                : [{ username: user.username, display_name: user.display_name }, ...p.recent_likers].slice(0, 3),
            }
          : p
      ));
    } catch (err) {
      console.error('Like/unlike error:', err);
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: !isExpanded });
    if (!isExpanded) {
      await refreshComments(postId);
    }
  };

  const refreshComments = async (postId) => {
    setLoadingComments({ ...loadingComments, [postId]: true });
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data.comments || [] });
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    const reply = replyingTo[postId];
    try {
      await api.post(`/posts/${postId}/comment`, {
        content: text.trim(),
        parent_id: reply?.commentId || null,
      });
      setCommentText({ ...commentText, [postId]: '' });
      setReplyingTo({ ...replyingTo, [postId]: null });
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments_count: parseInt(p.comments_count) + 1 } : p
      ));
      await refreshComments(postId);
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleCommentLike = async (postId, commentId, isLiked) => {
    try {
      if (isLiked) {
        await api.post(`/posts/comments/${commentId}/unlike`);
      } else {
        await api.post(`/posts/comments/${commentId}/like`);
      }
      await refreshComments(postId);
    } catch (err) {
      console.error('Comment like error:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderLikedBy = (post) => {
    const count = parseInt(post.likes_count) || 0;
    const likers = post.recent_likers || [];
    if (count === 0) return null;

    const names = likers.map(l => l.display_name || l.username);
    let text = '';
    if (count === 1) {
      text = names[0] || '1 person';
    } else if (count === 2) {
      text = `${names[0]} and ${names[1] || '1 other'}`;
    } else {
      text = `${names[0]} and ${count - 1} others`;
    }

    return (
      <p className="text-xs text-navy-300 px-5 pb-1">
        <Heart className="w-3 h-3 inline fill-red-500 text-red-500 mr-1" />
        Liked by <span className="font-semibold text-navy-100">{text}</span>
      </p>
    );
  };

  const renderComment = (c, postId, isReply = false) => (
    <div key={c.id} className={`flex gap-2.5 ${isReply ? 'ml-8' : ''}`}>
      <div className={`${isReply ? 'w-6 h-6' : 'w-7 h-7'} rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <User className={`${isReply ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white`} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-navy-200">
          <span className="font-semibold text-navy-100 mr-1.5">{c.display_name || c.username}</span>
          {c.content}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[10px] text-navy-500">{formatTime(c.created_at)}</p>
          <button
            onClick={() => handleCommentLike(postId, c.id, c.is_liked)}
            className="flex items-center gap-1 group"
          >
            <Heart className={`w-3 h-3 transition-all ${c.is_liked ? 'fill-red-500 text-red-500' : 'text-navy-500 group-hover:text-red-400'}`} />
            {parseInt(c.likes_count) > 0 && (
              <span className={`text-[10px] ${c.is_liked ? 'text-red-400' : 'text-navy-500'}`}>{c.likes_count}</span>
            )}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyingTo({
                ...replyingTo,
                [postId]: { commentId: c.id, username: c.display_name || c.username },
              })}
              className="text-[10px] text-navy-500 hover:text-electric font-semibold transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Replies toggle */}
        {!isReply && c.replies && c.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setExpandedReplies({ ...expandedReplies, [c.id]: !expandedReplies[c.id] })}
              className="text-[11px] text-electric/70 hover:text-electric flex items-center gap-1 font-medium transition-colors"
            >
              {expandedReplies[c.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            {expandedReplies[c.id] && (
              <div className="space-y-2.5 mt-2">
                {c.replies.map(r => renderComment(r, postId, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl h-96 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-50 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-electric" />
            Feed
          </h1>
          <p className="text-navy-400 text-sm mt-1">See what your community is sharing</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                   hover:shadow-lg hover:shadow-electric/25 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-lg mx-4 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-navy-50 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-electric" />
                Create Post
              </h2>
              <button onClick={() => { setShowCreate(false); setImagePreview(null); setImageFile(null); }}
                      className="text-navy-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 rounded-xl border-2 border-dashed border-navy-600/50 hover:border-electric/50
                             text-navy-400 hover:text-electric transition-all duration-300 flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm">Click to upload an image</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..." rows={3}
                className="w-full px-4 py-3 rounded-xl bg-navy-800/80 border border-navy-600/50
                         text-navy-100 placeholder-navy-500 text-sm resize-none focus:border-electric/50 transition-all" />
              <div className="relative mt-3">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)}
                  placeholder="Add hashtags (e.g. photography travel)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                           text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all" />
              </div>
              <button type="submit" disabled={creating || (!caption.trim() && !imageFile)}
                className="mt-5 w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {creating ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post, idx) => (
            <div key={post.id} className="glass rounded-2xl overflow-hidden animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Post Header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <Link to={`/user/${post.username}`} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-electric/50 transition-all">
                  {post.avatar_url ? (
                    <img src={post.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${post.username}`} className="text-sm font-semibold text-navy-100 truncate hover:text-electric transition-colors block">
                    {post.display_name || post.username}
                  </Link>
                  <p className="text-xs text-navy-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="w-full bg-navy-900/50">
                  <img src={`${API_BASE}${post.image_url}`} alt="Post"
                    className="w-full max-h-[500px] object-cover" loading="lazy" />
                </div>
              )}

              {/* Actions */}
              <div className="px-5 py-3 flex items-center gap-5">
                <button onClick={() => handleLike(post.id, post.is_liked)}
                  className="flex items-center gap-1.5 transition-all duration-200 group">
                  <Heart className={`w-6 h-6 transition-all duration-300 ${
                    post.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-navy-300 group-hover:text-red-400'
                  }`} />
                  <span className={`text-sm font-medium ${post.is_liked ? 'text-red-400' : 'text-navy-400'}`}>
                    {parseInt(post.likes_count) || 0}
                  </span>
                </button>
                <button onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-navy-300 hover:text-electric transition-all group">
                  <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-navy-400">
                    {parseInt(post.comments_count) || 0}
                  </span>
                </button>
              </div>

              {/* Liked by */}
              {renderLikedBy(post)}

              {/* Caption & Hashtags */}
              <div className="px-5 pb-3">
                {post.caption && (
                  <p className="text-sm text-navy-200">
                    <Link to={`/user/${post.username}`} className="font-semibold text-navy-100 mr-1.5 hover:text-electric transition-colors">{post.username}</Link>
                    {post.caption}
                  </p>
                )}
                {post.hashtags && (
                  <p className="text-xs text-electric/70 mt-1.5">
                    {post.hashtags.split(' ').map(tag => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ')}
                  </p>
                )}
              </div>

              {/* Comments Section */}
              {expandedComments[post.id] && (
                <div className="px-5 pb-4 border-t border-navy-700/50 pt-3">
                  {loadingComments[post.id] ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-electric animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                      {(comments[post.id] || []).length > 0 ? (
                        (comments[post.id] || []).map(c => renderComment(c, post.id))
                      ) : (
                        <p className="text-xs text-navy-500 text-center py-2">No comments yet. Be the first!</p>
                      )}
                    </div>
                  )}

                  {/* Reply indicator */}
                  {replyingTo[post.id] && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-electric" />
                      <span className="text-xs text-navy-400">
                        Replying to <span className="text-electric font-semibold">{replyingTo[post.id].username}</span>
                      </span>
                      <button onClick={() => setReplyingTo({ ...replyingTo, [post.id]: null })}
                        className="text-navy-500 hover:text-white ml-auto">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <input type="text" value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                      placeholder={replyingTo[post.id] ? `Reply to ${replyingTo[post.id].username}...` : 'Add a comment...'}
                      className="flex-1 px-3 py-2 rounded-lg bg-navy-800/80 border border-navy-600/50
                               text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all" />
                    <button onClick={() => handleComment(post.id)} disabled={!commentText[post.id]?.trim()}
                      className="px-3 py-2 rounded-lg gradient-primary text-white disabled:opacity-40 transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in">
            <Sparkles className="w-12 h-12 text-navy-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-400">No posts yet</h3>
            <p className="text-sm text-navy-500 mt-1">Be the first to share something!</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-4 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                       hover:shadow-lg hover:shadow-electric/25 transition-all duration-300">
              Create Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
