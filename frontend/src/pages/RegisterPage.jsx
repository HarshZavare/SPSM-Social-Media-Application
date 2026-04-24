import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Check, X } from 'lucide-react';

const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const passwordChecks = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'Number', test: (p) => /[0-9]/.test(p) },
    { label: 'Special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];
  const strength = passwordChecks.filter(c => c.test(form.password)).length;
  const strengthColors = ['#D8372A', '#D8372A', '#FE7838', '#FE7838', '#24A47F', '#24A47F'];
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (strength < 5) return setError('Password does not meet all requirements');
    setLoading(true);
    try { await api.post('/auth/register', { email: form.email, username: form.username, password: form.password }); setSuccess(true); setTimeout(() => navigate('/login'), 3000); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#FAFAFA' }}>
        <div className="card-elevated p-8 max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#ECFAF5' }}>
            <Check className="w-8 h-8" style={{ color: '#24A47F' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#222222' }}>Registration Successful!</h2>
          <p className="text-sm" style={{ color: '#666666' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: '#15372C' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#24A47F' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>SPSM</span>
          </div>
          <h1 className="text-5xl text-white mb-6 leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Join a safer<br />social network.
          </h1>
          <p className="text-lg" style={{ color: '#4CB398' }}>Privacy-first, zero-trust architecture with military-grade encryption.</p>
        </div>
        <div className="flex items-center gap-8">
          {['Open Source', 'No Tracking', 'Full Privacy', 'E2E Encrypted'].map((f, i) => (
            <div key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#24A47F' }} /><span className="text-sm" style={{ color: '#4CB398' }}>{f}</span></div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#FAFAFA' }}>
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#24A47F' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#15372C', fontFamily: "'Instrument Serif', Georgia, serif" }}>SPSM</span>
          </div>

          <h2 className="text-3xl mb-2" style={{ color: '#15372C', fontFamily: "'Instrument Serif', Georgia, serif" }}>Create an account</h2>
          <p className="text-sm mb-8" style={{ color: '#666666' }}>Join the secure social network</p>

          {error && <div className="mb-5 p-3 rounded-lg text-sm animate-fade-in" style={{ background: '#FFF7F8', border: '1px solid #FFE5E3', color: '#D8372A' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Email</label>
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8C8C8' }} />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-10" placeholder="you@example.com" required /></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Username</label>
              <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8C8C8' }} />
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field pl-10" placeholder="johndoe" required /></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Password</label>
              <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8C8C8' }} />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C8C8C8' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
              {form.password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex gap-1">{[1,2,3,4,5].map(i => (<div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= strength ? strengthColors[strength] : '#E1E1E1' }} />))}</div>
                  <p className="text-xs font-medium" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</p>
                  <div className="grid grid-cols-2 gap-1">{passwordChecks.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      {c.test(form.password) ? <Check className="w-3 h-3" style={{ color: '#24A47F' }} /> : <X className="w-3 h-3" style={{ color: '#C8C8C8' }} />}
                      <span style={{ color: c.test(form.password) ? '#424242' : '#C8C8C8' }}>{c.label}</span>
                    </div>))}</div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#424242' }}>Confirm password</label>
              <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8C8C8' }} />
                <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field pl-10 pr-10" placeholder="••••••••" required
                  style={{ borderColor: form.confirmPassword ? (form.confirmPassword === form.password ? '#24A47F' : '#D8372A') : undefined }} />
                {form.confirmPassword && <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {form.confirmPassword === form.password ? <Check className="w-4 h-4" style={{ color: '#24A47F' }} /> : <X className="w-4 h-4" style={{ color: '#D8372A' }} />}
                </span>}</div>
            </div>
            <button type="submit" disabled={loading} className="btn-green w-full py-2.5 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid #E1E1E1' }}>
            <p className="text-sm" style={{ color: '#666666' }}>Already have an account? <Link to="/login" className="font-semibold" style={{ color: '#24A47F' }}>Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
