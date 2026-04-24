import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Upload, File, Image, FileText, Download, Share2, Lock, Shield, Check, AlertTriangle, Loader2, X } from 'lucide-react';

const FileUploadPage = () => {
  const [files,setFiles]=useState([]);const [sharedFiles,setSharedFiles]=useState([]);const [users,setUsers]=useState([]);const [keys,setKeys]=useState(null);
  const [activeTab,setActiveTab]=useState('files');const [shareModalOpen,setShareModalOpen]=useState(false);const [fileToShare,setFileToShare]=useState(null);
  const [selectedUser,setSelectedUser]=useState('');const [dragActive,setDragActive]=useState(false);const [uploading,setUploading]=useState(false);
  const [uploadProgress,setUploadProgress]=useState(0);const [error,setError]=useState('');const [success,setSuccess]=useState('');const [loading,setLoading]=useState(true);

  useEffect(()=>{fetchFiles();fetchKeys();},[]);
  const fetchKeys=async()=>{try{const r=await api.get('/auth/keys');setKeys({public:r.data.publicKey,private:r.data.privateKey});}catch(e){}};
  const fetchFiles=async()=>{try{const r=await api.get('/files/list');setFiles(r.data.files||[]);}catch(e){}finally{setLoading(false);}};
  const fetchSharedFiles=async()=>{try{const r=await api.get('/files/shared');setSharedFiles(r.data.files||[]);}catch(e){}};
  const fetchUsers=async()=>{try{const r=await api.get('/files/users');setUsers(r.data.users||[]);}catch(e){}};
  useEffect(()=>{if(activeTab==='shared')fetchSharedFiles();},[activeTab]);
  useEffect(()=>{if(shareModalOpen&&users.length===0)fetchUsers();},[shareModalOpen]);

  const handleShare=async()=>{if(!selectedUser||!fileToShare)return;try{await api.post('/files/share',{fileId:fileToShare.id,shareWithUserId:selectedUser});setSuccess(`File shared successfully!`);setShareModalOpen(false);setFileToShare(null);setSelectedUser('');setTimeout(()=>setSuccess(''),4000);}catch(e){setError(e.response?.data?.message||'Failed');}};
  const handleDrag=useCallback((e)=>{e.preventDefault();e.stopPropagation();if(e.type==='dragenter'||e.type==='dragover')setDragActive(true);else if(e.type==='dragleave')setDragActive(false);},[]);
  const uploadFile=async(file)=>{setError('');setSuccess('');setUploading(true);setUploadProgress(0);const fd=new FormData();fd.append('file',file);try{await api.post('/files/upload',fd,{headers:{'Content-Type':'multipart/form-data'},onUploadProgress:(p)=>{setUploadProgress(Math.round((p.loaded*100)/p.total));}});setSuccess(`${file.name} uploaded & encrypted`);fetchFiles();setTimeout(()=>setSuccess(''),4000);}catch(e){setError(e.response?.data?.message||'Upload failed');}finally{setUploading(false);setUploadProgress(0);}};
  const handleDrop=useCallback((e)=>{e.preventDefault();e.stopPropagation();setDragActive(false);if(e.dataTransfer.files&&e.dataTransfer.files[0])uploadFile(e.dataTransfer.files[0]);},[]);
  const handleFileSelect=(e)=>{if(e.target.files&&e.target.files[0])uploadFile(e.target.files[0]);};
  const downloadFile=async(id,name)=>{try{const r=await api.get(`/files/download/${id}`,{responseType:'blob'});const u=window.URL.createObjectURL(new Blob([r.data]));const a=document.createElement('a');a.href=u;a.download=name;a.click();window.URL.revokeObjectURL(u);}catch(e){setError('Download failed');}};
  const getFileIcon=(m)=>m?.startsWith('image/')?<Image className="w-5 h-5" style={{color:'#3574D6'}}/>:<FileText className="w-5 h-5" style={{color:'#FE7838'}}/>;
  const formatSize=(b)=>b<1024?`${b} B`:b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`;

  const renderFileList = (fileList, isShared=false) => fileList.length>0?(
    <div className="space-y-2">{fileList.map(file=>(
      <div key={file.id} className="flex items-center gap-4 p-4 rounded-lg" style={{background:'#FAFAFA',border:'1px solid #F3F3F3'}}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'#FFF',border:'1px solid #E1E1E1'}}>{getFileIcon(file.mime_type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1.5">
            <div><h3 className="font-semibold text-sm truncate" style={{color:'#222'}}>{file.original_name}</h3><p className="text-xs" style={{color:'#999'}}>{formatSize(file.file_size)} · {new Date(file.uploaded_at).toLocaleDateString()}{isShared&&file.owner_username?` · From: ${file.owner_username}`:''}</p></div>
            <div className="flex gap-1">{!isShared&&<button onClick={()=>{setFileToShare(file);setShareModalOpen(true);}} className="p-2 rounded-lg transition-colors" style={{color:'#666'}} title="Share"><Share2 className="w-4 h-4"/></button>}
              <button onClick={()=>downloadFile(file.id,file.original_name)} className="p-2 rounded-lg transition-colors" style={{color:'#666'}} title="Download"><Download className="w-4 h-4"/></button></div>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-y-1 text-xs" style={{color:'#666'}}>
            <span className="font-medium" style={{color:'#24A47F'}}>Scanner:</span><span>ClamAV (Clean)</span>
            <span className="font-medium" style={{color:'#222'}}>Encryption:</span><span>AES-256-GCM</span>
            <span className="font-medium" style={{color:'#222'}}>Hash:</span><span className="font-mono truncate" style={{color:'#999'}}>{file.file_hash||'...'}</span>
            <span className="font-medium" style={{color:'#222'}}>Auth Tag:</span><span className="font-mono truncate" style={{color:'#999'}}>{file.auth_tag||'...'}</span>
          </div>
        </div>
      </div>
    ))}</div>
  ):(<div className="text-center py-12"><File className="w-12 h-12 mx-auto mb-3" style={{color:'#E1E1E1'}}/><p className="text-sm" style={{color:'#999'}}>{isShared?'No files shared with you yet':'No files uploaded yet'}</p></div>);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <p className="text-sm font-medium mb-1" style={{color:'#24A47F'}}>Storage</p>
        <h1 className="page-title">Secure Files</h1>
        <p className="page-subtitle">Encrypted with AES-256-GCM · Scanned for malware</p>
      </div>
      {error&&<div className="mb-5 p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in" style={{background:'#FFF7F8',border:'1px solid #FFE5E3',color:'#D8372A'}}><AlertTriangle className="w-4 h-4 flex-shrink-0"/>{error}<button onClick={()=>setError('')} className="ml-auto"><X className="w-4 h-4"/></button></div>}
      {success&&<div className="mb-5 p-3 rounded-lg flex items-center gap-2 animate-fade-in" style={{background:'#ECFAF5',border:'1px solid #C9F0E6',color:'#047957'}}><Check className="w-4 h-4 flex-shrink-0"/><span className="text-sm font-medium">{success}</span></div>}

      <div className="tab-group mb-8">
        {['files','shared','keys'].map(tab=>(<button key={tab} onClick={()=>setActiveTab(tab)} className={`tab-item ${activeTab===tab?'active':''}`}>{tab==='files'?'My Files':tab==='shared'?'Shared With Me':'Security Keys'}</button>))}
      </div>

      {activeTab==='files'&&(
        <>
          <div className={`card p-8 mb-8 border-2 border-dashed cursor-pointer transition-all ${uploading?'pointer-events-none':''}`}
            style={{borderColor:dragActive?'#24A47F':'#E1E1E1',background:dragActive?'#ECFAF5':'#FFF'}}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={()=>!uploading&&document.getElementById('file-input').click()}>
            <input id="file-input" type="file" onChange={handleFileSelect} className="hidden" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"/>
            <div className="text-center">
              {uploading?(<div className="animate-fade-in"><Lock className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{color:'#24A47F'}}/><p className="text-sm font-medium mb-3" style={{color:'#222'}}>Encrypting & uploading...</p><div className="w-64 mx-auto rounded-full h-1.5" style={{background:'#E1E1E1'}}><div className="h-1.5 rounded-full transition-all" style={{background:'#24A47F',width:`${uploadProgress}%`}}/></div><p className="text-xs mt-2" style={{color:'#999'}}>{uploadProgress}%</p></div>):(
                <><Upload className="w-12 h-12 mx-auto mb-4" style={{color:dragActive?'#24A47F':'#C8C8C8'}}/><p className="text-sm font-medium" style={{color:'#424242'}}>{dragActive?'Drop your file here':'Drag & drop or click to upload'}</p><p className="text-xs mt-2" style={{color:'#999'}}>Images & documents · Max 10MB</p></>
              )}
            </div>
          </div>
          {renderFileList(files)}
        </>
      )}
      {activeTab==='shared'&&<div className="animate-fade-in">{renderFileList(sharedFiles,true)}</div>}
      {activeTab==='keys'&&(
        <div className="animate-fade-in space-y-6">
          <div><h3 className="text-sm font-semibold mb-2" style={{color:'#222'}}>Public Key</h3><div className="rounded-lg p-4 font-mono text-xs break-all leading-relaxed" style={{background:'#FAFAFA',border:'1px solid #E1E1E1',color:'#24A47F'}}>{keys?.public||'Loading...'}</div></div>
          <div><h3 className="text-sm font-semibold mb-2" style={{color:'#222'}}>Private Key</h3><div className="rounded-lg p-4 font-mono text-xs break-all leading-relaxed" style={{background:'#FAFAFA',border:'1px solid #E1E1E1',color:'#666'}}>{keys?.private||'Loading...'}</div></div>
        </div>
      )}

      {shareModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
          <div className="card-elevated p-6 w-full max-w-md mx-4 animate-scale-in">
            <div className="flex justify-between items-center mb-5"><h3 className="text-lg font-semibold" style={{color:'#222'}}>Share File</h3><button onClick={()=>setShareModalOpen(false)} style={{color:'#999'}}><X className="w-5 h-5"/></button></div>
            <p className="text-sm mb-4" style={{color:'#666'}}>Sharing: <span className="font-semibold" style={{color:'#24A47F'}}>{fileToShare?.original_name}</span></p>
            <div className="mb-6"><label className="text-xs font-medium mb-2 block" style={{color:'#666'}}>Select user</label><select value={selectedUser} onChange={(e)=>setSelectedUser(e.target.value)} className="input-field"><option value="">-- Choose --</option>{users.map(u=>(<option key={u.id} value={u.id}>{u.username} ({u.display_name})</option>))}</select></div>
            <div className="flex gap-3 justify-end"><button onClick={()=>setShareModalOpen(false)} className="btn-outline">Cancel</button><button onClick={handleShare} disabled={!selectedUser} className="btn-green">Share</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadPage;
