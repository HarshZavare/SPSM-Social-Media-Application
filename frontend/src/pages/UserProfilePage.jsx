import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  User,
  Heart,
  MessageCircle,
  Clock,
  Calendar,
  Users,
  Grid3X3,
  Info,
  MapPin,
  Send,
  Sparkles,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const UserProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/posts/user/${username}/profile`);
      setProfile(res.data.profile);
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/posts/user/${username}/posts`);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Fetch posts error:', err);
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
            }
          : p
      ));
    } catch (err) {
      console.error('Like error:', err);
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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastSeen = (isOnline, lastActive) => {
    if (isOnline) return 'Online';
    if (!lastActive) return 'Offline';
    const date = new Date(lastActive);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Last seen today at ${timeStr}`;
    if (isYesterday) return `Last seen yesterday at ${timeStr}`;
    return `Last seen ${date.toLocaleDateString()} at ${timeStr}`;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl p-12 text-center">
          <User className="w-12 h-12 text-navy-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy-400">User not found</h3>
          <Link to="/feed" className="mt-4 inline-block text-electric hover:underline text-sm">
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link to="/feed" className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-electric mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      {/* Profile Header */}
      <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            {profile.is_online && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-3 border-navy-900 rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-navy-50">
                {profile.display_name || profile.username}
              </h1>
              <span className="text-sm text-navy-500">@{profile.username}</span>
            </div>

            <p className={`text-xs mb-3 ${profile.is_online ? 'text-emerald-400' : 'text-navy-500'}`}>
              {formatLastSeen(profile.is_online, profile.last_active_at)}
            </p>

            {profile.bio && (
              <p className="text-sm text-navy-300 mb-4 max-w-md">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-6">
              <div className="text-center">
                <p className="text-lg font-bold text-navy-100">{parseInt(profile.posts_count) || 0}</p>
                <p className="text-xs text-navy-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-navy-100">{parseInt(profile.friends_count) || 0}</p>
                <p className="text-xs text-navy-500">Friends</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-navy-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300
            ${activeTab === 'posts'
              ? 'gradient-primary text-white shadow-lg shadow-electric/20'
              : 'glass text-navy-400 hover:text-navy-200'
            }`}
        >
          <Grid3X3 className="w-4 h-4" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300
            ${activeTab === 'about'
              ? 'gradient-primary text-white shadow-lg shadow-electric/20'
              : 'glass text-navy-400 hover:text-navy-200'
            }`}
        >
          <Info className="w-4 h-4" />
          About
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-5 animate-fade-in">
          {posts.length > 0 ? (
            posts.map((post, idx) => (
              <div key={post.id} className="glass rounded-2xl overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}>
                {/* Post Header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-100">{post.display_name || post.username}</p>
                    <p className="text-xs text-navy-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Image */}
                {post.image_url && (
                  <img src={`${API_BASE}${post.image_url}`} alt="Post"
                    className="w-full max-h-[500px] object-cover" loading="lazy" />
                )}

                {/* Actions */}
                <div className="px-5 py-3 flex items-center gap-5">
                  <button onClick={() => handleLike(post.id, post.is_liked)}
                    className="flex items-center gap-1.5 group transition-all">
                    <Heart className={`w-6 h-6 transition-all duration-300 ${
                      post.is_liked ? 'fill-red-500 text-red-500 scale-110' : 'text-navy-300 group-hover:text-red-400'
                    }`} />
                    <span className={`text-sm font-medium ${post.is_liked ? 'text-red-400' : 'text-navy-400'}`}>
                      {parseInt(post.likes_count) || 0}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-navy-400">
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm font-medium">{parseInt(post.comments_count) || 0}</span>
                  </div>
                </div>

                {/* Liked by */}
                {post.recent_likers && post.recent_likers.length > 0 && (
                  <p className="text-xs text-navy-300 px-5 pb-1">
                    <Heart className="w-3 h-3 inline fill-red-500 text-red-500 mr-1" />
                    Liked by{' '}
                    <span className="font-semibold text-navy-100">
                      {post.recent_likers[0].display_name || post.recent_likers[0].username}
                    </span>
                    {parseInt(post.likes_count) > 1 && (
                      <> and <span className="font-semibold text-navy-100">{parseInt(post.likes_count) - 1} others</span></>
                    )}
                  </p>
                )}

                {/* Caption */}
                {post.caption && (
                  <div className="px-5 pb-3">
                    <p className="text-sm text-navy-200">
                      <span className="font-semibold text-navy-100 mr-1.5">{post.username}</span>
                      {post.caption}
                    </p>
                    {post.hashtags && (
                      <p className="text-xs text-electric/70 mt-1">
                        {post.hashtags.split(' ').map(t => (t.startsWith('#') ? t : '#' + t)).join(' ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <Sparkles className="w-10 h-10 text-navy-600 mx-auto mb-3" />
              <p className="text-navy-400 font-medium">No posts yet</p>
            </div>
          )}
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <h2 className="text-lg font-bold text-navy-100 mb-5 flex items-center gap-2">
            <Info className="w-5 h-5 text-electric" />
            About {profile.display_name || profile.username}
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
              <User className="w-5 h-5 text-electric mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-navy-500 mb-0.5">Username</p>
                <p className="text-sm text-navy-100 font-medium">@{profile.username}</p>
              </div>
            </div>

            {profile.display_name && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
                <Sparkles className="w-5 h-5 text-electric mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-navy-500 mb-0.5">Display Name</p>
                  <p className="text-sm text-navy-100 font-medium">{profile.display_name}</p>
                </div>
              </div>
            )}

            {profile.bio && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
                <Info className="w-5 h-5 text-electric mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-navy-500 mb-0.5">Bio</p>
                  <p className="text-sm text-navy-200">{profile.bio}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
              <Calendar className="w-5 h-5 text-electric mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-navy-500 mb-0.5">Member Since</p>
                <p className="text-sm text-navy-100 font-medium">{formatDate(profile.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
              <Grid3X3 className="w-5 h-5 text-electric mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-navy-500 mb-0.5">Total Posts</p>
                <p className="text-sm text-navy-100 font-medium">{parseInt(profile.posts_count) || 0}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
              <Users className="w-5 h-5 text-electric mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-navy-500 mb-0.5">Friends</p>
                <p className="text-sm text-navy-100 font-medium">{parseInt(profile.friends_count) || 0}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${profile.is_online ? 'bg-emerald-500' : 'bg-navy-600'}`} />
              <div>
                <p className="text-xs text-navy-500 mb-0.5">Status</p>
                <p className={`text-sm font-medium ${profile.is_online ? 'text-emerald-400' : 'text-navy-400'}`}>
                  {formatLastSeen(profile.is_online, profile.last_active_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
