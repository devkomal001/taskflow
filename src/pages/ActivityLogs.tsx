import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Activity, 
  Search, 
  User, 
  Clock, 
  ArrowLeft,
  RefreshCcw
} from 'lucide-react';

const ActivityLogs: React.FC = () => {
  const { activeWorkspace, activities, members, refreshWorkspaceData } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-md mx-auto text-center text-slate-805 dark:text-white">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-105 dark:bg-slate-900 text-slate-400 dark:text-slate-500 mb-4 border border-slate-200 dark:border-slate-800">
          <Activity size={24} />
        </div>
        <h3 className="text-lg font-bold">Workspace Required</h3>
        <p className="text-xs text-slate-555 mt-2 leading-relaxed">
          Please select or create a workspace first to view activity feeds.
        </p>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWorkspaceData();
    setIsRefreshing(false);
  };

  const filteredLogs = activities.filter(log => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = log.action.toLowerCase().includes(query) || 
      log.target_type.toLowerCase().includes(query) || 
      log.target_name.toLowerCase().includes(query) ||
      (log.profile?.full_name || '').toLowerCase().includes(query);

    const matchesUser = filterUser === 'all' || log.user_id === filterUser;

    return matchesSearch && matchesUser;
  });

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto transition-colors duration-200">
      {/* Top Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white md:text-3xl">Workspace Activity Log</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Audit timeline logging team interactions, project updates, and task details.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-705 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-xs disabled:opacity-50 shrink-0"
        >
          <RefreshCcw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-202 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter logs by action, target or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 py-3 pl-10 pr-4 text-xs focus:border-brand-500/80 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 py-3 px-4 text-xs text-slate-705 dark:text-slate-300 focus:outline-none cursor-pointer shrink-0"
        >
          <option value="all">All Teammates</option>
          {members.map(m => (
            <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
          ))}
        </select>
      </div>

      {/* Activity Timeline List */}
      <div className="rounded-2xl border border-slate-202 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 p-6 shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Activity className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={32} />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-305">No Logs Found</h4>
            <p className="text-xs text-slate-455 max-w-xs mx-auto mt-1">No activities matching your query were recorded in this workspace.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative group animate-in fade-in slide-in-from-left-2 duration-200">
                {/* Visual Bullet Icon */}
                <div className="absolute -left-[31px] top-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-slate-950 border-2 border-brand-500 shadow-xs group-hover:scale-110 transition-transform">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                </div>

                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3 text-xs leading-relaxed">
                    {log.profile?.avatar_url ? (
                      <img 
                        src={log.profile.avatar_url} 
                        alt="" 
                        className="h-8 w-8 rounded-full object-cover border border-slate-200/50 mt-0.5" 
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-250 dark:bg-slate-800 text-slate-600 font-bold border border-slate-300 text-[9px] mt-0.5">
                        {(log.profile?.full_name || 'US').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-slate-600 dark:text-slate-305">
                        <strong className="text-slate-800 dark:text-slate-100 font-bold">{log.profile?.full_name || 'System User'}</strong>
                        {' '}{log.action}{' '}
                        <span className="rounded bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono font-semibold">
                          {log.target_type}: {log.target_name}
                        </span>
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold">
                        <Clock size={10} />
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
