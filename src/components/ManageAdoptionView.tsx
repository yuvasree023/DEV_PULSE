import { Users, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ToolIconRenderer } from './ToolIcons';

export function ManageAdoptionView() {
  const teams = [
    { name: 'Core Infrastructure', totalDevs: 48, aiActive: 44, topTool: 'copilot', adoptionPct: 92 },
    { name: 'Payment & Billing', totalDevs: 36, aiActive: 31, topTool: 'cursor', adoptionPct: 86 },
    { name: 'AI & Data Lakehouse', totalDevs: 52, aiActive: 49, topTool: 'gemini', adoptionPct: 94 },
    { name: 'Frontend Applications', totalDevs: 64, aiActive: 38, topTool: 'cursor', adoptionPct: 59 },
    { name: 'Mobile (iOS/Android)', totalDevs: 40, aiActive: 19, topTool: 'copilot', adoptionPct: 48 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Manage Adoption
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Seat distribution, team-by-team rollout stages, and license utilization efficiency
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total AI Licenses</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">864</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 88.2% Active Allocation
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Daily Users</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">605</div>
          <div className="text-xs text-purple-600 font-semibold mt-1">
            +14% week-over-week adoption
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multi-Tool Power Users</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">28%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Using both IDE assistant + Terminal agent
          </div>
        </div>
      </div>

      {/* Team adoption table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Department & Squad Adoption Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                <th className="pb-3 pl-1">Team</th>
                <th className="pb-3 px-3">Developers</th>
                <th className="pb-3 px-3">Active on AI</th>
                <th className="pb-3 px-3">Primary Tool</th>
                <th className="pb-3 px-3">Adoption Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {teams.map((t) => (
                <tr key={t.name} className="hover:bg-slate-50/60">
                  <td className="py-3.5 pl-1 font-semibold text-slate-800">{t.name}</td>
                  <td className="py-3.5 px-3 text-slate-600">{t.totalDevs} devs</td>
                  <td className="py-3.5 px-3 text-slate-900 font-medium">{t.aiActive} devs</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <ToolIconRenderer id={t.topTool} className="w-4 h-4" />
                      <span className="capitalize text-slate-700">{t.topTool}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${t.adoptionPct}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{t.adoptionPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
