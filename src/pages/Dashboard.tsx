import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import { 
  Folder, 
  CheckCircle2, 
  AlertTriangle, 
  ListTodo, 
  TrendingUp, 
  Users,
  Activity,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
  Layers,
  PlusCircle,
  PlusSquare,
  UserPlus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, projects, members, activities, seedDatabase, teams } = useWorkspace();
  const { theme } = useTheme();
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    async function fetchTasks() {
      setLoadingTasks(true);
      try {
        if (projects.length === 0) {
          setAllTasks([]);
          setLoadingTasks(false);
          return;
        }
        
        const projectIds = projects.map(p => p.id);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .in('project_id', projectIds);
        
        if (!error && data) {
          setAllTasks(data);
        } else {
          const dbState = JSON.parse(localStorage.getItem('taskflow_mock_db') || '{}');
          const localTasks = (dbState.tasks || []).filter((t: any) => projectIds.includes(t.project_id));
          setAllTasks(localTasks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTasks(false);
      }
    }

    fetchTasks();
  }, [projects]);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedStatus('idle');
    const { success } = await seedDatabase();
    if (success) {
      setSeedStatus('success');
      window.location.reload();
    } else {
      setSeedStatus('error');
    }
    setSeeding(false);
  };

  // Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalTasks = allTasks.length;
  const totalTeams = teams.length;

  const now = new Date();
  const overdueTasks = allTasks.filter((t: any) => {
    if (t.status === 'completed' || !t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  // Chart data completion trends
  const trendData = [
    { week: 'Week 1', completed: 6, active: 10 },
    { week: 'Week 2', completed: 12, active: 15 },
    { week: 'Week 3', completed: 18, active: 12 },
    { week: 'Week 4', completed: 25, active: 16 },
    { week: 'Week 5', completed: 34, active: 11 },
  ];

  // Workload mapping
  const workloadData = members.map(m => {
    const memberTasks = allTasks.filter((t: any) => t.assignee_id === m.user_id);
    return {
      name: (m.profile?.full_name || 'User').split(' ')[0],
      tasks: memberTasks.length,
      avatar: m.profile?.avatar_url
    };
  });

  const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];

  const formatActivityTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-2xl mx-auto text-center animate-in fade-in duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/20 mb-6 animate-pulse">
          <Sparkles size={28} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white md:text-3xl mb-3">Welcome to TaskFlow!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          Your dashboard space is connected and ready to sync.
          Seed this workspace environment with standard Linear-style team setups, project structures, and board tasks automatically.
        </p>
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white hover:from-brand-500 hover:to-indigo-500 transition-all shadow-lg shadow-brand-500/10 disabled:opacity-50"
          >
            {seeding ? (
              <span>Seeding Database...</span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Seed Database with Mock Data</span>
              </>
            )}
          </button>
          {seedStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <Check size={14} />
              <span>Workspace seeded successfully! Reloading...</span>
            </span>
          )}
          {seedStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
              <X size={14} />
              <span>Failed to seed database. Verify local storage parameters.</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white md:text-3xl">
            {activeWorkspace.name} Overview
          </h2>
          <p className="text-sm text-slate-550 dark:text-slate-400">Track and monitor your workspace progress and team metrics.</p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="glass-card rounded-2xl p-5 shadow-xs hover:border-brand-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teams</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-550 dark:text-indigo-400">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{totalTeams}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Layers</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs hover:border-brand-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projects</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-550 dark:text-blue-400">
              <Folder size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{totalProjects}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Active: {activeProjects}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs hover:border-brand-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Successes</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-555 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{completedProjects}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Done</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs hover:border-brand-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tasks</span>
            <div className="rounded-xl bg-brand-500/10 p-2 text-brand-550 dark:text-brand-400">
              <ListTodo size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{totalTasks}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Assigned</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs hover:border-brand-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue</span>
            <div className={`rounded-xl p-2 ${overdueTasks > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold leading-none ${overdueTasks > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-805 dark:text-white'}`}>{overdueTasks}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Attention</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs hover:border-brand-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Members</span>
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-550 dark:text-violet-400">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{members.length}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left shadow-xs"
          >
            <PlusSquare size={14} className="text-brand-500" />
            <span>Create Project</span>
          </button>
          <button 
            onClick={() => navigate('/teams')}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left shadow-xs"
          >
            <PlusCircle size={14} className="text-violet-500" />
            <span>Create Team</span>
          </button>
          <button 
            onClick={() => navigate('/members')}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left shadow-xs"
          >
            <UserPlus size={14} className="text-emerald-500" />
            <span>Invite Teammate</span>
          </button>
          <button 
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left shadow-xs"
          >
            <PlusCircle size={14} className="text-cyan-500" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Analytics Recharts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* area chart */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brand-500" size={16} />
              <h3 className="text-xs font-bold text-slate-705 dark:text-slate-200 uppercase tracking-wider">Productivity Trends</h3>
            </div>
            <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-605 dark:text-brand-400 border border-brand-500/20">Active Log</span>
          </div>

          <div className="h-64 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="week" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={theme === 'dark' ? { backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                  labelStyle={theme === 'dark' ? { fontWeight: 'bold', color: '#f8fafc' } : { fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* bar chart */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Users className="text-violet-500" size={16} />
            <h3 className="text-xs font-bold text-slate-705 dark:text-slate-200 uppercase tracking-wider">Workload Distribution</h3>
          </div>

          <div className="h-64 w-full text-[10px]">
            {workloadData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                <p>No member workloads found</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip
                    contentStyle={theme === 'dark' ? { backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                    labelStyle={theme === 'dark' ? { fontWeight: 'bold', color: '#f8fafc' } : { fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Bar dataKey="tasks" name="Tasks Count" radius={[4, 4, 0, 0]}>
                    {workloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline and Directory Directory */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent logs */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Activity className="text-brand-500" size={16} />
            <h3 className="text-xs font-bold text-slate-755 dark:text-slate-200 uppercase tracking-wider">Recent Workspace Activities</h3>
          </div>

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {activities.slice(0, 10).map((act) => (
              <div key={act.id} className="flex gap-3 text-xs border-b border-slate-100/60 dark:border-slate-850/60 pb-3 last:border-0 last:pb-0">
                {act.profile?.avatar_url ? (
                  <img src={act.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 mt-0.5 shrink-0" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-205 dark:bg-slate-800 text-slate-600 font-bold text-[9px] mt-0.5 shrink-0">
                    {(act.profile?.full_name || 'US').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-slate-600 dark:text-slate-305 leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-100 font-bold">{act.profile?.full_name || 'System User'}</strong>
                    {' '}{act.action}{' '}
                    <span className="rounded bg-slate-105 dark:bg-slate-850 px-1.5 py-0.5 text-[9px] text-slate-700 dark:text-slate-300 font-mono font-semibold">
                      {act.target_type}: {act.target_name}
                    </span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold">{formatActivityTime(act.created_at)}</p>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="py-8 text-center text-slate-500">
                <p>No activity logs recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Members Quick List */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Users className="text-violet-500" size={16} />
              <h3 className="text-xs font-bold text-slate-755 dark:text-slate-200 uppercase tracking-wider">Teammates</h3>
            </div>
            <button 
              onClick={() => navigate('/members')}
              className="flex items-center gap-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              <span>Directory</span>
              <ArrowUpRight size={10} />
            </button>
          </div>

          <div className="space-y-4">
            {members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200/50 shadow-xs shrink-0" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-205 dark:bg-slate-800 text-slate-600 font-bold text-[10px]">
                      {(member.profile?.full_name || 'US').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">{member.profile?.full_name}</p>
                    <p className="text-[9px] text-slate-455 truncate mt-1 leading-none">{member.profile?.email}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold border uppercase ${
                  member.role === 'owner' 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/15' 
                    : member.role === 'manager'
                    ? 'bg-brand-500/10 text-brand-600 border-brand-500/15'
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
