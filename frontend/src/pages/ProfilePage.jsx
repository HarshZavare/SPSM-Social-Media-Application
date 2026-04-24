import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, Shield, Lock, QrCode, Check, Loader2, Copy, Mail, Calendar } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const enable2FA = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/auth/enable-2fa');
      setTwoFASetup({ qrCode: res.data.qrCode, secret: res.data.secret });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to setup 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/auth/verify-2fa', { token: verifyCode });
      setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
      setTwoFASetup(null);
      setVerifyCode('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid code' });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (twoFASetup?.secret) {
      navigator.clipboard.writeText(twoFASetup.secret);
      setMessage({ type: 'success', text: 'Secret copied to clipboard!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-navy-50 flex items-center gap-2">
          <User className="w-6 h-6 text-electric" />
          My Profile
        </h1>
        <p className="text-navy-400 text-sm mt-1">Manage your account and security settings</p>
      </div>

      {/* Profile Card */}
      <div className="glass rounded-2xl p-8 mb-6 animate-slide-up">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center glow">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-50">{user?.username}</h2>
            <p className="text-sm text-navy-400 flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-electric/15 text-electric border border-electric/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup */}
      <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-navy-100 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-electric" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-navy-400 mt-0.5">
              Add an extra layer of security with an authenticator app
            </p>
          </div>
          {user?.twofa_enabled && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/30">
              Enabled
            </span>
          )}
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm animate-fade-in
            ${message.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
            {message.text}
          </div>
        )}

        {!twoFASetup ? (
          <button
            onClick={enable2FA}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                     hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                     transition-all duration-300 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            {user?.twofa_enabled ? 'Reconfigure 2FA' : 'Enable 2FA'}
          </button>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* QR Code */}
              <div className="bg-white p-3 rounded-xl">
                <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>

              <div className="flex-1">
                <p className="text-sm text-navy-300 mb-3">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="bg-navy-800/80 rounded-lg p-3 mb-4">
                  <p className="text-xs text-navy-400 mb-1">Manual entry key:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-electric break-all">
                      {twoFASetup.secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-1 rounded hover:bg-navy-700 transition flex-shrink-0"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4 text-navy-400" />
                    </button>
                  </div>
                </div>

                {/* Verify */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-navy-800/80 border border-navy-600/50
                             text-navy-100 placeholder-navy-500 text-sm font-mono tracking-widest
                             focus:border-electric/50 transition-all"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button
                    onClick={verify2FA}
                    disabled={loading || verifyCode.length !== 6}
                    className="px-4 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                             disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
