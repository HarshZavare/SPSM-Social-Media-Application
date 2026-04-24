import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, MessageSquareLock, Upload, Settings, Activity,
  LogOut, Menu, X, User, Home, Users, Sparkles
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
    <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E1E1E1' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#24A47F' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold hidden sm:block" style={{ color: '#15372C', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '20px' }}>
              SPSM
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={path} to={path}
                  className="flex items-center gap-1.5 px-3 py-4 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? '#24A47F' : '#666666',
                    borderBottom: isActive ? '2px solid #24A47F' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#15372C'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#666666'; }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <NotificationBell />

            <Link to="/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#424242' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F3F3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#24A47F' }}>
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium">{user?.username || 'User'}</span>
            </Link>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: '#D8372A' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF7F8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>

            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg" style={{ color: '#424242' }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden animate-slide-up" style={{ background: '#FFFFFF', borderTop: '1px solid #E1E1E1' }}>
          <div className="px-4 py-2 space-y-0.5">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive ? '#ECFAF5' : 'transparent',
                    color: isActive ? '#24A47F' : '#666666',
                  }}
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
