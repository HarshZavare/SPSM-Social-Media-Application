import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, MessageSquareLock, Upload, Settings, Activity,
  LogOut, Menu, X, User, Lock, Home, Users, Sparkles
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/feed', label: 'Feed', icon: Sparkles },
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/friends', label: 'Friends', icon: Users },
    { path: '/messages', label: 'Messages', icon: MessageSquareLock },
    { path: '/upload', label: 'Files', icon: Upload },
    { path: '/privacy', label: 'Privacy', icon: Settings },
    { path: '/security-logs', label: 'Security', icon: Activity },
  ];

  if (!isAuthenticated) return null;

  return (
    <nav className="glass-strong sticky top-0 z-50 border-b border-navy-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center
                            group-hover:shadow-lg group-hover:shadow-electric/20 transition-all duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">SPSM</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-electric/15 text-electric glow-sm'
                      : 'text-navy-300 hover:text-navy-100 hover:bg-navy-700/50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                         text-sm text-navy-300 hover:text-navy-100 hover:bg-navy-700/50 transition-all"
            >
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{user?.username || 'User'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                         text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-navy-300 hover:text-navy-100 hover:bg-navy-700/50"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-navy-700/50 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-electric/15 text-electric'
                      : 'text-navy-300 hover:bg-navy-700/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
