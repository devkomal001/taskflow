import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../context/WorkspaceContext';
import { 
  FolderPlus, 
  Calendar, 
  FolderOpen,
  X,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Clock,
  AlertCircle,
  Edit2
} from 'lucide-react';

const formatDateDisplay = (dateStr: string | null | undefined, fallback: string = 'DD/MM/YYYY') => {
  if (!dateStr) return fallback;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { activeWorkspace, projects, createProject, updateProject, deleteProject, members } = useWorkspace();

  const currentMemberRecord = (members || []).find(m => m.user_id === user?.id);
  const isWorkspaceOwner = activeWorkspace?.owner_id === user?.id || currentMemberRecord?.role === 'owner';
  const isWorkspaceAdmin = isWorkspaceOwner || currentMemberRecord?.role === 'manager';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [status, setStatus] = useState<'active' | 'on hold' | 'completed' | 'archived'>('active');

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeProjectMenu, setActiveProjectMenu] = useState<string | null>(null);
  const [createError, setCreateError] = useState('');

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 max-w-md mx-auto text-center animate-in fade-in duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 dark:from-brand-500/20 text-brand-600 dark:text-brand-400 mb-6 border border-brand-500/15 shadow-sm">
          <FolderPlus size={26} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Workspace Required</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5 max-w-xs leading-relaxed">
          Please select or create a workspace first to manage projects. You can create a workspace from the sidebar selector or click below to return to the Dashboard.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 btn-brand rounded-xl px-5 py-3 text-xs font-bold shadow-md shadow-brand-primary/20"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleStartEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setStartDate(project.start_date || '');
    setDueDate(project.due_date || '');
    setPriority(project.priority);
    setStatus(project.status);
    setSubmitAttempted(false);
    setCreateError('');
    setIsModalOpen(true);
    setActiveProjectMenu(null);
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setCreateError('');

    if (!name.trim()) {
      return;
    }
    if (!startDate) {
      setCreateError('Start Date is required.');
      return;
    }
    if (!dueDate) {
      setCreateError('Due Date is required.');
      return;
    }
    if (new Date(dueDate) < new Date(startDate)) {
      setCreateError('Due Date cannot be earlier than Start Date.');
      return;
    }

    if (editingProject) {
      const { project, error } = await updateProject(editingProject.id, {
        name,
        description,
        start_date: startDate,
        due_date: dueDate,
        priority,
        status
      });

      if (error) {
        setCreateError(error.message || 'Failed to update project.');
      } else if (project) {
        setIsModalOpen(false);
        setEditingProject(null);
        setName('');
        setDescription('');
        setStartDate('');
        setDueDate('');
        setPriority('medium');
        setStatus('active');
        setSubmitAttempted(false);
      }
    } else {
      const { project, error } = await createProject({
        name,
        description,
        start_date: startDate,
        due_date: dueDate,
        priority,
        status
      });

      if (error) {
        setCreateError(error.message || 'Failed to create project.');
      } else if (project) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setStartDate('');
        setDueDate('');
        setPriority('medium');
        setStatus('active');
        setSubmitAttempted(false);
      }
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating into project
    if (confirm('Are you sure you want to delete this project? All associated tasks, checklists, and comments will be permanently lost.')) {
      await deleteProject(projectId);
      setActiveProjectMenu(null);
    }
  };

  // Filter & Search resolution
  const filteredProjects = projects.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesQuery;
    return matchesQuery && p.status === filterStatus;
  });

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'medium': return 'bg-[#286CFC]/10 text-[#286CFC] border-[#286CFC]/25';
      default: return 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/40';
    }
  };

  const getStatusColor = (stat: string) => {
    switch (stat) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'on hold': return 'bg-orange-500/10 text-orange-400 border-orange-500/25';
      case 'archived': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-[#286CFC]/10 text-[#4CB5D4] border-[#286CFC]/25';
    }
  };

  const getPriorityAccent = (prio: string) => {
    switch (prio) {
      case 'critical': return 'from-rose-500 to-rose-600';
      case 'high': return 'from-amber-500 to-orange-500';
      case 'medium': return 'from-[#286CFC] to-[#4CB5D4]';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors duration-200 page-enter">
      {/* Top Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white md:text-3xl">Projects Tracker</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize goals, align team members, and track dashboard progress.</p>
        </div>
        {isWorkspaceAdmin && (
          <button
            onClick={() => {
              setEditingProject(null);
              setName('');
              setDescription('');
              setStartDate('');
              setDueDate('');
              setPriority('medium');
              setStatus('active');
              setSubmitAttempted(false);
              setCreateError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl btn-brand px-4 py-2.5 text-sm font-bold shadow-lg shadow-brand-primary/20"
          >
            <FolderPlus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl glass-panel p-4 sm:flex-row sm:items-center shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-450 dark:text-violet-400/50" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl glass-input py-3 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-450 dark:text-violet-400/50" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl glass-input py-3 px-4 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="on hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#286CFC]/20 dark:border-[#286CFC]/15 bg-[#07153D]/5 dark:bg-[#030B24]/30 py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#286CFC]/10 text-[#286CFC] border border-[#286CFC]/20">
            <FolderOpen size={28} />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Projects Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto">Create a new project or adjust filters to begin tracking tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="group relative flex flex-col justify-between rounded-2xl glass-card p-6 shadow-sm cursor-pointer hover-lift transition-all duration-200 animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getPriorityAccent(project.priority)}`} />

              {/* Menu and badges */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {isWorkspaceAdmin && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProjectMenu(activeProjectMenu === project.id ? null : project.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-[#286CFC]/10 hover:text-[#286CFC] transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {activeProjectMenu === project.id && (
                      <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-[#286CFC]/15 dark:border-[#286CFC]/20 bg-white dark:bg-[#07153D] p-1.5 shadow-xl animate-dropdown">
                        <button
                          onClick={(e) => handleStartEdit(project, e)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#286CFC]/8 dark:hover:bg-[#286CFC]/15 hover:text-[#286CFC] transition-colors"
                        >
                          <Edit2 size={12} />
                          <span>Edit Project</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(project.id, e)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/8 dark:hover:bg-rose-500/15 border-t border-[#286CFC]/10 dark:border-slate-800/50 mt-0.5 transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Delete Project</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Desc */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#286CFC] transition-colors">
                  {project.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Dates */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#286CFC]/10 dark:border-[#286CFC]/8 pt-4 text-[10px] text-slate-500 dark:text-slate-450 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-[#286CFC]/70" />
                  <span>Start: {formatDateDisplay(project.start_date, 'N/A')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-[#4CB5D4]/70" />
                  <span>Due: {formatDateDisplay(project.due_date, 'N/A')}</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1.5">
                  <span>Task Progress</span>
                  <span className="text-[#286CFC] font-bold">{project.progress || 0}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#286CFC]/8 dark:bg-[#030B24]/60 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#286CFC] to-[#4CB5D4] transition-all duration-500" 
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-violet-200/30 dark:border-violet-805/30 bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 overflow-hidden">
            {/* Ambient Modal Stripe */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-primary to-brand-dark"></div>

            <div className="flex items-center justify-between border-b border-violet-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                {editingProject ? (
                  <Edit2 className="text-brand-primary dark:text-brand-primary" size={20} />
                ) : (
                  <FolderPlus className="text-brand-primary dark:text-brand-primary" size={20} />
                )}
                <h3 className="text-lg font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800 hover:text-slate-850 dark:hover:text-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitProject} className="mt-4 space-y-4">
              {createError && (
                <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="stroke-[2.5] shrink-0 mt-0.5 text-rose-500" />
                    <span>{createError}</span>
                  </div>
                  {createError.toLowerCase().includes('limit') && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="w-fit flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3 py-1.5 font-bold text-[10px] shadow-sm transition-all"
                    >
                      Upgrade Workspace Plan
                    </button>
                  )}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
                  Project Name <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Roadmap Campaign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl glass-input p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none ${submitAttempted && !name.trim() ? 'border-rose-500/50 dark:border-rose-500/50 ring-1 ring-rose-500/20' : ''}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">Description</label>
                <textarea
                  placeholder="Summarize objectives, goals, and key results of this project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl glass-input p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                />
              </div>

              {(() => {
                const isDateRangeInvalid = startDate && dueDate && new Date(dueDate) < new Date(startDate);
                const isStartDateInvalid = (submitAttempted && !startDate) || isDateRangeInvalid;
                const isDueDateInvalid = (submitAttempted && !dueDate) || isDateRangeInvalid;

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
                        Start Date <span className="text-rose-500 dark:text-rose-400">*</span>
                      </label>
                      <div 
                        onClick={() => {
                          try { startDateInputRef.current?.showPicker(); } catch (e) { startDateInputRef.current?.click(); }
                        }} 
                        className="relative mt-1.5 cursor-pointer"
                      >
                        <div className={`w-full rounded-xl glass-input p-2.5 text-sm text-slate-850 dark:text-slate-200 flex items-center justify-between ${isStartDateInvalid ? 'border-rose-500/50 dark:border-rose-500/50 ring-1 ring-rose-500/20' : ''}`}>
                          <span>{formatDateDisplay(startDate)}</span>
                          <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          ref={startDateInputRef}
                          type="date"
                          value={startDate}
                          max={dueDate || undefined}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
                        Due Date <span className="text-rose-500 dark:text-rose-400">*</span>
                      </label>
                      <div 
                        onClick={() => {
                          try { dueDateInputRef.current?.showPicker(); } catch (e) { dueDateInputRef.current?.click(); }
                        }} 
                        className="relative mt-1.5 cursor-pointer"
                      >
                        <div className={`w-full rounded-xl glass-input p-2.5 text-sm text-slate-850 dark:text-slate-200 flex items-center justify-between ${isDueDateInvalid ? 'border-rose-500/50 dark:border-rose-500/50 ring-1 ring-rose-500/20' : ''}`}>
                          <span>{formatDateDisplay(dueDate)}</span>
                          <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          ref={dueDateInputRef}
                          type="date"
                          value={dueDate}
                          min={startDate || undefined}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl glass-input p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl glass-input p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="on hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl btn-brand px-5 py-2.5 text-xs font-bold shadow-lg shadow-brand-primary/20"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
