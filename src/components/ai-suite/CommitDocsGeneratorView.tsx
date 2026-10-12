import React, { useState } from 'react';
import { api } from '../../api';
import { CommitDocsResult } from '../../types';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  GitCommit,
  BookOpen,
  Terminal,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';

const SAMPLE_DIFFS = {
  feature: `diff --git a/src/services/productivityEngine.ts b/src/services/productivityEngine.ts
index a12bc4..e99f01 100644
--- a/src/services/productivityEngine.ts
+++ b/src/services/productivityEngine.ts
@@ -14,6 +14,18 @@ export class ProductivityEngine {
+  public computeFlowStateIndex(activeMinutes: number, contextSwitches: number): FlowScore {
+    // Weighted regression evaluating continuous focus versus interruptions
+    const focusBase = Math.min(100, (activeMinutes / 240) * 85);
+    const penalty = contextSwitches * 4.5;
+    const finalIndex = Math.max(0, Math.min(100, Math.round(focusBase - penalty)));
+    return { index: finalIndex, timestamp: new Date().toISOString() };
+  }
+
   public pulseUpdate() {
     this.metrics = this.computeMetrics();
     this.notify();
   }`,
  bugfix: `diff --git a/src/api.ts b/src/api.ts
index bb4412..dd3309 100644
--- a/src/api.ts
+++ b/src/api.ts
@@ -48,7 +48,7 @@ async function fetchJson<T>(endpoint: string): Promise<T> {
-    if (response.status === 500) throw new Error("Internal Server Error");
+    if (!response.ok) {
+      const errText = await response.text().catch(() => "Unknown");
+      throw new ApiError(\`HTTP \${response.status}: \${errText}\`, response.status, url, endpoint);
+    }`,
};

export function CommitDocsGeneratorView() {
  const [diffInput, setDiffInput] = useState<string>(SAMPLE_DIFFS.feature);
  const [result, setResult] = useState<CommitDocsResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedCommit, setCopiedCommit] = useState(false);
  const [copiedDocs, setCopiedDocs] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await api.generateCommitDocs(diffInput);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Commit Message & Documentation Generator</h2>
            <p className="text-[11px] text-slate-500">
              Synthesizes Conventional Commits, JSDoc/TypeDoc annotations, and changelogs from git diffs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDiffInput(SAMPLE_DIFFS.feature);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Feature Diff
          </button>
          <button
            onClick={() => {
              setDiffInput(SAMPLE_DIFFS.bugfix);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Bugfix Diff
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Docs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Commit & Docs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Diff Input Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-purple-600" />
            Git Diff / Changes Input
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Paste `git diff` output or code modifications
          </span>
        </div>
        <textarea
          value={diffInput}
          onChange={(e) => setDiffInput(e.target.value)}
          rows={7}
          className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
          placeholder="Paste diff or git status..."
          spellCheck={false}
        />
      </div>

      {/* Results View */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conventional Commit Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-purple-600" />
                Synthesized Conventional Commit
              </span>
              <button
                onClick={() => copyToClipboard(result.conventionalCommit, setCopiedCommit)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedCommit ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCommit ? 'Copied' : 'Copy Commit'}</span>
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
                  {result.commitType}
                </span>
                <span className="text-xs font-mono text-slate-500">scope: ({result.scope})</span>
              </div>

              <div className="bg-slate-900 text-emerald-300 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800">
                {result.conventionalCommit}
              </div>

              {/* Ready-to-run terminal snippet */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    CLI Command
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(`git commit -m "${result.conventionalCommit.replace(/"/g, '\\"')}"`, setCopiedCommand)
                    }
                    className="text-[10px] text-purple-600 hover:underline font-semibold cursor-pointer"
                  >
                    {copiedCommand ? 'Copied Command!' : 'Copy Terminal String'}
                  </button>
                </div>
                <div className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-nowrap">
                  git commit -m "{result.conventionalCommit.split('\n')[0]}"
                </div>
              </div>
            </div>
          </div>

          {/* Documentation & Docstrings Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Generated JSDoc & Changelog Entry
              </span>
              <button
                onClick={() =>
                  copyToClipboard(result.docstrings.map((d) => d.jsDoc).join('\n\n'), setCopiedDocs)
                }
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedDocs ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDocs ? 'Copied' : 'Copy All Docs'}</span>
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[460px]">
              {result.docstrings.map((doc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="font-mono text-purple-700">{doc.functionName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{doc.signature}</span>
                  </div>
                  <pre className="bg-slate-950 text-sky-300 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                    {doc.jsDoc}
                  </pre>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">Markdown Changelog Entry</span>
                <pre className="bg-slate-50 text-slate-700 p-3 rounded-xl font-mono text-[11px] whitespace-pre-wrap border border-slate-200">
                  {result.changelogSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
