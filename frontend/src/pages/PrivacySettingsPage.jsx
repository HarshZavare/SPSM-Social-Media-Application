import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Settings, Globe, Users, Lock, Check, Loader2, Shield } from 'lucide-react';

const PrivacySettingsPage = () => {
  const [settings, setSettings] = useState({
    profile_visibility: 'PUBLIC',
    post_visibility: 'FRIENDS_ONLY',
    contact_visibility: 'PRIVATE',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/privacy/settings');
      if (res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Fetch privacy settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/privacy/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save privacy settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  const levels = [
    { value: 'PUBLIC', label: 'Public', desc: 'Visible to everyone', icon: Globe, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { value: 'FRIENDS_ONLY', label: 'Friends Only', desc: 'Visible to friends', icon: Users, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { value: 'PRIVATE', label: 'Private', desc: 'Only visible to you', icon: Lock, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  ];

  const categories = [
    { key: 'profile_visibility', title: 'Profile Visibility', desc: 'Control who can see your profile information' },
    { key: 'post_visibility', title: 'Posts Visibility', desc: 'Control who can see your posts and content' },
    { key: 'contact_visibility', title: 'Contact Information', desc: 'Control who can see your email and contact details' },
    { key: 'last_seen_visibility', title: 'Last Seen & Online Status', desc: 'Control who can see when you are online or last active' },
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 glass rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-navy-50 flex items-center gap-2">
          <Settings className="w-6 h-6 text-electric" />
          Privacy Settings
        </h1>
        <p className="text-navy-400 text-sm mt-1">Control who can see your information</p>
      </div>

      <div className="space-y-6">
        {categories.map((category, ci) => (
          <div
            key={category.key}
            className="glass rounded-xl p-6 animate-slide-up"
            style={{ animationDelay: `${ci * 100}ms` }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-navy-100">{category.title}</h3>
              <p className="text-sm text-navy-400">{category.desc}</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {levels.map((level) => {
                const isSelected = settings[category.key] === level.value;
                return (
                  <button
                    key={level.value}
                    onClick={() => setSettings({ ...settings, [category.key]: level.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-300
                      ${isSelected
                        ? `${level.color} scale-[1.02] shadow-lg`
                        : 'border-navy-700/50 bg-navy-800/30 hover:border-navy-600'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <level.icon className={`w-5 h-5 ${isSelected ? '' : 'text-navy-500'}`} />
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                    <p className={`text-sm font-semibold ${isSelected ? '' : 'text-navy-300'}`}>
                      {level.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-navy-500'}`}>
                      {level.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                   hover:shadow-lg hover:shadow-electric/25 disabled:opacity-50
                   transition-all duration-300 flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400 animate-fade-in">
            ✓ Privacy settings updated
          </span>
        )}
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
