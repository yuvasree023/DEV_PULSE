import React from 'react';
import { AlertCircle, RefreshCw, Server, ExternalLink } from 'lucide-react';
import { API_BASE, ApiError } from '../api';

interface ErrorCardProps {
  title?: string;
  error: Error | string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorCard({
  title = 'Failed to load telemetry',
  error,
  onRetry,
  isRetrying = false,
}: ErrorCardProps) {
  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : null;
  const url = isApiError ? error.url : (typeof error === 'string' && error.includes('http') ? error : `${API_BASE || 'current origin'}`);
  const message = error instanceof Error ? error.message : (error || 'Unknown error occurred');

  return (
    <div className="p-6 rounded-2xl bg-white border border-red-200 shadow-sm space-y-4 my-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Could not retrieve telemetry from backend service
            </p>
          </div>
        </div>

        {status != null && status > 0 && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-100 text-red-700">
            HTTP {status}
          </span>
        )}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-600 text-[11px]">
          <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-700">
            <Server className="w-3.5 h-3.5 text-purple-600" />
            Target Endpoint:
          </span>
          <span className="text-slate-500 truncate max-w-[320px]">{url}</span>
        </div>
        <div className="text-red-700 font-medium break-all whitespace-pre-wrap font-sans text-xs">
          {message}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="text-[11px] text-slate-500">
          {status === 404 ? (
            <span>Endpoint not found. Verify backend deployment and URL configuration.</span>
          ) : status === 0 ? (
            <span>Backend server is offline or waking up from sleep (Render free tier).</span>
          ) : (
            <span>Check server logs or verify your backend configuration.</span>
          )}
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Reconnecting...' : 'Retry Request'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
