import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requiresOTP) {
        setOtpStep(true);
        setOtpEmail(email);
      } else if (res.data.token) {
        login(res.data.token, res.data.user);
        navigate('/feed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { email: otpEmail, otp, type: 'LOGIN' });
      if (res.data.token) {
        login(res.data.token, res.data.user);
        navigate('/feed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">SPSM</h1>
          <p className="text-navy-400 text-sm mt-1">Secure Privacy-focused Social Media</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-navy-50 mb-6">
            {otpStep ? 'Verify OTP' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                             text-navy-100 placeholder-navy-500 text-sm
                             focus:border-electric/50 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                             text-navy-100 placeholder-navy-500 text-sm
                             focus:border-electric/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-navy-400">
                  <input type="checkbox" className="rounded border-navy-600 bg-navy-800 text-electric" />
                  Remember me
                </label>
                <Link to="/reset-password" className="text-sm text-electric hover:text-electric-light transition">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                         transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerify} className="space-y-5">
              <p className="text-sm text-navy-300">
                A 6-digit verification code has been sent to <strong className="text-electric">{otpEmail}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">OTP Code</label>
                <input
                  id="otp-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl bg-navy-800/80 border border-navy-600/50
                           text-navy-100 text-center text-2xl tracking-[0.5em] font-mono
                           focus:border-electric/50 transition-all"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                         transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpStep(false); setOtp(''); }}
                className="w-full text-sm text-navy-400 hover:text-navy-200 transition"
              >
                ← Back to login
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-navy-700/50 text-center">
            <p className="text-sm text-navy-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-electric hover:text-electric-light font-medium transition">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
