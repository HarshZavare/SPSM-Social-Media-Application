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

  const passwordStrength = passwordChecks.filter(c => c.test(form.password)).length;
  const strengthColors = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (passwordStrength < 5) {
      return setError('Password does not meet all requirements');
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email: form.email,
        username: form.username,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-navy-50 mb-2">Registration Successful!</h2>
          <p className="text-navy-400 text-sm mb-4">
            Registration successful. Redirecting to login...
          </p>
          <div className="w-full bg-navy-700 rounded-full h-1">
            <div className="bg-electric h-1 rounded-full animate-[grow_3s_linear]" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
          <p className="text-navy-400 text-sm mt-1">Join the secure social network</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                           text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input
                  id="register-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                           text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                  placeholder="johndoe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                           text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
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

              {/* Password Strength */}
              {form.password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300
                          ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-navy-700'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength >= 4 ? 'text-emerald-400' : passwordStrength >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {strengthLabels[passwordStrength]}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {passwordChecks.map((check, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        {check.test(form.password) ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <X className="w-3 h-3 text-navy-500" />
                        )}
                        <span className={check.test(form.password) ? 'text-navy-300' : 'text-navy-500'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input
                  id="register-confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-navy-800/80 border text-sm
                           text-navy-100 placeholder-navy-500 focus:border-electric/50 transition-all
                    ${form.confirmPassword && form.confirmPassword !== form.password
                      ? 'border-rose-500/50'
                      : form.confirmPassword && form.confirmPassword === form.password
                        ? 'border-emerald-500/50'
                        : 'border-navy-600/50'
                    }`}
                  placeholder="••••••••"
                  required
                />
                {form.confirmPassword && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.confirmPassword === form.password ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-rose-400" />
                    )}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                       hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                       transition-all duration-300 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-navy-700/50 text-center">
            <p className="text-sm text-navy-400">
              Already have an account?{' '}
              <Link to="/login" className="text-electric hover:text-electric-light font-medium transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
