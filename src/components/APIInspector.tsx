import { useState, useEffect } from 'react';
import { api } from '../api';
import { DatasetInfoResponse } from '../types';
import { Database, Upload, RefreshCw, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowUpRight, RotateCcw } from 'lucide-react';

export function APIInspector() {
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [prFile, setPrFile] = useState<File | null>(null);
  const [reviewsFile, setReviewsFile] = useState<File | null>(null);
  const [repoFile, setRepoFile] = useState<File | null>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'endpoints'>('upload');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/overview');
  const [endpointResponse, setEndpointResponse] = useState<any>(null);
  const [fetchingEndpoint, setFetchingEndpoint] = useState(false);

  const loadInfo = async () => {
    setLoading(true);
    try {
      const data = await api.getDatasetInfo();
      setDatasetInfo(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prFile && !reviewsFile && !repoFile) {
      setUploadMessage({ type: 'error', text: 'Please select at least one Parquet file to upload.' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.uploadDataset({ prFile, reviewsFile, repoFile });
      setUploadMessage({ type: 'success', text: res.message || 'Dataset uploaded and hot-reloaded successfully!' });
      setPrFile(null);
      setReviewsFile(null);
      setRepoFile(null);
      await loadInfo();
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message || 'Dataset upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.resetDataset();
      setUploadMessage({ type: 'success', text: res.message || 'Dataset reset to default.' });
      await loadInfo();
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message || 'Reset failed.' });
    } finally {
      setUploading(false);
    }
  };

  const testEndpoint = async (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    setFetchingEndpoint(true);
    try {
      let data: any;
      if (endpoint === '/api/overview') data = await api.getOverview();
      else if (endpoint === '/api/ai-impact') data = await api.getAIImpact();
      else if (endpoint === '/api/ai-tools') data = await api.getAITools();
      else if (endpoint === '/api/people') data = await api.getPeople(5);
      else if (endpoint === '/api/projects') data = await api.getProjects(5);
      else if (endpoint === '/api/ml-insights') data = await api.getMLInsights(4);
      setEndpointResponse(data);
    } catch (err: any) {
      setEndpointResponse({ error: err.message });
    } finally {
      setFetchingEndpoint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Active Dataset Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Active Parquet Telemetry Engine
              </h2>
              <p className="text-xs text-slate-500">
                Dynamic Schema Validation & Ingestion Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Defaults</span>
            </button>
            <button
              onClick={loadInfo}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dataset Stats Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pull Requests File
            </div>
            <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <span>{datasetInfo?.meta?.pr_file || 'pull_request.parquet'}</span>
            </div>
            <div className="text-xs text-purple-700 font-semibold mt-0.5">
              {(datasetInfo?.meta?.total_prs || 0).toLocaleString()} PR records loaded
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              PR Reviews File
            </div>
            <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>{datasetInfo?.meta?.reviews_file || 'pr_reviews.parquet'}</span>
            </div>
            <div className="text-xs text-indigo-700 font-semibold mt-0.5">
              {(datasetInfo?.meta?.total_reviews || 0).toLocaleString()} reviews loaded
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Repositories File
            </div>
            <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>{datasetInfo?.meta?.repo_file || 'repository.parquet'}</span>
            </div>
            <div className="text-xs text-blue-700 font-semibold mt-0.5">
              {(datasetInfo?.meta?.total_repos || 0).toLocaleString()} repos loaded
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'upload'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Dynamic Dataset Uploader
        </button>
        <button
          onClick={() => {
            setActiveTab('endpoints');
            if (!endpointResponse) testEndpoint('/api/overview');
          }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'endpoints'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Live API Inspector
        </button>
      </div>

      {activeTab === 'upload' ? (
        /* Upload Form */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Evaluator Parquet File Ingestion
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload alternative Parquet datasets with matching schemas to test dynamic metrics recalculation and hot-reloading.
            </p>
          </div>

          {uploadMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {uploadMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* pull_request.parquet input */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  1. pull_request.parquet
                </span>
                <input
                  type="file"
                  accept=".parquet"
                  onChange={(e) => setPrFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {prFile && (
                  <p className="text-[11px] text-purple-700 font-mono">{prFile.name}</p>
                )}
              </div>

              {/* pr_reviews.parquet input */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  2. pr_reviews.parquet
                </span>
                <input
                  type="file"
                  accept=".parquet"
                  onChange={(e) => setReviewsFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {reviewsFile && (
                  <p className="text-[11px] text-purple-700 font-mono">{reviewsFile.name}</p>
                )}
              </div>

              {/* repository.parquet input */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  3. repository.parquet
                </span>
                <input
                  type="file"
                  accept=".parquet"
                  onChange={(e) => setRepoFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {repoFile && (
                  <p className="text-[11px] text-purple-700 font-mono">{repoFile.name}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || (!prFile && !reviewsFile && !repoFile)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Validating & Ingesting...' : 'Upload & Refresh Dashboard'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Endpoints Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoint buttons */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Available REST Endpoints
            </h3>
            {[
              { path: '/api/overview', label: 'GET /api/overview' },
              { path: '/api/ai-impact', label: 'GET /api/ai-impact' },
              { path: '/api/ai-tools', label: 'GET /api/ai-tools' },
              { path: '/api/people', label: 'GET /api/people' },
              { path: '/api/projects', label: 'GET /api/projects' },
              { path: '/api/ml-insights', label: 'GET /api/ml-insights' },
            ].map((ep) => (
              <button
                key={ep.path}
                onClick={() => testEndpoint(ep.path)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  selectedEndpoint === ep.path
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {ep.label}
              </button>
            ))}
          </div>

          {/* Response payload viewer */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 shadow-xs overflow-hidden flex flex-col space-y-2 text-white">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold">{selectedEndpoint}</span>
              {fetchingEndpoint && (
                <span className="text-purple-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Querying...
                </span>
              )}
            </div>

            <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto overflow-y-auto max-h-[380px] p-2 leading-relaxed">
              {JSON.stringify(endpointResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
