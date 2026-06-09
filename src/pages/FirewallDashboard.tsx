import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useFirewall } from '../context/FirewallContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Shield, 
  ShieldAlert, 
  ShieldOff, 
  Activity, 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Globe, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string;
  attempts_count: number;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const FirewallDashboard: React.FC = () => {
  const { clientIp, logAuditEvent } = useFirewall();
  const { theme } = useTheme();
  
  // Data States
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Actions Form
  const [searchTerm, setSearchTerm] = useState('');
  const [blockIpInput, setBlockIpInput] = useState('');
  const [blockReason, setBlockReason] = useState('Manual admin restriction');
  const [blockDuration, setBlockDuration] = useState('60'); // Minutes
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load dashboard data
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: blockedData } = await supabase
        .from('firewall_blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });
      
      setBlockedIps(blockedData || []);

      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Failed to load firewall data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle manual blocking
  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!blockIpInput.trim()) return;

    setActionLoading(true);
    const expiresAt = new Date(Date.now() + parseInt(blockDuration) * 60 * 1000);

    try {
      const { error } = await supabase
        .from('firewall_blocked_ips')
        .insert({
          ip_address: blockIpInput.trim(),
          reason: blockReason,
          expires_at: expiresAt.toISOString(),
          attempts_count: 1
        });

      if (error) throw error;

      await logAuditEvent('Manual Blocked IP', `Admin blocked IP: ${blockIpInput.trim()}`);
      setBlockIpInput('');
      setBlockReason('Manual admin restriction');
      setMessage({ text: `IP Address ${blockIpInput} blocked successfully.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to block IP.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle manual unblocking
  const handleUnblock = async (ipAddress: string) => {
    setMessage(null);
    try {
      const { error } = await supabase
        .from('firewall_blocked_ips')
        .delete()
        .eq('ip_address', ipAddress);

      if (error) throw error;

      await logAuditEvent('Manual Unblocked IP', `Admin unblocked IP: ${ipAddress}`);
      setMessage({ text: `IP Address ${ipAddress} unblocked successfully.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to unblock IP.', type: 'error' });
    }
  };

  // Filter audit logs based on search term
  const filteredLogs = auditLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    return (
      (log.email && log.email.toLowerCase().includes(search)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(search)) ||
      log.action.toLowerCase().includes(search)
    );
  });

  // Calculate statistics
  const totalBlocked = blockedIps.length;
  const failedLoginsCount = auditLogs.filter(l => l.action.includes('Failed Login')).length;
  const blockedAttemptsCount = auditLogs.filter(l => l.action.includes('Blocked')).length;
  const totalAuditsCount = auditLogs.length;

  // Prepare chart data (aggregating actions over time)
  const getChartData = () => {
    const days: Record<string, { date: string; FailedAttempts: number; BlockedReqs: number; SuccessLogins: number }> = {};
    
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      days[dateString] = { date: dateString, FailedAttempts: 0, BlockedReqs: 0, SuccessLogins: 0 };
    }

    auditLogs.forEach(log => {
      const logDate = new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (days[logDate]) {
        if (log.action.includes('Failed Login')) {
          days[logDate].FailedAttempts += 1;
        } else if (log.action.includes('Blocked')) {
          days[logDate].BlockedReqs += 1;
        } else if (log.action.includes('Login Success')) {
          days[logDate].SuccessLogins += 1;
        }
      }
    });

    return Object.values(days);
  };

  const chartData = getChartData();

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('success')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (act.includes('failed')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (act.includes('blocked')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    return 'bg-blue-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20';
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      {/* Title Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Application Security Firewall</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor failed authentication attempts, rate limits, and block suspicious client IPs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-450 shadow-xs">
            <Globe size={14} className="text-brand-500 dark:text-brand-400" />
            <span>Client IP: <strong className="text-slate-800 dark:text-slate-200">{clientIp}</strong></span>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-605 dark:text-slate-202 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Reload Logs</span>
          </button>
        </div>
      </div>

      {/* Message Popup */}
      {message && (
        <div className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-semibold animate-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' 
            : 'border-rose-500/20 bg-rose-500/5 text-rose-655 dark:text-rose-400'
        }`}>
          <CheckCircle2 size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/35 p-5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Blocked IP Addresses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert size={16} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-white">{totalBlocked}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1.5">Currently blacklisted from logins</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/35 p-5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Failed Login Attempts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Shield size={16} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-white">{failedLoginsCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1.5">Exceeding password triggers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/35 p-5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Blocked Requests</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
              <ShieldOff size={16} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-white">{blockedAttemptsCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1.5">Rate limit thresholds hit</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/35 p-5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Security Events</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Activity size={16} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-white">{totalAuditsCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1.5">Total audit logs recorded</p>
        </div>
      </div>

      {/* Main Firewall Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Manual Block + Active Blocked List */}
        <div className="space-y-6 lg:col-span-1">
          {/* Manual Block Form */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/25 p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
              <Plus size={16} className="text-brand-500 dark:text-brand-400" />
              <span>Manually Block IP</span>
            </h3>
            <form onSubmit={handleManualBlock} className="space-y-4 text-slate-800 dark:text-slate-105">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">IP Address</label>
                <input
                  id="block-ip-address"
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.100"
                  value={blockIpInput}
                  onChange={(e) => setBlockIpInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:border-brand-500/80 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Block Reason</label>
                <input
                  id="block-reason-input"
                  type="text"
                  required
                  placeholder="e.g. Suspicious brute-forcing"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:border-brand-500/80 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Block Cooldown</label>
                <select
                  id="block-duration-select"
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955 p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:border-brand-500/80 focus:outline-none"
                >
                  <option value="15">15 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="1440">24 Hours</option>
                  <option value="525600">Permanent (1 year)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/10 disabled:opacity-50"
              >
                <span>Restrict IP Address</span>
              </button>
            </form>
          </div>

          {/* Blocked list */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/25 p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
              <span>Active IP Bans</span>
              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{blockedIps.length}</span>
            </h3>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">Loading block lists...</div>
            ) : blockedIps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-850 p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No IP addresses are currently blocked.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {blockedIps.map((ip) => (
                  <div key={ip.id} className="rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/60 p-3 flex items-start justify-between gap-2 shadow-xs">
                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-305">{ip.ip_address}</span>
                        <span className="rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.5 text-[8px] text-slate-550">
                          {ip.attempts_count} hits
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                        Reason: <strong className="text-slate-750 dark:text-slate-300">{ip.reason}</strong>
                      </p>
                      <div className="flex items-center gap-1 text-[8px] text-slate-450 dark:text-slate-500">
                        <Clock size={10} />
                        <span>Expires: {new Date(ip.expires_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(ip.ip_address)}
                      title="Unblock IP"
                      className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recharts Analytics + Audit Logs list */}
        <div className="space-y-6 lg:col-span-2">
          {/* Chart Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/25 p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-750 dark:text-slate-300 mb-4">Security Incident Timeline</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={theme === 'dark' ? { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                    labelStyle={theme === 'dark' ? { color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' } : { color: '#0f172a', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '11px', padding: '1px 0' }}
                  />
                  <Area type="monotone" name="Failed Logins" dataKey="FailedAttempts" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={1.5} />
                  <Area type="monotone" name="Blocked Requests" dataKey="BlockedReqs" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBlocked)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Logs list */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/25 p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Security Audit Logs</h3>
              
              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  id="security-logs-search"
                  type="text"
                  placeholder="Filter by email, IP, action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-1.5 pl-9 pr-4 text-xs text-slate-805 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:border-brand-500/80 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading audit records...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-850 p-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching security audit logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                      <th className="pb-3 pr-2">Action</th>
                      <th className="pb-3 pr-2">Target User/Email</th>
                      <th className="pb-3 pr-2">IP Address</th>
                      <th className="pb-3 pr-2">Timestamp</th>
                      <th className="pb-3">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                    {filteredLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="py-3 pr-2 whitespace-nowrap">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{log.email || 'N/A'}</td>
                        <td className="py-3 pr-2 text-slate-700 dark:text-slate-300 font-mono">{log.ip_address}</td>
                        <td className="py-3 pr-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-3 text-[10px] text-slate-400 dark:text-slate-500 max-w-[180px] truncate" title={log.user_agent}>
                          {log.user_agent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLogs.length > 100 && (
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 text-center mt-3">Showing latest 100 audit entries.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirewallDashboard;
