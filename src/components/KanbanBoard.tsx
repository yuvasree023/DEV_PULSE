import { useState } from 'react';
import { PullRequest } from '../types';
import { Bot, User, Clock, CheckCircle2, Plus, ListTodo } from 'lucide-react';
import { ToolIconRenderer } from './ToolIcons';

interface KanbanTask {
  id: string;
  title: string;
  assignee: string;
  status: 'TODO' | 'IN PROGRESS' | 'IN REVIEW' | 'DONE';
  projectStatus: 'PLANNED' | 'ACTIVE' | 'AT RISK' | 'COMPLETED';
  agentTag?: string;
  repo: string;
}

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: 'TASK-101',
    title: 'Migrate parquet reader from polars to pyarrow dynamic stream',
    assignee: 'alex.chen',
    status: 'IN REVIEW',
    projectStatus: 'ACTIVE',
    agentTag: 'OpenAI_Codex',
    repo: 'devpulse/pipeline'
  },
  {
    id: 'TASK-102',
    title: 'Validate required schema columns & reject malformed uploads',
    assignee: 'sarah.k',
    status: 'DONE',
    projectStatus: 'COMPLETED',
    agentTag: 'Copilot',
    repo: 'devpulse/backend'
  },
  {
    id: 'TASK-103',
    title: 'Implement Scikit-Learn K-Means explainable developer clustering',
    assignee: 'marcus.v',
    status: 'IN PROGRESS',
    projectStatus: 'ACTIVE',
    agentTag: 'Cursor',
    repo: 'devpulse/ml-insights'
  },
  {
    id: 'TASK-104',
    title: 'Add ground truth strictness checks to Gemini explanation service',
    assignee: 'elena.r',
    status: 'TODO',
    projectStatus: 'PLANNED',
    agentTag: 'Devin',
    repo: 'devpulse/gemini-service'
  },
  {
    id: 'TASK-105',
    title: 'Hot-reload dashboard on evaluator parquet file drop',
    assignee: 'jordan.m',
    status: 'IN REVIEW',
    projectStatus: 'ACTIVE',
    agentTag: 'Claude_Code',
    repo: 'devpulse/frontend'
  },
];

interface KanbanBoardProps {
  prs?: PullRequest[];
  onInspectBlocker?: (pr: PullRequest) => void;
}

export function KanbanBoard({ onInspectBlocker }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [activeProjectFilter, setActiveProjectFilter] = useState<string>('ALL');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newStatus, setNewStatus] = useState<'TODO' | 'IN PROGRESS' | 'IN REVIEW' | 'DONE'>('TODO');
  const [newProjStatus, setNewProjStatus] = useState<'PLANNED' | 'ACTIVE' | 'AT RISK' | 'COMPLETED'>('ACTIVE');

  const filteredTasks = tasks.filter((t) => {
    if (activeProjectFilter === 'ALL') return true;
    return t.projectStatus === activeProjectFilter;
  });

  const columns: Array<{ id: 'TODO' | 'IN PROGRESS' | 'IN REVIEW' | 'DONE'; title: string; color: string }> = [
    { id: 'TODO', title: 'TODO', color: 'bg-slate-100 text-slate-700' },
    { id: 'IN PROGRESS', title: 'IN PROGRESS', color: 'bg-blue-100 text-blue-700' },
    { id: 'IN REVIEW', title: 'IN REVIEW', color: 'bg-purple-100 text-purple-700' },
    { id: 'DONE', title: 'DONE', color: 'bg-emerald-100 text-emerald-700' },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: KanbanTask = {
      id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      assignee: newAssignee.trim() || 'unassigned',
      status: newStatus,
      projectStatus: newProjStatus,
      repo: 'devpulse/app'
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewAssignee('');
    setIsAddingTask(false);
  };

  return (
    <div id="kanban-section" className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Sprint & PR Task Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational task board isolated from historical dataset analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Project Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
            {['ALL', 'PLANNED', 'ACTIVE', 'AT RISK', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveProjectFilter(status)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeProjectFilter === status
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal / Form */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-900">Create Operational Task</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Assignee (e.g. dev.user)"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="TODO">TODO</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="IN REVIEW">IN REVIEW</option>
              <option value="DONE">DONE</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer shadow-2xs"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 flex flex-col"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-purple-700">
                          {task.id}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            task.projectStatus === 'ACTIVE'
                              ? 'bg-blue-50 text-blue-700'
                              : task.projectStatus === 'AT RISK'
                              ? 'bg-red-50 text-red-700'
                              : task.projectStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.projectStatus}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-800 leading-snug">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1 font-mono">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{task.assignee}</span>
                        </div>
                        {task.agentTag && (
                          <div className="flex items-center gap-1 font-semibold text-purple-700">
                            <ToolIconRenderer id={task.agentTag.toLowerCase()} className="w-3 h-3" />
                            <span>{task.agentTag.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
