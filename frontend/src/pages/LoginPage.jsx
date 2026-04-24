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
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requiresOTP) { setOtpStep(true); setOtpEmail(email); }
      else if (res.data.token) { login(res.data.token, res.data.user); navigate('/feed'); }
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); } finally { setLoading(false); }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: otpEmail, otp, type: 'LOGIN' });
      if (res.data.token) { login(res.data.token, res.data.user); navigate('/feed'); }
    } catch (err) { setError(err.response?.data?.message || 'OTP verification failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: '#15372C' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#24A47F' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>SPSM</span>
          </div>
          <h1 className="text-5xl text-white mb-6 leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Secure your<br />digital social life.
          </h1>
          <p className="text-lg" style={{ color: '#4CB398' }}>
            End-to-end encryption, two-factor authentication, and real-time threat monitoring — all in one platform.
          </p>
        </div>
        <div className="flex items-center gap-8">
          {['AES-256-GCM', '2FA Auth', 'ClamAV Scan', 'Zero Trust'].map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#24A47F' }} />
              <span className="text-sm" style={{ color: '#4CB398' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#FAFAFA' }}>
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#24A47F' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#15372C', fontFamily: "'Instrument Serif', Georgia, serif" }}>SPSM</span>
          </div>

          <h2 className="text-3xl mb-2" style={{ color: '#15372C', fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {otpStep ? 'Verify your identity' : 'Welcome back'}
          </h2>
          <p className="text-sm mb-8" style={{ color: '#666666' }}>
            {otpStep ? 'Enter the verification code sent to your email' : 'Sign in to your secure account'}
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in"
              style={{ background: '#FFF7F8', border: '1px solid #FFE5E3', color: '#D8372A' }}>{error}</div>
          )}

          {!otpStep ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8C8C8' }} />
                  <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8C8C8' }} />
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C8C8C8' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                  <input type="checkbox" className="rounded" style={{ accentColor: '#24A47F' }} /> Remember me
                </label>
                <Link to="/reset-password" className="text-sm font-medium" style={{ color: '#24A47F' }}>Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading} className="btn-green w-full py-2.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerify} className="space-y-5">
              <p className="text-sm" style={{ color: '#666666' }}>Code sent to <strong style={{ color: '#24A47F' }}>{otpEmail}</strong></p>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Verification code</label>
                <input id="otp-input" type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000" maxLength={6} required />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-green w-full py-2.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify & Sign in'}
              </button>
              <button type="button" onClick={() => { setOtpStep(false); setOtp(''); }} className="w-full text-sm font-medium" style={{ color: '#666666' }}>← Back to login</button>
            </form>
          )}

          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid #E1E1E1' }}>
            <p className="text-sm" style={{ color: '#666666' }}>
              Don't have an account? <Link to="/register" className="font-semibold" style={{ color: '#24A47F' }}>Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
