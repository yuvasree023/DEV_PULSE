import React, { useState } from 'react';
import { api } from '../../api';
import { CodeQualityAnalysisResult } from '../../types';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Zap,
  Layers,
  Activity,
  FileCode,
} from 'lucide-react';

const SAMPLE_CODES = {
  typescript: `// Target: Legacy payment transaction handler with nested callbacks & type leaks
function processTransaction(payload: any, options: any) {
  var result = null;
  console.log("Starting transaction processing for user", payload.userId);

  if (payload != null) {
    if (payload.amount > 0) {
      if (payload.currency === 'USD' || payload.currency === 'EUR') {
        if (!options.dryRun) {
          result = executeLedgerPost(payload);
          console.log("Transaction successfully executed");
        } else {
          result = { status: 'DRY_RUN_PASS' };
        }
      } else {
        throw new Error("Unsupported currency format");
      }
    } else {
      console.log("Invalid transaction amount: zero or negative");
    }
  }

  return result;
}`,
  python: `# Target: Unoptimized data serialization loop with redundant dict lookups
def calculate_developer_throughput(pull_requests, developer_map):
    aggregated = {}
    for pr in pull_requests:
        user = pr.get('user')
        if user in developer_map:
            if pr.get('state') == 'merged':
                if user not in aggregated:
                    aggregated[user] = {'count': 0, 'cycle_time': 0}
                aggregated[user]['count'] = aggregated[user]['count'] + 1
                aggregated[user]['cycle_time'] += pr.get('cycle_time_hours', 0)
    return aggregated`,
};

export function CodeQualityRefactorView() {
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'python'>('typescript');
  const [inputCode, setInputCode] = useState<string>(SAMPLE_CODES.typescript);
  const [analysis, setAnalysis] = useState<CodeQualityAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await api.analyzeCodeQuality(inputCode, selectedLanguage);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyRefactored = () => {
    if (!analysis?.refactoredCode) return;
    navigator.clipboard.writeText(analysis.refactoredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadPreset = (lang: 'typescript' | 'python') => {
    setSelectedLanguage(lang);
    setInputCode(SAMPLE_CODES[lang]);
    setAnalysis(null);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Code Quality & Refactoring Agent</h2>
            <p className="text-[11px] text-slate-500">
              Evaluates AST cyclomatic complexity, code smells, and synthesizes clean design patterns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadPreset('typescript')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedLanguage === 'typescript'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            TypeScript Sample
          </button>
          <button
            onClick={() => handleLoadPreset('python')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedLanguage === 'python'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Python Sample
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Decomposing AST...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Agent Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Refactor Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Code Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-slate-500" />
              Source Code Input ({selectedLanguage})
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {inputCode.split('\n').length} lines
            </span>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              rows={16}
              placeholder="Paste functions or classes to evaluate..."
              className="w-full h-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Refactored Code Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-600" />
              Refactored Proposal (Yuvasree ML Multi-Agent Engine)
            </span>
            {analysis && (
              <button
                onClick={handleCopyRefactored}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white text-purple-700 hover:bg-purple-100/60 rounded-md border border-purple-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Diff'}</span>
              </button>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            {analysis ? (
              <div className="h-full flex flex-col">
                <textarea
                  readOnly
                  value={analysis.refactoredCode}
                  rows={16}
                  className="w-full h-full font-mono text-xs bg-slate-950 text-emerald-300 p-4 rounded-xl border border-slate-800 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Code2 className="w-12 h-12 text-slate-300 stroke-[1.5] mb-2" />
                <h4 className="text-xs font-bold text-slate-600">No Analysis Executed Yet</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Click "Run Agent Analysis" above to trigger Yuvasree's multi-agent AST parser and automated refactoring pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics & Code Smells Results Grid */}
      {analysis && (
        <div className="space-y-6">
          {/* KPI metric scorecards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Quality Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-700">{analysis.overallScore}</span>
                <span className="text-xs font-bold text-emerald-600">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">AST maintainability index</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cyclomatic Complexity
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{analysis.cyclomaticComplexity}</span>
                <span className="text-xs font-bold text-purple-600">Branch paths</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Optimal range: &lt; 8</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cognitive Load
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{analysis.cognitiveComplexity}</span>
                <span className="text-xs font-bold text-slate-500">Points</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Mental nesting burden</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detected Smells
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-600">{analysis.codeSmellsCount}</span>
                <span className="text-xs font-bold text-slate-500">Violations</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Fixable by refactor agent</span>
            </div>
          </div>

          {/* Actionable Code Smells List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Actionable AST Diagnostics ({analysis.smells.length})
              </h3>
              <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono font-semibold">
                Yuvasree AST Rulebook
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {analysis.smells.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-700 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No code smells detected. Excellent code hygiene!</span>
                </div>
              ) : (
                analysis.smells.map((smell) => (
                  <div key={smell.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            smell.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : smell.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {smell.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{smell.type}</span>
                        <span className="text-[11px] font-mono text-slate-400">Line {smell.line}</span>
                      </div>
                      <p className="text-xs text-slate-600">{smell.message}</p>
                    </div>

                    <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shrink-0 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{smell.fix}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
