import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Lock, Mail, ArrowRight, Loader2, Check, Shield } from 'lucide-react';

const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(token ? 'reset' : 'request');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/recovery/password-reset-request', { email });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      const res = await api.post('/recovery/password-reset', { token, newPassword });
      setSuccess(res.data.message);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            {step === 'done' ? 'Password Reset!' : 'Reset Password'}
          </h1>
        </div>

        <div className="glass rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in">
              {error}
            </div>
          )}
          {success && step !== 'done' && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-fade-in">
              {success}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequest} className="space-y-5">
              <p className="text-sm text-navy-300">
                Enter your email address and we'll send you a password reset link.
              </p>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                             text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                         transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sm text-navy-300">Enter your new password below.</p>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                             text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                             text-navy-100 placeholder-navy-500 text-sm focus:border-electric/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                         transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm text-navy-300 mb-6">{success}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm"
              >
                <ArrowRight className="w-4 h-4" /> Go to Login
              </Link>
            </div>
          )}

          {step !== 'done' && (
            <div className="mt-6 pt-6 border-t border-navy-700/50 text-center">
              <Link to="/login" className="text-sm text-electric hover:text-electric-light transition">
                ← Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
