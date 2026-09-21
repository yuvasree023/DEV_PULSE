import { useState, useEffect } from 'react';
import { api } from '../api';
import { DatasetInfoResponse } from '../types';
import { Database, Upload, RefreshCw, AlertCircle, CheckCircle2, X, FileText, RotateCcw } from 'lucide-react';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetUpdated: () => void;
}

export function DatasetModal({ isOpen, onClose, onDatasetUpdated }: DatasetModalProps) {
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [prFile, setPrFile] = useState<File | null>(null);
  const [reviewsFile, setReviewsFile] = useState<File | null>(null);
  const [repoFile, setRepoFile] = useState<File | null>(null);

  const fetchInfo = async () => {
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
    if (isOpen) {
      fetchInfo();
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prFile && !reviewsFile && !repoFile) {
      setStatusMsg({ type: 'error', text: 'Please select at least one .json or .parquet dataset file to upload.' });
      return;
    }

    setUploading(true);
    setStatusMsg(null);
    try {
      const res = await api.uploadDataset({ prFile, reviewsFile, repoFile });
      setStatusMsg({ type: 'success', text: res.message || 'Dataset uploaded and metrics recalculated successfully!' });
      setPrFile(null);
      setReviewsFile(null);
      setRepoFile(null);
      await fetchInfo();
      onDatasetUpdated();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Upload failed due to schema validation or format error.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setStatusMsg(null);
    try {
      const res = await api.resetDataset();
      setStatusMsg({ type: 'success', text: res.message || 'Dataset successfully reset to default baseline!' });
      await fetchInfo();
      onDatasetUpdated();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Reset failed.' });
    } finally {
      setResetting(false);
    }
  };

  const meta = datasetInfo?.meta || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="dataset-management-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Dataset Management & Evaluator Drop
              </h3>
              <p className="text-[11px] text-slate-500">
                Inspect active dataset or upload custom JSON / Parquet files to verify dynamic recalculation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Active Dataset Stats */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Currently Loaded Telemetry
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Valid Dataset
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">Pull Requests</span>
                <span className="text-base font-bold text-slate-900">
                  {meta.total_prs != null ? meta.total_prs.toLocaleString() : '—'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate">
                  {meta.pr_file || 'pull_request'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">PR Reviews</span>
                <span className="text-base font-bold text-slate-900">
                  {meta.total_reviews != null ? meta.total_reviews.toLocaleString() : '—'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate">
                  {meta.reviews_file || 'pr_reviews'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">Repositories</span>
                <span className="text-base font-bold text-slate-900">
                  {meta.total_repos != null ? meta.total_repos.toLocaleString() : '—'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate">
                  {meta.repo_file || 'repository'}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Form for Evaluator */}
          <form onSubmit={handleUpload} className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800">
              Upload New Evaluator Dataset (.json or .parquet):
            </h4>

            <div className="space-y-3">
              {/* PR File */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 bg-white hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      Pull Requests File (pull_request.json / .parquet)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {prFile ? prFile.name : 'Required schema: id, number, title, body, agent, user, state, created_at, merged_at...'}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json,.parquet"
                  id="file-pr"
                  className="hidden"
                  onChange={(e) => setPrFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="file-pr"
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                >
                  {prFile ? 'Change' : 'Choose File'}
                </label>
              </div>

              {/* Reviews File */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 bg-white hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      Reviews File (pr_reviews.json / .parquet)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {reviewsFile ? reviewsFile.name : 'Required schema: id, pr_id, user, user_type, state, submitted_at, body'}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json,.parquet"
                  id="file-rev"
                  className="hidden"
                  onChange={(e) => setReviewsFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="file-rev"
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                >
                  {reviewsFile ? 'Change' : 'Choose File'}
                </label>
              </div>

              {/* Repos File */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 bg-white hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      Repositories File (repository.json / .parquet)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {repoFile ? repoFile.name : 'Required schema: id, url, license, full_name, is_forked, language, forks, stars'}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json,.parquet"
                  id="file-repo"
                  className="hidden"
                  onChange={(e) => setRepoFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="file-repo"
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                >
                  {repoFile ? 'Change' : 'Choose File'}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset to Baseline</span>
              </button>

              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating & Computing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Recalculate Metrics</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
