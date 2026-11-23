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
  RefreshCw,
  Globe,
  Key,
  Copy,
  Check,
  Save,
  Lock
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
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    activeLocale,
    aiEngineMode,
    setAIEngineMode,
    geminiApiKey,
    setGeminiApiKey,
    hasGlobalGeminiKey,
    setHasGlobalGeminiKey,
    fetchGlobalAIConfig,
    selectedGeminiModel,
    setSelectedGeminiModel,
    availableGeminiModels,
    setAvailableGeminiModels
  } = useUIStore();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [documents, setDocuments] = useState<PolicyDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Online Gemini Cloud State
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [copiedTestResult, setCopiedTestResult] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');
  const [isSavedGemini, setIsSavedGemini] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasStoredKey = Boolean(hasGlobalGeminiKey || (geminiApiKey && geminiApiKey.trim()));

  useEffect(() => {
    if (isSettingsModalOpen) {
      fetchGlobalAIConfig();
      loadSystemStatus();
      loadDocuments();
      loadGeminiModels();
      setInputApiKey('');
    }
  }, [isSettingsModalOpen]);

  const loadGeminiModels = async () => {
    try {
      const activeKey = inputApiKey.trim() || geminiApiKey.trim();
      const url = activeKey
        ? `/api/ai/models?key=${encodeURIComponent(activeKey)}`
        : '/api/ai/models';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.has_key !== undefined) {
          setHasGlobalGeminiKey(Boolean(data.has_key));
        }
        if (Array.isArray(data.models) && data.models.length > 0) {
          setAvailableGeminiModels(data.models);
        }
      }
    } catch (e) {
      console.warn('Could not load Gemini models:', e);
    }
  };

  const handleTestGeminiConnection = async () => {
    const keyToTest = inputApiKey.trim() || geminiApiKey.trim();
    if (!keyToTest && !hasStoredKey) {
      setTestResult({ status: 'error', message: 'Please enter a Gemini API Key to test.' });
      return;
    }
    setIsTestingGemini(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test-gemini-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: keyToTest || undefined,
          model_id: selectedGeminiModel
        })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {
          status: 'error',
          message: `Server returned HTTP ${res.status}: ${res.statusText || 'Unable to parse server response'}`
        };
      }

      if (res.ok && data.status === 'success') {
        const fetchedModels = Array.isArray(data.models) && data.models.length > 0 ? data.models : availableGeminiModels;
        setAvailableGeminiModels(fetchedModels);
        if (!fetchedModels.some((m: any) => m.id === selectedGeminiModel)) {
          if (fetchedModels[0]?.id) {
            setSelectedGeminiModel(fetchedModels[0].id);
          }
        }
        setHasGlobalGeminiKey(true);
        setAIEngineMode('online');
        if (inputApiKey.trim()) {
          setGeminiApiKey(inputApiKey.trim());
          setInputApiKey('');
        }
        setTestResult({
          status: 'success',
          message: data.message || `Successfully connected to Google AI Studio (${fetchedModels.length} models available)!`
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.message || 'Gemini authentication failed. Please verify your API key.'
        });
      }
    } catch (e: any) {
      setTestResult({
        status: 'error',
        message: `Connection error: ${e.message || 'Could not reach server'}`
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    const keyToSave = inputApiKey.trim() || geminiApiKey.trim();
    if (!keyToSave && !hasStoredKey) {
      setTestResult({ status: 'error', message: 'Please enter a Gemini API Key before saving.' });
      return;
    }
    if (inputApiKey.trim()) {
      setGeminiApiKey(inputApiKey.trim());
      setInputApiKey('');
    }
    setSelectedGeminiModel(selectedGeminiModel);
    setHasGlobalGeminiKey(true);
    setAIEngineMode('online');
    setIsSavedGemini(true);
    setTestResult({
      status: 'success',
      message: 'Gemini API Key and Model configuration saved globally!'
    });
    try {
      if (keyToSave) {
        await fetch('/api/ai/save-gemini-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: keyToSave,
            model_id: selectedGeminiModel
          })
        });
      }
    } catch {}
    setTimeout(() => setIsSavedGemini(false), 2500);
  };

  const handleRemoveGeminiKey = async () => {
    try {
      await fetch('/api/ai/remove-gemini-config', { method: 'POST' });
    } catch {}
    setGeminiApiKey('');
    setInputApiKey('');
    setHasGlobalGeminiKey(false);
    setTestResult({
      status: 'success',
      message: 'Gemini API Key removed globally.'
    });
    setTimeout(() => setTestResult(null), 3000);
  };

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

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 select-text">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden my-8 max-h-[90vh] flex flex-col select-text">
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
          {/* AI Stack / Engine Mode Selection (Offline vs Online) */}
          <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-pine dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-jungle" />
                  AI Intelligence Engine &amp; Connectivity
                </span>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  Choose between local air-gapped clinical processing (Qwen, BGE-M3, Qdrant) or online Google Gemini Cloud.
                </p>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-outline-variant/40 shadow-2xs self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setAIEngineMode('offline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    aiEngineMode === 'offline'
                      ? 'bg-pine text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-pine dark:text-slate-400'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Offline Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAIEngineMode('online')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    aiEngineMode === 'online'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-blue-600 dark:text-slate-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Online Mode</span>
                </button>
              </div>
            </div>

            {/* Offline Mode View: QWEN3, BAAI BGE-M3, Qdrant */}
            {aiEngineMode === 'offline' ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Offline Stack: Air-Gapped Local Clinical Services
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
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-pine" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">QWEN3</span>
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
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-pine" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">BAAI BGE-M3</span>
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
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-pine" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">Qdrant</span>
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
            ) : (
              /* Online Mode View: Gemini API Key, Model Dropdown, Test Connection Button */
              <div className="space-y-4 pt-1">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      Google AI Studio Gemini Cloud Setup
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      Online Cloud LLM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* API Key Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {hasStoredKey ? 'Gemini API Key (Configured)' : 'Gemini API Key'}
                        </label>
                        {hasStoredKey && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <Lock className="w-2.5 h-2.5 text-emerald-600" />
                            Key Saved (Global Cloud)
                          </span>
                        )}
                      </div>

                      {hasStoredKey && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-emerald-200/70 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-mono font-bold tracking-widest text-emerald-900 dark:text-emerald-200 select-none">
                                ••••••••••••••••••••••••
                              </p>
                              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                                Active on all desktop & mobile sessions
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveGeminiKey}
                            className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold hover:underline shrink-0 px-2 py-0.5 rounded cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      <div className="relative">
                        <input
                          type="password"
                          value={inputApiKey}
                          onChange={(e) => setInputApiKey(e.target.value)}
                          onCopy={(e) => e.preventDefault()}
                          onCut={(e) => e.preventDefault()}
                          autoComplete="new-password"
                          spellCheck={false}
                          placeholder={
                            hasStoredKey
                              ? "Enter new API key to update..."
                              : "Enter your Google AI Studio API Key..."
                          }
                          className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono select-none"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <p className="text-slate-400">
                          {hasStoredKey
                            ? "To update the global key, enter a new key above and click Save."
                            : "Your key is stored globally on the cloud backend and verified directly with Google."}
                        </p>
                      </div>
                    </div>

                    {/* Model Dropdown Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Gemini Model
                      </label>
                      <select
                        value={selectedGeminiModel}
                        onChange={(e) => setSelectedGeminiModel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {availableGeminiModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.badge ? `• ${m.badge}` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">
                        Select the model version for clinical reasoning and Ask Care AI.
                      </p>
                    </div>
                  </div>

                  {/* Test Connection & Save Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleTestGeminiConnection}
                        disabled={isTestingGemini || (!inputApiKey.trim() && !hasStoredKey)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isTestingGemini ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing Connection...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Test Connection</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveGeminiKey}
                        disabled={!inputApiKey.trim() && !hasStoredKey}
                        className="px-4 py-2 rounded-xl bg-pine hover:bg-pine-light text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        title="Save Gemini API Key & Model Configuration"
                      >
                        {isSavedGemini ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-mint" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>

                    {testResult && (
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 select-text cursor-text max-w-full overflow-hidden ${
                        testResult.status === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {testResult.status === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span className="select-text break-words">{testResult.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(testResult.message);
                            setCopiedTestResult(true);
                            setTimeout(() => setCopiedTestResult(false), 2000);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-black/5 hover:bg-black/10 text-[10px] font-bold shrink-0 flex items-center gap-1 transition cursor-pointer"
                          title="Copy message to clipboard"
                        >
                          {copiedTestResult ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-600" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
