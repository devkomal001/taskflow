import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import type { Project, Task, WorkspaceMember } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import * as LucideIcons from 'lucide-react';
import { 
  KanbanSquare, 
  Files, 
  Calendar, 
  Activity,
  Search, 
  Plus, 
  X, 
  User, 
  CheckSquare, 
  MessageSquare, 
  Paperclip,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
  Upload,
  Download,
  Image as ImageIcon,
  MessageCircle,
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  List
} from 'lucide-react';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get('task');
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const { 
    activeWorkspace,
    projects, 
    members, 
    teams,
    teamMembers,
    getProjectTasks, 
    createTask, 
    updateTask, 
    deleteTask,
    getTaskDetails,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addComment,
    addAttachment,
    deleteAttachment,
    logActivity,
    activities,
    refreshWorkspaceData
  } = useWorkspace();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectAttachments, setProjectAttachments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'table' | 'kanban' | 'files' | 'activity'>('table');
  const [loading, setLoading] = useState(true);
  const now = new Date();

  // Monday.com style interactive cell selectors
  const [activeStatusSelector, setActiveStatusSelector] = useState<string | null>(null);
  const [activePrioritySelector, setActivePrioritySelector] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveStatusSelector(null);
      setActivePrioritySelector(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const getStatusColorMonday = (status: string) => {
    switch (status) {
      case 'completed': return 'monday-bg-completed';
      case 'review': return 'monday-bg-review';
      case 'in_progress': return 'monday-bg-in_progress';
      case 'todo': return 'monday-bg-todo';
      default: return 'monday-bg-backlog';
    }
  };

  const getPriorityColorMonday = (prio: string) => {
    switch (prio) {
      case 'low': return 'monday-bg-low';
      case 'medium': return 'monday-bg-medium';
      case 'high': return 'monday-bg-high';
      case 'critical': return 'monday-bg-critical';
      default: return 'monday-bg-todo';
    }
  };

  // Mentions state
  const [mentionSuggestions, setMentionSuggestions] = useState<WorkspaceMember[]>([]);
  const [mentionInputId, setMentionInputId] = useState<'comment' | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Drag and Drop visual column states
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // New task form state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTasksCol, setNewTasksCol] = useState<'backlog' | 'todo' | 'in_progress' | 'review' | 'completed'>('todo');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskTeamId, setTaskTeamId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskLabels, setTaskLabels] = useState('');

  // Active Task Detail Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskChecklist, setTaskChecklist] = useState<any[]>([]);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<any[]>([]);
  
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // Editing active task inside details modal
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setProject(proj);
      loadTasks();
    } else if (projects.length > 0) {
      navigate('/projects');
    }
  }, [projectId, projects]);

  useEffect(() => {
    if (taskIdParam && tasks.length > 0 && (!selectedTask || selectedTask.id !== taskIdParam)) {
      const task = tasks.find(t => t.id === taskIdParam);
      if (task) {
        handleOpenTaskDetails(task);
      }
    }
  }, [taskIdParam, tasks]);

  const loadTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    const { tasks: taskList } = await getProjectTasks(projectId);
    setTasks(taskList);

    // Fetch project attachments
    const taskIds = (taskList || []).map(t => t.id);
    if (taskIds.length > 0) {
      const { data: attList } = await supabase
        .from('attachments')
        .select('*')
        .in('task_id', taskIds);
      
      if (attList) {
        setProjectAttachments(attList);
      } else {
        const dbState = JSON.parse(localStorage.getItem('taskflow_mock_db') || '{}');
        const localAtt = (dbState.attachments || []).filter((att: any) => taskIds.includes(att.task_id));
        setProjectAttachments(localAtt);
      }
    } else {
      setProjectAttachments([]);
    }
    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !projectId) return;

    const labelsArray = taskLabels.split(',').map(l => l.trim()).filter(l => l.length > 0);

    const { task, error } = await createTask(projectId, {
      title: taskTitle,
      description: taskDesc,
      assignee_id: taskAssignee || null,
      priority: taskPriority,
      status: newTasksCol,
      due_date: taskDueDate || null,
      labels: labelsArray,
      team_id: taskTeamId || null
    } as any);

    if (!error && task) {
      setIsNewTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskTeamId('');
      setTaskPriority('medium');
      setTaskDueDate('');
      setTaskLabels('');
      loadTasks();
    }
  };

  const handleUpdateTaskDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const { task, error } = await updateTask(selectedTask.id, {
      title: editTitle,
      description: editDesc,
      assignee_id: editAssignee || null,
      priority: editPriority,
      due_date: editDueDate || null,
      team_id: editTeamId || null
    } as any);

    if (!error && task) {
      setSelectedTask(task);
      setIsEditingTask(false);
      loadTasks();
      refreshWorkspaceData();
    }
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    if (searchParams.has('task')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('task');
      navigate(`/project/${projectId}?${newParams.toString()}`, { replace: true });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Delete this task permanently?')) {
      await deleteTask(taskId);
      handleCloseTaskDetails();
      loadTasks();
      refreshWorkspaceData();
    }
  };

  // HTML5 Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggedOverCol !== columnStatus) {
      setDraggedOverCol(columnStatus);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: any) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    const { error } = await updateTask(taskId, { status: targetStatus });
    if (!error) {
      loadTasks();
      refreshWorkspaceData();
    } else {
      loadTasks();
    }
  };

  const handleOpenTaskDetails = async (task: Task) => {
    setSelectedTask(task);
    setIsEditingTask(false);
    
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditAssignee(task.assignee_id || '');
    setEditTeamId((task as any).team_id || '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ? new Date(task.due_date).toISOString().substring(0, 10) : '');

    const { checklist, comments, attachments } = await getTaskDetails(task.id);
    setTaskChecklist(checklist);
    setTaskComments(comments);
    setTaskAttachments(attachments);
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !selectedTask) return;

    const { item } = await addChecklistItem(selectedTask.id, newChecklistTitle);
    if (item) {
      setTaskChecklist(prev => [...prev, item]);
      setNewChecklistTitle('');
      loadTasks();
      refreshWorkspaceData();
    }
  };

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    setTaskChecklist(prev => prev.map(item => item.id === itemId ? { ...item, is_completed: !currentStatus } : item));
    await toggleChecklistItem(itemId, !currentStatus);
    loadTasks();
    refreshWorkspaceData();
  };

  const handleDeleteChecklist = async (itemId: string) => {
    setTaskChecklist(prev => prev.filter(item => item.id !== itemId));
    await deleteChecklistItem(itemId);
    loadTasks();
    refreshWorkspaceData();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;

    const { comment } = await addComment(selectedTask.id, newCommentText);
    if (comment) {
      setTaskComments(prev => [...prev, comment]);
      setNewCommentText('');
      loadTasks();
      refreshWorkspaceData();
    }
  };

  const handleAddFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string || '#';
      const { attachment } = await addAttachment(
        selectedTask.id,
        file.name,
        file.type.startsWith('image/') ? base64Url : '#',
        file.type,
        file.size
      );
      if (attachment) {
        setTaskAttachments(prev => [...prev, attachment]);
        loadTasks();
        refreshWorkspaceData();
      }
    };
    reader.readAsDataURL(file);
  };

  // Mentions
  const handleTextChange = (text: string, inputType: 'comment') => {
    setNewCommentText(text);

    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      if (spaceIndex !== -1 && spaceIndex < textAfterAt.length - 1) {
        setMentionInputId(null);
        setMentionSuggestions([]);
        return;
      }

      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
      const filtered = members.filter(m => 
        (m.profile?.full_name || '').toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length > 0) {
        setMentionSuggestions(filtered);
        setMentionInputId(inputType);
        setMentionIndex(lastAtIndex);
      } else {
        setMentionInputId(null);
        setMentionSuggestions([]);
      }
    } else {
      setMentionInputId(null);
      setMentionSuggestions([]);
    }
  };

  const handleSelectMention = (memberName: string) => {
    const beforeAt = newCommentText.slice(0, mentionIndex);
    const updatedText = beforeAt + `@${memberName} `;
    setNewCommentText(updatedText);
    setMentionInputId(null);
    setMentionSuggestions([]);
  };

  const renderMentionedText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(@[^\s@,]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const name = part.slice(1);
        const isMember = members.some(m => (m.profile?.full_name || '').toLowerCase() === name.toLowerCase());
        if (isMember) {
          return (
            <span key={index} className="inline-block rounded bg-brand-500/10 dark:bg-brand-500/20 px-1 py-0.5 text-brand-605 dark:text-brand-400 font-bold border border-brand-500/20">
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  // Timeline
  const projectTaskNames = tasks.map(t => t.title);
  const projectActivities = activities.filter(act => {
    if (act.workspace_id !== activeWorkspace?.id) return false;
    if (act.target_type === 'project' && act.target_name === project?.name) return true;
    if (act.target_type === 'task' && projectTaskNames.includes(act.target_name)) return true;
    return false;
  });

  const combinedTimeline = projectActivities.map(act => ({
    id: act.id,
    created_at: act.created_at,
    type: 'activity',
    action: act.action,
    target_type: act.target_type,
    target_name: act.target_name,
    profile: act.profile,
    user_id: act.user_id
  })).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssignee = filterAssignee === 'all' || t.assignee_id === filterAssignee;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const columns = {
    backlog: { name: 'Backlog', tasks: filteredTasks.filter(t => t.status === 'backlog') },
    todo: { name: 'To Do', tasks: filteredTasks.filter(t => t.status === 'todo') },
    in_progress: { name: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'in_progress') },
    review: { name: 'Review', tasks: filteredTasks.filter(t => t.status === 'review') },
    completed: { name: 'Completed', tasks: filteredTasks.filter(t => t.status === 'completed') }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'critical': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
      case 'high': return 'bg-amber-500/10 text-amber-605 dark:text-amber-400 border-amber-500/25';
      case 'medium': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-transparent';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col transition-colors duration-200">
      {/* Head details */}
      {project && (
        <div className="flex flex-col gap-4 border-b border-slate-200/60 dark:border-slate-800/70 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in duration-200">
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${getPriorityColor(project.priority)}`}>
                {project.priority} priority
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-850 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-transparent uppercase">
                {project.status}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white md:text-3xl">{project.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-xl">{project.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Due: {project.due_date || 'No due date'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>Start: {project.start_date || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-850 shrink-0">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-all ${
            activeTab === 'table' 
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <List size={16} />
          <span>Main Table</span>
        </button>
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-all ${
            activeTab === 'kanban' 
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KanbanSquare size={16} />
          <span>Kanban Board</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-all ${
            activeTab === 'activity' 
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity size={16} />
          <span>Activity Feed</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500 font-bold">
            {combinedTimeline.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-all ${
            activeTab === 'files' 
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Files size={16} />
          <span>File Repository</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500 font-bold">
            {projectAttachments.length}
          </span>
        </button>
      </div>

      {activeTab === 'table' && (
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden animate-fade-in">
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/10 p-3 sm:flex-row sm:items-center shadow-xs shrink-0">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search table tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955/40 py-2.5 pl-9 pr-4 text-xs focus:border-brand-500/80 focus:bg-white focus:outline-none"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 py-2 px-3 text-xs text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
              >
                <option value="all">All Assignees</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/40 py-2 px-3 text-xs text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <button
                onClick={() => {
                  setNewTasksCol('todo');
                  setIsNewTaskModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-all shadow-md shadow-brand-500/10 active:scale-95 shrink-0"
              >
                <Plus size={14} />
                <span>Create Task</span>
              </button>
            </div>
          </div>

          {/* Main Table view */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 overflow-hidden shadow-xs">
            <div className="overflow-x-auto h-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3">Task Title</th>
                    <th className="px-5 py-3 text-center">Team</th>
                    <th className="px-5 py-3 text-center">Priority</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Due Date</th>
                    <th className="px-5 py-3 text-center">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredTasks.map(task => {
                    const assignee = members.find(m => m.user_id === task.assignee_id);
                    const taskTeamId = task.team_id || (project && project.team_id);
                    const team = teams.find(t => t.id === taskTeamId);
                    const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'completed';

                    return (
                      <tr 
                        key={task.id}
                        onClick={() => handleOpenTaskDetails(task)}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs hover:text-brand-500 transition-colors">{task.title}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {team ? (
                            <span 
                              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{ backgroundColor: `${team.color}15`, color: team.color }}
                            >
                              {team.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3 relative min-w-[125px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePrioritySelector(activePrioritySelector === task.id ? null : task.id);
                              setActiveStatusSelector(null);
                            }}
                            className={`monday-cell ${getPriorityColorMonday(task.priority)}`}
                          >
                            {task.priority}
                          </button>
                          {activePrioritySelector === task.id && (
                            <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 z-30 w-32 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-dropdown">
                              {['low', 'medium', 'high', 'critical'].map(prio => (
                                <button
                                  key={prio}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setActivePrioritySelector(null);
                                    await updateTask(task.id, { priority: prio as any });
                                    loadTasks();
                                  }}
                                  className={`w-full text-center text-[10px] font-bold uppercase py-2 px-1.5 my-0.5 rounded transition-all ${getPriorityColorMonday(prio)}`}
                                >
                                  {prio}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 relative min-w-[135px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStatusSelector(activeStatusSelector === task.id ? null : task.id);
                              setActivePrioritySelector(null);
                            }}
                            className={`monday-cell ${getStatusColorMonday(task.status)}`}
                          >
                            {task.status.replace('_', ' ')}
                          </button>
                          {activeStatusSelector === task.id && (
                            <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 z-30 w-32 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-dropdown">
                              {['backlog', 'todo', 'in_progress', 'review', 'completed'].map(st => (
                                <button
                                  key={st}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setActiveStatusSelector(null);
                                    await updateTask(task.id, { status: st as any });
                                    loadTasks();
                                  }}
                                  className={`w-full text-center text-[10px] font-bold uppercase py-2 px-1.5 my-0.5 rounded transition-all ${getStatusColorMonday(st)}`}
                                >
                                  {st.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`font-semibold ${isOverdue ? 'text-rose-505 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {assignee ? (
                              <>
                                <img src={assignee.profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover border border-slate-200" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{assignee.profile.full_name}</span>
                              </>
                            ) : (
                              <span className="text-slate-400 font-semibold">Unassigned</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500">
                        No tasks found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kanban' && (
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/10 p-3 sm:flex-row sm:items-center shadow-xs shrink-0">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search board tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 py-2.5 pl-9 pr-4 text-xs focus:border-brand-500/80 focus:bg-white focus:outline-none"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 py-2 px-3 text-xs text-slate-705 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Assignees</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 py-2 px-3 text-xs text-slate-750 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Kanban board columns */}
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1000px] h-full items-start">
              {Object.entries(columns).map(([colStatus, col]) => (
                <div
                  key={colStatus}
                  onDragOver={(e) => handleDragOver(e, colStatus)}
                  onDrop={(e) => handleDrop(e, colStatus)}
                  className={`flex w-72 flex-col rounded-2xl border bg-white dark:bg-slate-900/10 p-3 transition-colors shadow-xs ${
                    draggedOverCol === colStatus 
                      ? 'border-brand-500 bg-brand-500/[0.02]' 
                      : 'border-slate-200 dark:border-slate-850'
                  }`}
                >
                  {/* Column header */}
                  <div className="mb-4 flex items-center justify-between px-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">{col.name}</span>
                      <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 animate-in zoom-in duration-200">
                        {col.tasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewTasksCol(colStatus as any);
                        setIsNewTaskModalOpen(true);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-705 dark:hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3 min-h-[300px] overflow-y-auto">
                    {col.tasks.map((task) => {
                      const assignee = members.find(m => m.user_id === task.assignee_id);
                      const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'completed';
                      
                      // Resolve Team
                      const taskTeamId = task.team_id || (project && project.team_id);
                      const team = teams.find(t => t.id === taskTeamId);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => handleOpenTaskDetails(task)}
                          className="group hover-lift rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-4 shadow-xs hover:border-brand-500/40 dark:hover:border-brand-500/30 hover:bg-white dark:hover:bg-slate-900 transition-all duration-200 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            {isOverdue && (
                              <span className="flex items-center gap-0.5 text-[8px] font-bold text-rose-500">
                                <AlertTriangle size={8} className="animate-pulse" />
                                <span>Overdue</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-tight">
                            {task.title}
                          </h4>

                          {/* Team Badge inside Task Card */}
                          {team && (
                            <div className="mt-2.5">
                              <span 
                                className="rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider"
                                style={{ backgroundColor: `${team.color}15`, color: team.color }}
                              >
                                {team.name}
                              </span>
                            </div>
                          )}

                          {/* Details line */}
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-850/50 pt-3 text-[10px] text-slate-500 dark:text-slate-450 font-semibold">
                            <div className="flex items-center gap-2">
                              {task.checklistCount && task.checklistCount.total > 0 && (
                                <div className="flex items-center gap-0.5" title="Subtasks">
                                  <CheckSquare size={10} />
                                  <span>{task.checklistCount.completed}/{task.checklistCount.total}</span>
                                </div>
                              )}
                              {task.commentCount && task.commentCount > 0 ? (
                                <div className="flex items-center gap-0.5" title="Comments">
                                  <MessageSquare size={10} />
                                  <span>{task.commentCount}</span>
                                </div>
                              ) : null}
                              {task.attachmentCount && task.attachmentCount > 0 ? (
                                <div className="flex items-center gap-0.5" title="Attachments">
                                  <Paperclip size={10} />
                                  <span>{task.attachmentCount}</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Assignee Avatar */}
                            {assignee ? (
                              <img
                                src={assignee.profile.avatar_url}
                                alt=""
                                title={assignee.profile.full_name}
                                className="h-5.5 w-5.5 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              />
                            ) : (
                              <div className="rounded-full bg-slate-200 dark:bg-slate-850 p-0.5 text-slate-400" title="Unassigned">
                                <User size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {col.tasks.length === 0 && (
                      <div className="py-8 text-center text-slate-500 text-[10px] border border-dashed border-slate-200/50 dark:border-slate-850 rounded-xl">No tasks here</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden border border-slate-200 dark:border-slate-850 bg-white/60 dark:bg-slate-900/10 rounded-2xl p-5 shadow-xs h-[550px]">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Activity Timeline</h3>
            <p className="text-xs text-slate-500">Workspace operations related to this project.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {combinedTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <Activity size={32} className="text-slate-400 mb-2" />
                <p className="text-xs font-semibold">No activity logs recorded.</p>
              </div>
            ) : (
              combinedTimeline.map((item: any) => (
                <div key={item.id} className="flex items-center justify-center py-1">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-1.5 text-[11px] text-slate-655 dark:text-slate-400 font-semibold">
                    <Clock size={10} className="text-slate-400" />
                    <span>
                      <strong className="text-slate-800 dark:text-slate-200">{item.profile?.full_name || 'System User'}</strong>
                      {' '}{item.action}{' '}
                      <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-bold">
                        {item.target_type}: {item.target_name}
                      </span>
                    </span>
                    <span className="text-[9px] text-slate-450">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="flex-1 space-y-5">
          {projectAttachments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-250 dark:border-slate-850 py-16 text-center shadow-xs">
              <Upload className="mx-auto text-slate-405 dark:text-slate-600 mb-2" size={32} />
              <h4 className="text-xs font-bold text-slate-500">No resources uploaded.</h4>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
              {projectAttachments.map((file: any) => {
                const isImage = file.file_type?.startsWith('image/');
                const sizeKb = Math.round(file.size / 1024) || 0;

                return (
                  <div key={file.id} className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/20 p-3 hover:border-brand-500/35 transition-colors shadow-xs">
                    <div className="flex h-28 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-200/50 dark:border-slate-900">
                      {isImage && file.url !== '#' ? (
                        <img src={file.url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center gap-1">
                          <ImageIcon size={24} />
                          <span className="text-[8px] font-bold uppercase">{file.name.split('.').pop()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                      <p className="text-[8px] text-slate-450 mt-0.5 font-bold uppercase">{sizeKb} KB</p>
                    </div>

                    <div className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.url !== '#' && (
                        <a
                          href={file.url}
                          download={file.name}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white dark:bg-slate-900 text-slate-550 border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                          <Download size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-850 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Add Task to: {newTasksCol.replace('_', ' ')}</h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="rounded-lg p-1 text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build API integration handlers"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  placeholder="Summarize objectives..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-850 dark:text-slate-200 focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assign To Team</label>
                  <select
                    value={taskTeamId}
                    onChange={(e) => setTaskTeamId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm focus:border-brand-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">No Team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assign To Teammate</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm focus:border-brand-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Priority Level</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-850 dark:text-slate-200 focus:border-brand-500 focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-850 dark:text-slate-200 focus:border-brand-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Labels (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Design, Frontend, Bug"
                  value={taskLabels}
                  onChange={(e) => setTaskLabels(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-850 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Side Drawer panel (Linear layout) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-screen bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-850 flex flex-col justify-between shadow-2xl animate-slide-in-right">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 px-6 py-4 bg-slate-50/50 dark:bg-slate-950 shrink-0 text-slate-800 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-450 border border-brand-500/20">Task details</span>
                {project && <span className="text-xs text-slate-400 font-bold max-w-[200px] truncate">/ {project.name}</span>}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-rose-500 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={handleCloseTaskDetails}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Two-Column Side Drawer Layout */}
            <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-950">
              
              {/* Left Column: Editor, checklists, and discussions */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isEditingTask ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 leading-snug">{selectedTask.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-900 rounded-xl p-3.5">
                      {selectedTask.description || 'No description provided.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateTaskDetails} className="space-y-4 bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-xl p-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Task Title *</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={4}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-850 dark:text-slate-200 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingTask(false)}
                        className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500"
                      >
                        Save updates
                      </button>
                    </div>
                  </form>
                )}

                {/* Subtasks checklist */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-705 dark:text-slate-350 text-xs uppercase tracking-wider">
                    <CheckSquare size={14} className="text-brand-500" />
                    <span>Subtasks Checklist</span>
                  </div>
                  {taskChecklist.length > 0 && (
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.round((taskChecklist.filter(item => item.is_completed).length / taskChecklist.length) * 100)}%` }}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {taskChecklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/30 p-2.5 border border-slate-200/50 dark:border-slate-850/50 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={() => handleToggleChecklist(item.id, item.is_completed)}
                            className="h-4 w-4 rounded border-slate-350 dark:border-slate-700 text-brand-600 bg-slate-50 cursor-pointer focus:ring-0"
                          />
                          <span className={`text-xs text-slate-700 dark:text-slate-200 ${item.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                            {item.title}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteChecklist(item.id)} className="text-slate-400 hover:text-rose-505">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddChecklist} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Add subtask specifications..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs focus:outline-none focus:border-brand-500"
                    />
                    <button type="submit" className="rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900">Add</button>
                  </form>
                </div>

                {/* Attachments */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-705 dark:text-slate-350 text-xs uppercase tracking-wider">
                    <Paperclip size={14} className="text-violet-500" />
                    <span>Task Attachments</span>
                  </div>
                  <div className="space-y-2">
                    {taskAttachments.map(file => (
                      <div key={file.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800/50 shadow-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {file.file_type?.startsWith('image/') ? (
                            <img src={file.url} alt="" className="h-8 w-8 rounded object-cover shadow-sm border border-slate-200" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 text-[9px] font-bold text-slate-500">DOC</div>
                          )}
                          <div className="truncate">
                            <p className="text-xs text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {file.url !== '#' && (
                            <a href={file.url} download={file.name} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"><Download size={12} /></a>
                          )}
                          <button 
                            onClick={() => {
                              setTaskAttachments(prev => prev.filter(a => a.id !== file.id));
                              deleteAttachment(file.id);
                              loadTasks();
                              refreshWorkspaceData();
                            }} 
                            className="p-1 text-slate-455 hover:text-rose-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center justify-center w-full h-16 rounded-xl border border-dashed border-slate-350 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-brand-500/50 hover:bg-slate-100 dark:hover:bg-slate-950/45 cursor-pointer transition-all shadow-xs">
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <Upload size={16} />
                      <span className="text-[10px] font-bold">Upload computer resources</span>
                    </div>
                    <input type="file" onChange={handleAddFileAttachment} className="hidden" />
                  </label>
                </div>

                {/* Discussions */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-1.5 font-bold text-slate-705 dark:text-slate-300 text-xs uppercase tracking-wider">
                    <MessageSquare size={14} className="text-brand-500" />
                    <span>Discussions</span>
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-2 relative">
                    <input
                      type="text"
                      required
                      placeholder="Ask a question or leave a reply..."
                      value={newCommentText}
                      onChange={(e) => handleTextChange(e.target.value, 'comment')}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-xs text-slate-850 dark:text-slate-200 focus:outline-none"
                    />
                    {mentionInputId === 'comment' && mentionSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 z-50 mb-1.5 w-60 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-in zoom-in-95 duration-100 text-slate-850 dark:text-slate-250">
                        <p className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Workspace Teammates</p>
                        <div className="max-h-36 overflow-y-auto">
                          {mentionSuggestions.map(member => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleSelectMention(member.profile.full_name)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <img src={member.profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                              <div className="truncate">
                                <p className="font-bold leading-none">{member.profile.full_name}</p>
                                <p className="text-[8px] text-slate-400 mt-1 leading-none">{member.profile.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button type="submit" className="rounded-xl bg-brand-655 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 shadow-sm">Reply</button>
                  </form>

                  <div className="space-y-3.5">
                    {taskComments.map(comm => (
                      <div key={comm.id} className="flex gap-3 text-xs">
                        {comm.profile?.avatar_url ? (
                          <img src={comm.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold border border-slate-300 text-xs shrink-0">{(comm.profile?.full_name || 'US').substring(0, 2).toUpperCase()}</div>
                        )}
                        <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-905 p-3 border border-slate-200/50 dark:border-slate-850 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{comm.profile?.full_name}</span>
                            <span className="text-[9px] text-slate-400">{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="mt-1 text-slate-605 dark:text-slate-305 leading-relaxed">{renderMentionedText(comm.content)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Metadata details panel sidebar */}
              <div className="w-72 border-l border-slate-200 dark:border-slate-800 p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/20 shrink-0 overflow-y-auto">
                {!isEditingTask ? (
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Teammate</span>
                      <div className="mt-1.5 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                        {members.find(m => m.user_id === selectedTask.assignee_id) ? (
                          <>
                            <img
                              src={members.find(m => m.user_id === selectedTask.assignee_id)?.profile.avatar_url}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover border border-slate-200"
                            />
                            <div className="overflow-hidden">
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{members.find(m => m.user_id === selectedTask.assignee_id)?.profile.full_name}</span>
                              <span className="text-[9px] text-slate-400 truncate block mt-0.5">Teammate</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold p-1">Unassigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace Team</span>
                      <div className="mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                        {teams.find(t => t.id === ((selectedTask as any).team_id || (project && project.team_id))) ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: teams.find(t => t.id === ((selectedTask as any).team_id || (project && project.team_id)))?.color }}
                            />
                            <span className="text-xs font-bold text-slate-705 dark:text-slate-200 truncate">
                              {teams.find(t => t.id === ((selectedTask as any).team_id || (project && project.team_id)))?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold p-1">No team assigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-455">Priority Level</span>
                      <div className="mt-1.5">
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-455">Due Date</span>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-655 dark:text-slate-300 font-semibold">
                        <Calendar size={13} className="text-slate-400" />
                        <span className={(selectedTask.due_date && new Date(selectedTask.due_date) < now && selectedTask.status !== 'completed') ? 'text-rose-500 font-bold' : ''}>
                          {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}
                        </span>
                      </div>
                    </div>

                    {project && (
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-455">Connected Project</span>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-655 dark:text-slate-300 font-semibold">
                          <FolderKanban size={13} className="text-brand-500 shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assignee</label>
                      <select
                        value={editAssignee}
                        onChange={(e) => setEditAssignee(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team Assignment</label>
                      <select
                        value={editTeamId}
                        onChange={(e) => setEditTeamId(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus:outline-none"
                      >
                        <option value="">No Team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
