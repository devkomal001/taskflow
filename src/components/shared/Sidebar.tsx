import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import * as LucideIcons from 'lucide-react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Plus, 
  FolderPlus,
  X,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FileText,
  Activity,
  CheckSquare
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace, projects, teams } = useWorkspace();
  
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsLogo, setNewWsLogo] = useState('');

  // Sidebar collapse state (saved in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('taskflow_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('taskflow_sidebar_collapsed', String(nextVal));
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    
    const { workspace, error } = await createWorkspace(newWsName, newWsDesc, newWsLogo);
    if (!error && workspace) {
      setIsCreateModalOpen(false);
      setNewWsName('');
      setNewWsDesc('');
      setNewWsLogo('');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Files', path: '/files', icon: FileText },
    { name: 'Activities', path: '/activity', icon: Activity },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Resolve Lucide icons dynamically for teams
  const renderTeamIcon = (iconName: string, color: string) => {
    const IconComp = (LucideIcons as any)[iconName] || LucideIcons.Users;
    return (
      <div 
        className="flex h-5 w-5 items-center justify-center rounded-md" 
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <IconComp size={12} className="stroke-[2.5]" />
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 md:hidden"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200/60 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-3 transition-all duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Toggle Collapse Button for Desktop */}
        <button 
          onClick={toggleCollapse}
          className="absolute -right-3 top-5 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-md hover:scale-105 transition-all md:flex"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand Logo Header */}
        <div className={`mb-5 flex items-center px-1.5 text-slate-850 dark:text-white ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-650 text-white shadow-md shadow-brand-500/20">
              <Briefcase size={18} className="stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                <span className="font-bold text-slate-800 dark:text-white tracking-tight text-lg leading-none">
                  TaskFlow
                </span>
                <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 border border-brand-500/20">SaaS</span>
              </div>
            )}
          </div>
          {/* Close button for mobile */}
          {isOpen && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sidebar Search Trigger */}
        <div className="mb-4">
          {isCollapsed ? (
            <button 
              onClick={() => {
                toggleCollapse();
                setTimeout(() => {
                  const input = document.querySelector('input[placeholder="Search workspace..."]') as HTMLInputElement;
                  if (input) input.focus();
                }, 200);
              }}
              className="flex h-9 w-full items-center justify-center rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-450 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
            >
              <Search size={16} />
            </button>
          ) : (
            <button 
              onClick={() => {
                const input = document.querySelector('input[placeholder="Search workspace..."]') as HTMLInputElement;
                if (input) input.focus();
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 text-left text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <Search size={14} />
              <span>Search dashboard...</span>
            </button>
          )}
        </div>

        {/* Workspace Selector */}
        <div className="relative mb-5">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className={`flex w-full items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 p-2 text-left hover:border-brand-500/40 dark:hover:border-brand-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-200 ${isCollapsed ? 'justify-center p-1.5' : ''}`}
          >
            <div className="flex items-center gap-2 overflow-hidden shrink-0">
              {activeWorkspace?.logo_url ? (
                <img
                  src={activeWorkspace.logo_url}
                  alt=""
                  className="h-7 w-7 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  <Briefcase size={14} />
                </div>
              )}
              {!isCollapsed && (
                <div className="truncate animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{activeWorkspace?.name || 'No Workspace'}</p>
                  <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 truncate">Workspace</p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {isWorkspaceMenuOpen && (
            <div className={`absolute z-50 mt-1 w-60 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-1.5 shadow-xl animate-dropdown ${isCollapsed ? 'left-14 top-0' : 'left-0 right-0'}`}>
              <p className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Workspaces</p>
              <div className="max-h-48 overflow-y-auto py-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                      activeWorkspace?.id === ws.id ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-350'
                    }`}
                  >
                    {ws.logo_url ? (
                      <img src={ws.logo_url} alt="" className="h-5.5 w-5.5 rounded object-cover border border-slate-100" />
                    ) : (
                      <div className="flex h-5.5 w-5.5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
              <hr className="my-1 border-slate-200 dark:border-slate-800/80" />
              <button
                onClick={() => {
                  setIsWorkspaceMenuOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <Plus size={14} />
                <span>New Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-slate-200'
                } ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 text-xs'}`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className="shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-200">{item.name}</span>}
              </div>
            </NavLink>
          ))}

          {/* Teams list divider inside sidebar */}
          {teams.length > 0 && !isCollapsed && (
            <div className="pt-4 pb-2 animate-in fade-in duration-200">
              <p className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Teams</p>
              <div className="mt-1 space-y-0.5">
                {teams.map(team => (
                  <NavLink
                    key={team.id}
                    to={`/team/${team.id}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive 
                          ? 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white font-bold' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-slate-800 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {renderTeamIcon(team.icon, team.color)}
                    <span className="truncate">{team.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Profile Details */}
        <div className="mt-auto border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
          <div className={`flex items-center gap-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 p-2 border border-slate-100/50 dark:border-transparent ${isCollapsed ? 'justify-center p-1 border-0' : ''}`}>
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="" 
                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs">
                {user?.full_name.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden animate-in fade-in duration-200">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.full_name}</h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">{user?.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 transition-colors shrink-0"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Create Workspace Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-850 dark:text-white">
                  <FolderPlus className="text-brand-500 dark:text-brand-400" size={20} />
                  <h3 className="text-lg font-bold">Create Workspace</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
               <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Workspace Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creative Labs"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                  <textarea
                    placeholder="Short description of this workspace..."
                    value={newWsDesc}
                    onChange={(e) => setNewWsDesc(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Logo URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={newWsLogo}
                    onChange={(e) => setNewWsLogo(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
