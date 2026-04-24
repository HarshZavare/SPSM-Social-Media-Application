import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Lock, Mail, ArrowRight, Loader2, Check, Shield } from 'lucide-react';

const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email,setEmail]=useState('');const [newPassword,setNewPassword]=useState('');const [confirmPassword,setConfirmPassword]=useState('');
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('');
  const [step,setStep]=useState(token?'reset':'request');

  const handleRequest = async (e)=>{e.preventDefault();setError('');setLoading(true);try{const r=await api.post('/recovery/password-reset-request',{email});setSuccess(r.data.message);}catch(e){setError(e.response?.data?.message||'Server unavailable. Please make sure the backend is running.');}finally{setLoading(false);}};
  const handleReset = async (e)=>{e.preventDefault();setError('');if(newPassword!==confirmPassword)return setError('Passwords do not match');setLoading(true);try{const r=await api.post('/recovery/password-reset',{token,newPassword});setSuccess(r.data.message);setStep('done');}catch(e){setError(e.response?.data?.message||'Server unavailable. Please make sure the backend is running.');}finally{setLoading(false);}};

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12" style={{background:'#15372C'}}>
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background:'#24A47F'}}><Shield className="w-5 h-5 text-white"/></div>
          <span className="text-2xl text-white" style={{fontFamily:"'Instrument Serif', Georgia, serif"}}>SPSM</span>
        </div>
        <h1 className="text-5xl text-white mb-6 leading-tight" style={{fontFamily:"'Instrument Serif', Georgia, serif"}}>Account<br/>Recovery</h1>
        <p className="text-lg" style={{color:'#4CB398'}}>Secure password reset with email verification.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8" style={{background:'#FAFAFA'}}>
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:'#24A47F'}}><Shield className="w-5 h-5 text-white"/></div>
            <span className="text-xl font-bold" style={{color:'#15372C',fontFamily:"'Instrument Serif', Georgia, serif"}}>SPSM</span>
          </div>
          <h2 className="text-3xl mb-2" style={{color:'#15372C',fontFamily:"'Instrument Serif', Georgia, serif"}}>{step==='done'?'Password Reset!':'Reset Password'}</h2>
          <p className="text-sm mb-8" style={{color:'#666'}}>{step==='done'?'Your password has been updated':step==='reset'?'Enter your new password':'We\'ll send you a reset link'}</p>

          {error&&<div className="mb-4 p-3 rounded-lg text-sm animate-fade-in" style={{background:'#FFF7F8',border:'1px solid #FFE5E3',color:'#D8372A'}}>{error}</div>}
          {success&&step!=='done'&&<div className="mb-4 p-3 rounded-lg text-sm animate-fade-in" style={{background:'#ECFAF5',border:'1px solid #C9F0E6',color:'#047957'}}>{success}</div>}

          {step==='request'&&(
            <form onSubmit={handleRequest} className="space-y-5">
              <div><label className="block text-sm font-medium mb-1.5" style={{color:'#424242'}}>Email</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#C8C8C8'}}/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required/></div></div>
              <button type="submit" disabled={loading} className="btn-green w-full py-2.5">{loading?<Loader2 className="w-4 h-4 animate-spin"/>:<ArrowRight className="w-4 h-4"/>}{loading?'Sending...':'Send Reset Link'}</button>
            </form>
          )}
          {step==='reset'&&(
            <form onSubmit={handleReset} className="space-y-5">
              <div><label className="block text-sm font-medium mb-1.5" style={{color:'#424242'}}>New Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#C8C8C8'}}/><input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" minLength={8} required/></div></div>
              <div><label className="block text-sm font-medium mb-1.5" style={{color:'#424242'}}>Confirm Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#C8C8C8'}}/><input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" required/></div></div>
              <button type="submit" disabled={loading} className="btn-green w-full py-2.5">{loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Shield className="w-4 h-4"/>}{loading?'Resetting...':'Reset Password'}</button>
            </form>
          )}
          {step==='done'&&(
            <div className="text-center"><div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'#ECFAF5'}}><Check className="w-8 h-8" style={{color:'#24A47F'}}/></div><p className="text-sm mb-6" style={{color:'#666'}}>{success}</p><Link to="/login" className="btn-green inline-flex"><ArrowRight className="w-4 h-4"/> Go to Login</Link></div>
          )}

          {step!=='done'&&<div className="mt-8 pt-6 text-center" style={{borderTop:'1px solid #E1E1E1'}}><Link to="/login" className="text-sm font-medium" style={{color:'#24A47F'}}>← Back to login</Link></div>}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
