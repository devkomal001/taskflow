import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  User, 
  Briefcase, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck,
  Loader2,
  Database
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { activeWorkspace, members, acceptInvitation, declineInvitation, seedDatabase, updateWorkspace } = useWorkspace();

  // Profile forms
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar_url || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Database Seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  // Workspace forms
  const [wsName, setWsName] = useState(activeWorkspace?.name || '');
  const [wsDesc, setWsDesc] = useState(activeWorkspace?.description || '');
  const [wsLogo, setWsLogo] = useState(activeWorkspace?.logo_url || '');
  const [wsSuccess, setWsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name);
      setProfileAvatar(user.avatar_url);
    }
  }, [user]);

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setWsDesc(activeWorkspace.description);
      setWsLogo(activeWorkspace.logo_url);
    }
  }, [activeWorkspace]);

  // Authorization checks
  const currentMemberRecord = members.find(m => m.user_id === user?.id);
  const isWorkspaceAdmin = currentMemberRecord?.role === 'owner' || currentMemberRecord?.role === 'manager';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const { error } = await updateProfile(profileName, profileAvatar);
    if (!error) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !activeWorkspace) return;

    const { error } = await updateWorkspace(activeWorkspace.id, {
      name: wsName,
      description: wsDesc,
      logo_url: wsLogo
    });

    if (!error) {
      setWsSuccess(true);
      setTimeout(() => setWsSuccess(false), 2000);
    }
  };

  const pendingInvites = members.filter(m => m.status === 'pending');

  return (
    <div className="space-y-8 max-w-5xl mx-auto transition-all duration-300 animate-in fade-in duration-300">
      <div className="border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Account & Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure personal credentials and update workspace features.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* User Profile Form */}
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/20 p-6 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700/60 group relative overflow-hidden">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <User size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Personal Profile</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5 text-slate-800 dark:text-slate-100">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avatar Image URL</label>
              <input
                type="text"
                value={profileAvatar}
                onChange={(e) => setProfileAvatar(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-brand-605 px-4.5 py-2.5 text-xs font-bold text-white hover:bg-brand-500 hover:shadow-md hover:shadow-brand-505/10 transition-all active:scale-[0.98]"
              >
                <span>Save Changes</span>
              </button>
              {profileSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
                  <Check size={14} className="stroke-[2.5]" />
                  <span>Profile updated</span>
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Workspace Management Form */}
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/20 p-6 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700/60 group relative overflow-hidden">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-650 dark:text-violet-400">
              <Briefcase size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Workspace Settings</h3>
          </div>

          {!activeWorkspace ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
              <Briefcase size={32} className="stroke-[1.5] mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">Workspace Required</p>
              <p className="text-xs text-slate-500 dark:text-slate-600 max-w-xs mt-1.5 leading-relaxed">Please select or create a workspace using the sidebar selector first.</p>
            </div>
          ) : !isWorkspaceAdmin ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
              <ShieldCheck size={32} className="stroke-[1.5] mb-3 text-slate-300 dark:text-slate-750" />
              <p className="text-sm font-semibold">Admin Privileges Required</p>
              <p className="text-xs text-slate-500 dark:text-slate-600 max-w-xs mt-1.5 leading-relaxed">Only workspace owners and project managers can edit this workspace details.</p>
            </div>
          ) : (
            <form onSubmit={handleUpdateWorkspace} className="space-y-5 text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Workspace Name *</label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none resize-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Workspace Logo URL</label>
                <input
                  type="text"
                  value={wsLogo}
                  onChange={(e) => setWsLogo(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4.5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 hover:shadow-md hover:shadow-violet-505/10 transition-all active:scale-[0.98]"
                >
                  <span>Update Settings</span>
                </button>
                {wsSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
                    <Check size={14} className="stroke-[2.5]" />
                    <span>Workspace updated</span>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Pending Workspace Invites list */}
      {pendingInvites.length > 0 && (
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/20 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Pending Workspace Invites</h3>
          </div>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/60 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{invite.profile.full_name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{invite.profile.email} (Invited as {invite.role})</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptInvitation(invite.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all duration-150 active:scale-[0.92]"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => declineInvitation(invite.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-150 active:scale-[0.92]"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Seeding Section */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/20 p-6 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700/60 relative overflow-hidden group">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Database size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Database Seeding</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          If your database has been reset or is currently empty, you can seed it with TaskFlow's premium mock data models. This automatically creates workspaces, custom teams, demo projects, checklist items, activity logs, and pre-seeded team files directly linked to your current authentication profile.
        </p>
        <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-605 px-4.5 py-2.5 text-xs font-bold text-white hover:from-brand-500 hover:to-violet-500 transition-all shadow-md shadow-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {seeding ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Seeding Database...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="animate-pulse" />
                <span>Seed Database with Mock Data</span>
              </>
            )}
          </button>
          {seedStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
              <Check size={14} className="stroke-[2.5]" />
              <span>Database seeded successfully!</span>
            </span>
          )}
          {seedStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in duration-300">
              <X size={14} className="stroke-[2.5]" />
              <span>Failed to seed. Verify Supabase tables.</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
