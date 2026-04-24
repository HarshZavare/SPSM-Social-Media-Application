import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, Shield, Lock, QrCode, Check, Loader2, Copy, Mail } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const enable2FA = async ()=>{setLoading(true);setMessage({type:'',text:''});try{const r=await api.post('/auth/enable-2fa');setTwoFASetup({qrCode:r.data.qrCode,secret:r.data.secret});}catch(e){setMessage({type:'error',text:e.response?.data?.message||'Failed'});}finally{setLoading(false);}};
  const verify2FA = async ()=>{setLoading(true);setMessage({type:'',text:''});try{await api.post('/auth/verify-2fa',{token:verifyCode});setMessage({type:'success',text:'2FA enabled successfully!'});setTwoFASetup(null);setVerifyCode('');}catch(e){setMessage({type:'error',text:e.response?.data?.message||'Invalid code'});}finally{setLoading(false);}};
  const copySecret = ()=>{if(twoFASetup?.secret){navigator.clipboard.writeText(twoFASetup.secret);setMessage({type:'success',text:'Copied!'});setTimeout(()=>setMessage({type:'',text:''}),2000);}};

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Account</p>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and security</p>
      </div>

      <div className="card p-6 mb-6 animate-slide-up">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:'#24A47F'}}><User className="w-8 h-8 text-white"/></div>
          <div>
            <h2 className="text-xl font-semibold" style={{color:'#222',fontFamily:"'Instrument Serif', Georgia, serif"}}>{user?.username}</h2>
            <p className="text-sm flex items-center gap-1.5 mt-0.5" style={{color:'#666'}}><Mail className="w-3.5 h-3.5"/> {user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="badge badge-success"><Shield className="w-3 h-3"/> Verified</span>
              <span className="badge badge-info"><Lock className="w-3 h-3"/> Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 animate-slide-up" style={{animationDelay:'80ms'}}>
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="text-sm font-semibold flex items-center gap-2" style={{color:'#222'}}><QrCode className="w-4 h-4" style={{color:'#24A47F'}}/> Two-Factor Authentication</h3><p className="text-xs mt-0.5" style={{color:'#999'}}>Extra security with an authenticator app</p></div>
          {user?.twofa_enabled&&<span className="badge badge-success">Enabled</span>}
        </div>

        {message.text&&<div className="mb-4 p-3 rounded-lg text-sm animate-fade-in" style={message.type==='error'?{background:'#FFF7F8',border:'1px solid #FFE5E3',color:'#D8372A'}:{background:'#ECFAF5',border:'1px solid #C9F0E6',color:'#047957'}}>{message.text}</div>}

        {!twoFASetup?(
          <button onClick={enable2FA} disabled={loading} className="btn-green">{loading?<Loader2 className="w-4 h-4 animate-spin"/>:<QrCode className="w-4 h-4"/>}{user?.twofa_enabled?'Reconfigure 2FA':'Enable 2FA'}</button>
        ):(
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="p-2 rounded-lg" style={{background:'#FFF',border:'1px solid #E1E1E1'}}><img src={twoFASetup.qrCode} alt="QR" className="w-44 h-44"/></div>
              <div className="flex-1">
                <p className="text-sm mb-3" style={{color:'#666'}}>Scan with Google Authenticator or Authy</p>
                <div className="rounded-lg p-3 mb-4" style={{background:'#FAFAFA',border:'1px solid #E1E1E1'}}>
                  <p className="text-xs mb-1" style={{color:'#999'}}>Manual entry key:</p>
                  <div className="flex items-center gap-2"><code className="text-sm font-mono break-all" style={{color:'#24A47F'}}>{twoFASetup.secret}</code><button onClick={copySecret} className="p-1 rounded flex-shrink-0" style={{color:'#999'}}><Copy className="w-4 h-4"/></button></div>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={verifyCode} onChange={(e)=>setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))} className="input-field flex-1 font-mono tracking-widest text-center" placeholder="000000" maxLength={6}/>
                  <button onClick={verify2FA} disabled={loading||verifyCode.length!==6} className="btn-green px-4">{loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>} Verify</button>
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
