'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { t } from '@/lib/translations';
import {
  Settings,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Cpu,
  Layers,
  Database,
  Search,
  Sparkles,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface PolicyDoc {
  id: number;
  user_id: number;
  file_name: string;
  file_type: string;
  title: string;
  chunk_count: number;
  status: string;
  created_at: string;
}

interface ServiceStatus {
  name: string;
  status: string;
  connected?: boolean;
  error_message?: string;
}

interface SystemStatus {
  status: string;
  airgap_mode?: boolean;
  services: {
    qwen3: ServiceStatus;
    bge_m3: ServiceStatus;
    qdrant: ServiceStatus;
  };
}

export function SettingsModal() {
  const { isSettingsModalOpen, setSettingsModalOpen, activeLocale } = useUIStore();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [documents, setDocuments] = useState<PolicyDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Semantic Search / Vector Test Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSettingsModalOpen) {
      loadSystemStatus();
      loadDocuments();
    }
  }, [isSettingsModalOpen]);

  const loadSystemStatus = async () => {
    try {
      const res = await fetch('/api/ai/system-status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.warn('Could not load AI system status:', e);
    }
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/policy-documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Could not load policy documents:', e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadMessage({ type: 'error', text: 'Please select at least one PDF or Image file.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    if (uploadTitle.trim()) {
      formData.append('title', uploadTitle.trim());
    }

    try {
      const res = await fetch('/api/policy-documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setUploadMessage({
          type: 'success',
          text: data.message || `Uploaded & vectorized ${data.documents?.length || 1} document(s) into Qdrant.`
        });
        setSelectedFiles(null);
        setUploadTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadDocuments();
      } else {
        setUploadMessage({ type: 'error', text: data.message || 'Upload failed.' });
      }
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message || 'Error uploading document.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('Are you sure you want to remove this document and purge its vector embeddings from Qdrant?')) {
      return;
    }
    try {
      const res = await fetch(`/api/policy-documents/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadDocuments();
      }
    } catch (e) {
      console.error('Failed to delete policy document:', e);
    }
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      }
    } catch (err) {
      console.error('Error running test search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-outline-variant/20 flex items-center justify-between gap-4 bg-fog/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pine flex items-center justify-center text-white shadow-sm">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-pine tracking-tight">
                {t('settings_title', activeLocale)}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Close Window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* AI Stack Status Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pine uppercase tracking-wider">
                Core Services Connection Status
              </span>
              <button
                type="button"
                onClick={loadSystemStatus}
                className="text-[11px] text-teal-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* QWEN3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-pine" />
                    <span className="text-xs font-bold text-slate-800">QWEN3</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    systemStatus?.services?.qwen3?.status === 'connected' || systemStatus?.services?.qwen3?.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {systemStatus?.services?.qwen3?.status === 'connected' || systemStatus?.services?.qwen3?.connected ? 'Connected' : 'Connection Error'}
                  </span>
                </div>
                {!(systemStatus?.services?.qwen3?.status === 'connected' || systemStatus?.services?.qwen3?.connected) && (
                  <p className="text-[11px] text-rose-700 leading-tight">
                    Connection issue. Please check that Docker or local service is running and click Refresh to reconnect.
                  </p>
                )}
              </div>

              {/* BAAI BGE-M3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pine" />
                    <span className="text-xs font-bold text-slate-800">BAAI BGE-M3</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    systemStatus?.services?.bge_m3?.status === 'connected' || systemStatus?.services?.bge_m3?.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {systemStatus?.services?.bge_m3?.status === 'connected' || systemStatus?.services?.bge_m3?.connected ? 'Connected' : 'Connection Error'}
                  </span>
                </div>
                {!(systemStatus?.services?.bge_m3?.status === 'connected' || systemStatus?.services?.bge_m3?.connected) && (
                  <p className="text-[11px] text-rose-700 leading-tight">
                    Connection issue. Please check that Docker or local service is running and click Refresh to reconnect.
                  </p>
                )}
              </div>

              {/* Qdrant */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-pine" />
                    <span className="text-xs font-bold text-slate-800">Qdrant</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    systemStatus?.services?.qdrant?.status === 'connected' || systemStatus?.services?.qdrant?.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {systemStatus?.services?.qdrant?.status === 'connected' || systemStatus?.services?.qdrant?.connected ? 'Connected' : 'Connection Error'}
                  </span>
                </div>
                {!(systemStatus?.services?.qdrant?.status === 'connected' || systemStatus?.services?.qdrant?.connected) && (
                  <p className="text-[11px] text-rose-700 leading-tight">
                    Connection issue. Please check that Docker or local service is running and click Refresh to reconnect.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Nationwide Health Policy Documents */}
          <div className="bg-fog/50 border border-outline-variant/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-pine flex items-center gap-2">
                  <Upload className="w-4 h-4 text-pine" />
                  <span>{t('policy_upload_title', activeLocale)}</span>
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {t('policy_upload_desc', activeLocale)}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Select Policy PDFs or Images (Screening Centers, Rules, Eligibility):
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pine file:text-white hover:file:bg-pine-light cursor-pointer border border-outline-variant/40 rounded-xl bg-white p-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Custom Title / Label (Optional):
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. UAE Premarital Guidelines 2026"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-outline-variant/40 text-pine placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-pine"
                  />
                </div>
              </div>

              {uploadMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {uploadMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{uploadMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-pine hover:bg-pine-light disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Embedding into Qdrant via BGE-M3...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Upload &amp; Store Vectors</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* List of Indexed Documents in Qdrant */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pine" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-pine">
                  Indexed Knowledge Documents in Vector DB ({documents.length})
                </h4>
              </div>
            </div>

            {isLoadingDocs ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading indexed documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                <p className="text-xs font-bold text-slate-600">No policy documents uploaded yet.</p>
                <p className="text-[11px] text-slate-400">
                  Upload nationwide health policy guidelines, premarital screening rules, or screening center lists above to enable semantic search.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-pine/40 flex items-center justify-between gap-3 transition shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-mint/25 flex items-center justify-center text-pine shrink-0">
                        {doc.file_type === 'pdf' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{doc.title || doc.file_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-mono">{doc.file_name}</span>
                          <span>&bull;</span>
                          <span className="text-teal-800 font-semibold">{doc.chunk_count} vector chunks</span>
                          <span>&bull;</span>
                          <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Active'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete document and purge vectors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat with Uploaded Documents */}
          <div className="p-4 rounded-2xl bg-mint/15 border border-mint/60 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-jungle" />
              <h4 className="text-xs font-bold text-pine uppercase tracking-wider">
                Chat with Uploaded Documents
              </h4>
            </div>

            <form onSubmit={handleTestSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask anything about your uploaded documents..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-outline-variant/40 text-pine placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-pine"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-pine hover:bg-pine-light text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Ask</span>
              </button>
            </form>

            {searchResult && (
              <div className="p-3.5 rounded-xl bg-white border border-outline-variant/30 space-y-2.5 text-xs shadow-2xs">
                <p className="text-slate-800 leading-relaxed text-xs whitespace-pre-line font-medium">
                  {searchResult.answer}
                </p>
                {searchResult.source && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Source:</span>
                    <span className="font-semibold text-pine underline">{searchResult.source}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant/20 flex justify-end bg-fog/30 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
