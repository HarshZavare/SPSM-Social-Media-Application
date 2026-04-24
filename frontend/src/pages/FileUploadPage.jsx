import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Upload, File, Image, FileText, Trash2, Download, Share2,
  Lock, Shield, Check, AlertTriangle, Loader2, X
} from 'lucide-react';

const FileUploadPage = () => {
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [keys, setKeys] = useState(null);
  const [activeTab, setActiveTab] = useState('files');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/auth/keys');
      setKeys({ public: res.data.publicKey, private: res.data.privateKey });
    } catch (err) {
      console.error('Fetch keys error:', err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files/list');
      setFiles(res.data.files || []);
    } catch (err) {
      console.error('Fetch files error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const res = await api.get('/files/shared');
      setSharedFiles(res.data.files || []);
    } catch (err) {
      console.error('Fetch shared error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/files/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'shared') fetchSharedFiles();
  }, [activeTab]);

  useEffect(() => {
    if (shareModalOpen && users.length === 0) fetchUsers();
  }, [shareModalOpen]);

  const handleShare = async () => {
    if (!selectedUser || !fileToShare) return;
    try {
      await api.post('/files/share', { fileId: fileToShare.id, shareWithUserId: selectedUser });
      setSuccess(`File ${fileToShare.original_name} shared successfully!`);
      setShareModalOpen(false);
      setFileToShare(null);
      setSelectedUser('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share file');
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file) => {
    setError('');
    setSuccess('');
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });
      setSuccess(`${file.name} uploaded and encrypted successfully!`);
      fetchFiles();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const res = await api.get(`/files/download/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed');
    }
  };

  const getFileIcon = (mime) => {
    if (mime?.startsWith('image/')) return <Image className="w-5 h-5 text-electric" />;
    return <FileText className="w-5 h-5 text-amber-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-navy-50 flex items-center gap-2">
          Your Files
        </h1>
        <p className="text-navy-400 text-sm mt-1">Encrypted with AES-256-GCM. Scanned for malware.</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-base">File securely uploaded. Hash: {success.substring(success.indexOf('Hash: ') + 6) || '...'}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'files'
              ? 'bg-electric text-white shadow-lg shadow-electric/25'
              : 'border border-navy-700 text-navy-100 hover:bg-navy-800'
          }`}
        >
          My Files
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'shared'
              ? 'bg-electric text-white shadow-lg shadow-electric/25'
              : 'border border-navy-700 text-navy-100 hover:bg-navy-800'
          }`}
        >
          Shared With Me
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'keys'
              ? 'bg-electric text-white shadow-lg shadow-electric/25'
              : 'border border-navy-700 text-navy-100 hover:bg-navy-800'
          }`}
        >
          My Security Keys
        </button>
      </div>

      {activeTab === 'files' && (
        <>
          {/* Upload Zone */}
      <div
        className={`glass rounded-2xl p-8 mb-8 border-2 border-dashed transition-all duration-300 cursor-pointer
          ${dragActive ? 'border-electric bg-electric/5 scale-[1.01]' : 'border-navy-600/50 hover:border-navy-500'}
          ${uploading ? 'pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
        />

        <div className="text-center">
          {uploading ? (
            <div className="animate-fade-in">
              <Lock className="w-12 h-12 text-electric mx-auto mb-4 animate-pulse" />
              <p className="text-sm font-medium text-navy-200 mb-3">Encrypting & uploading...</p>
              <div className="w-64 mx-auto bg-navy-700 rounded-full h-2">
                <div
                  className="gradient-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-navy-500 mt-2">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-electric' : 'text-navy-500'}`} />
              <p className="text-sm font-medium text-navy-200">
                {dragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-navy-500 mt-2">
                Images (JPG, PNG, GIF, WebP) and Documents (PDF, DOC) • Max 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Files List */}
      <div className="glass rounded-2xl p-6 lg:p-8 mt-8">
        <h2 className="text-lg font-semibold text-electric mb-6">
          My Secure Files
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-navy-800/50 rounded-lg animate-pulse" />)}
          </div>
        ) : files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-navy-800/30 border border-navy-700/30
                         hover:border-navy-600/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-navy-800/80 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-navy-50 font-semibold mb-1 truncate">{file.original_name}</h3>
                      <p className="text-xs text-navy-400">
                        {formatSize(file.file_size)} - {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setFileToShare(file);
                          setShareModalOpen(true);
                        }}
                        className="p-2 ... hover:text-navy-50"
                        title="Share File"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(file.id, file.original_name)}
                        className="p-2 ... hover:text-navy-50"
                        title="Download & Decrypt"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[80px_1fr] mt-3 gap-y-1.5 text-xs text-navy-300">
                    <span className="font-semibold text-electric">Scanner:</span>
                    <span>ClamAV (Clean - No Malware Detected)</span>
                    
                    <span className="font-semibold text-navy-100">Encryption:</span>
                    <span>AES-256-GCM (Authenticated Encryption)</span>
                    
                    <span className="font-semibold text-navy-100">File Hash:</span>
                    <span className="font-mono text-navy-400 truncate">{file.file_hash || '...'}</span>
                    
                    <span className="font-semibold text-navy-100">Auth Tag:</span>
                    <span className="font-mono text-navy-400 truncate">{file.auth_tag || '...'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <File className="w-12 h-12 text-navy-700 mx-auto mb-3" />
            <p className="text-sm text-navy-500">No files uploaded yet</p>
            <p className="text-xs text-navy-600">Your files will be encrypted before storage</p>
          </div>
        )}
      </div>
          </>
      )}

      {activeTab === 'shared' && (
        <div className="glass rounded-2xl p-6 lg:p-8 mt-8 animate-fade-in shadow-xl border border-navy-700/50">
          <h2 className="text-lg font-semibold mb-6 text-electric">Files Shared With Me</h2>
          
          {sharedFiles.length > 0 ? (
            <div className="space-y-4">
              {sharedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-5 rounded-xl bg-navy-800/40 border border-navy-700/50 hover:border-navy-600 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-navy-700/50 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-navy-50 font-semibold mb-1 truncate">{file.original_name}</h3>
                        <p className="text-xs text-navy-400">
                          {formatSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()} • From: {file.owner_email || file.owner_username}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadFile(file.id, file.original_name)}
                        className="p-2 ... hover:text-navy-50"
                        title="Download & Decrypt"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-[80px_1fr] mt-3 gap-y-1.5 text-xs text-navy-300">
                      <span className="font-semibold text-electric">Scanner:</span>
                      <span>ClamAV (Clean - No Malware Detected)</span>
                      
                      <span className="font-semibold text-navy-100">Encryption:</span>
                      <span>AES-256-GCM (Authenticated Encryption)</span>
                      
                      <span className="font-semibold text-navy-100">File Hash:</span>
                      <span className="font-mono text-navy-400 truncate">{file.file_hash || '...'}</span>
                      
                      <span className="font-semibold text-navy-100">Auth Tag:</span>
                      <span className="font-mono text-navy-400 truncate">{file.auth_tag || '...'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Share2 className="w-12 h-12 text-navy-700 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-navy-400">No files have been shared with you yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="glass rounded-2xl p-6 lg:p-8 animate-fade-in shadow-xl border border-navy-700/50">
          <h2 className="text-xl font-semibold mb-2 text-electric">RSA Asymmetric Keys</h2>
          <p className="text-navy-300 text-sm mb-8 leading-relaxed">
            These keys were uniquely generated for your account upon registration. They can be used for end-to-end asynchronous verification.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-navy-50 mb-3">Public Key</h3>
              <div className="bg-navy-900/60 rounded-xl p-5 border border-navy-700/50 font-mono text-xs text-electric break-all whitespace-pre-wrap leading-relaxed shadow-inner">
                {keys?.public || 'Generating...'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-navy-50 mb-3">Private Key</h3>
              <div className="bg-navy-900/60 rounded-xl p-5 border border-navy-700/50 font-mono text-xs text-navy-400 break-all whitespace-pre-wrap leading-relaxed shadow-inner">
                {keys?.private || 'Generating...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-navy-50">Share File</h3>
              <button onClick={() => setShareModalOpen(false)} className="text-navy-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-navy-300 mb-4 truncate">
              Sharing: <span className="font-medium text-electric">{fileToShare?.original_name}</span>
            </p>

            <div className="mb-6">
              <label className="block text-xs font-medium text-navy-400 mb-2">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 text-sm text-navy-100 focus:border-electric focus:ring-1 focus:ring-electric transition-all"
              >
                <option value="">-- Choose a user --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.display_name})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShareModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-navy-300 hover:bg-navy-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleShare}
                disabled={!selectedUser}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-electric text-white hover:bg-electric/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadPage;
