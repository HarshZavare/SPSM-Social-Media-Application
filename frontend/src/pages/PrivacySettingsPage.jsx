import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Settings, Globe, Users, Lock, Check, Loader2, Shield } from 'lucide-react';

const PrivacySettingsPage = () => {
  const [settings, setSettings] = useState({ profile_visibility:'PUBLIC', post_visibility:'FRIENDS_ONLY', contact_visibility:'PRIVATE' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(()=>{(async()=>{try{const r=await api.get('/privacy/settings');if(r.data.settings)setSettings(r.data.settings);}catch(e){}finally{setLoading(false);}})();},[]);
  const save = async ()=>{setSaving(true);setSaved(false);try{await api.put('/privacy/settings',settings);setSaved(true);setTimeout(()=>setSaved(false),3000);}catch(e){}finally{setSaving(false);}};

  const levels = [
    { value:'PUBLIC', label:'Public', desc:'Visible to everyone', icon:Globe, color:'#24A47F', bg:'#ECFAF5', border:'#C9F0E6' },
    { value:'FRIENDS_ONLY', label:'Friends Only', desc:'Visible to friends', icon:Users, color:'#FE7838', bg:'#FFF6EB', border:'#FFECD4' },
    { value:'PRIVATE', label:'Private', desc:'Only visible to you', icon:Lock, color:'#D8372A', bg:'#FFF7F8', border:'#FFE5E3' },
  ];

  const categories = [
    { key:'profile_visibility', title:'Profile Visibility', desc:'Who can see your profile' },
    { key:'post_visibility', title:'Posts Visibility', desc:'Who can see your posts' },
    { key:'contact_visibility', title:'Contact Information', desc:'Who can see your email' },
    { key:'last_seen_visibility', title:'Online Status', desc:'Who can see when you\'re active' },
  ];

  if(loading) return (<div className="max-w-3xl mx-auto px-4 py-8"><div className="space-y-6">{[1,2,3].map(i=>(<div key={i} className="skeleton h-36"/>))}</div></div>);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Settings</p>
        <h1 className="page-title">Privacy</h1>
        <p className="page-subtitle">Control who can see your information</p>
      </div>

      <div className="space-y-6">
        {categories.map((cat,ci)=>(
          <div key={cat.key} className="card p-5 animate-slide-up" style={{animationDelay:`${ci*60}ms`}}>
            <div className="mb-4"><h3 className="text-sm font-semibold" style={{color:'#222'}}>{cat.title}</h3><p className="text-xs" style={{color:'#999'}}>{cat.desc}</p></div>
            <div className="grid sm:grid-cols-3 gap-3">
              {levels.map(l=>{const sel=settings[cat.key]===l.value;return(
                <button key={l.value} onClick={()=>setSettings({...settings,[cat.key]:l.value})}
                  className="p-3.5 rounded-lg border text-left transition-all"
                  style={{borderColor:sel?l.border:'#E1E1E1',background:sel?l.bg:'#FFF'}}>
                  <div className="flex items-center justify-between mb-1.5">
                    <l.icon className="w-4 h-4" style={{color:sel?l.color:'#C8C8C8'}}/>
                    {sel&&<Check className="w-3.5 h-3.5" style={{color:l.color}}/>}
                  </div>
                  <p className="text-sm font-medium" style={{color:sel?l.color:'#666'}}>{l.label}</p>
                  <p className="text-xs mt-0.5" style={{color:sel?l.color:'#999',opacity:sel?0.8:1}}>{l.desc}</p>
                </button>
              );})}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button onClick={save} disabled={saving} className="btn-green">
          {saving?<Loader2 className="w-4 h-4 animate-spin"/>:saved?<Check className="w-4 h-4"/>:<Shield className="w-4 h-4"/>}
          {saving?'Saving...':saved?'Saved!':'Save Settings'}
        </button>
        {saved&&<span className="text-sm font-medium animate-fade-in" style={{color:'#24A47F'}}>✓ Settings updated</span>}
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
