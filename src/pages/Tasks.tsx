import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import type { Task, Project } from '../context/WorkspaceContext';
import * as LucideIcons from 'lucide-react';
import { 
  KanbanSquare, 
  List, 
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
  FolderOpen
} from 'lucide-react';

const Tasks: React.FC = () => {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const { 
    activeWorkspace,
    projects, 
    members, 
    teams,
    teamMembers,
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
    refreshWorkspaceData
  } = useWorkspace();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'board' | 'list'>('board');
  const now = new Date();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Drag-and-drop column highlight
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // New task form state
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskCol, setNewTaskCol] = useState<'backlog' | 'todo' | 'in_progress' | 'review' | 'completed'>('todo');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProjId, setTaskProjId] = useState('');
  const [taskTeamId, setTaskTeamId] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskLabels, setTaskLabels] = useState('');

  // Active Task Detail drawer states
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
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    if (activeWorkspace) {
      loadAllTasks();
    }
  }, [activeWorkspace, projects]);

  const loadAllTasks = async () => {
    if (projects.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const projectIds = projects.map(p => p.id);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds);

      if (!error && data) {
        // Fetch checklists, comments, and attachments count in parallel
        const taskIds = data.map((t: any) => t.id);
        let allChecklists: any[] = [];
        let allComments: any[] = [];
        let allAttachments: any[] = [];

        if (taskIds.length > 0) {
          const [checklistsRes, commentsRes, attachmentsRes] = await Promise.all([
            supabase.from('checklists').select('*').in('task_id', taskIds),
            supabase.from('comments').select('*').in('task_id', taskIds),
            supabase.from('attachments').select('*').in('task_id', taskIds)
          ]);
          allChecklists = checklistsRes.data || [];
          allComments = commentsRes.data || [];
          allAttachments = attachmentsRes.data || [];
        }

        const enriched = data.map((task: any) => {
          const checklists = allChecklists.filter((c: any) => c.task_id === task.id);
          const comments = allComments.filter((c: any) => c.task_id === task.id);
          const attachments = allAttachments.filter((c: any) => c.task_id === task.id);
          return {
            ...task,
            checklistCount: {
              total: checklists.length,
              completed: checklists.filter((c: any) => c.is_completed).length
            },
            commentCount: comments.length,
            attachmentCount: attachments.length
          };
        });
        setTasks(enriched);
      } else {
        // Fallback to local storage (mock mode)
        const dbState = JSON.parse(localStorage.getItem('taskflow_mock_db') || '{}');
        const localTasks = (dbState.tasks || []).filter((t: any) => projectIds.includes(t.project_id));
        const enriched = localTasks.map((task: any) => {
          const checklists = (dbState.checklists || []).filter((c: any) => c.task_id === task.id);
          const comments = (dbState.comments || []).filter((c: any) => c.task_id === task.id);
          const attachments = (dbState.attachments || []).filter((c: any) => c.task_id === task.id);
          return {
            ...task,
            checklistCount: {
              total: checklists.length,
              completed: checklists.filter((c: any) => c.is_completed).length
            },
            commentCount: comments.length,
            attachmentCount: attachments.length
          };
        });
        setTasks(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskProjId) return;

    const labelsArray = taskLabels.split(',').map(l => l.trim()).filter(l => l.length > 0);

    const { task, error } = await createTask(taskProjId, {
      title: taskTitle,
      description: taskDesc,
      assignee_id: taskAssignee || null,
      priority: taskPriority,
      status: newTaskCol,
      due_date: taskDueDate || null,
      labels: labelsArray,
      team_id: taskTeamId || null
    } as any);

    if (!error && task) {
      setIsNewTaskOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskProjId('');
      setTaskTeamId('');
      setTaskAssignee('');
      setTaskPriority('medium');
      setTaskDueDate('');
      setTaskLabels('');
      loadAllTasks();
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
      due_date: editDueDate || null
    });

    if (!error && task) {
      setSelectedTask(task);
      setIsEditingTask(false);
      loadAllTasks();
      refreshWorkspaceData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      setSelectedTask(null);
      loadAllTasks();
      refreshWorkspaceData();
    }
  };

  // Drag and Drop
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

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    const { error } = await updateTask(taskId, { status: targetStatus });
    if (!error) {
      loadAllTasks();
      refreshWorkspaceData();
    } else {
      loadAllTasks();
    }
  };

  // Task Details Drawer Fetching
  const handleOpenTaskDetails = async (task: Task) => {
    setSelectedTask(task);
    setIsEditingTask(false);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditAssignee(task.assignee_id || '');
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
      loadAllTasks();
    }
  };

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    setTaskChecklist(prev => prev.map(item => item.id === itemId ? { ...item, is_completed: !currentStatus } : item));
    await toggleChecklistItem(itemId, !currentStatus);
    loadAllTasks();
  };

  const handleDeleteChecklist = async (itemId: string) => {
    setTaskChecklist(prev => prev.filter(item => item.id !== itemId));
    await deleteChecklistItem(itemId);
    loadAllTasks();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;

    const { comment } = await addComment(selectedTask.id, newCommentText);
    if (comment) {
      setTaskComments(prev => [...prev, comment]);
      setNewCommentText('');
      loadAllTasks();
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
        loadAllTasks();
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter computation
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Project filter
    const matchesProject = filterProject === 'all' || t.project_id === filterProject;

    // Team filter: filter projects belonging to selected team OR direct task association
    let matchesTeam = true;
    if (filterTeam !== 'all') {
      const proj = projects.find(p => p.id === t.project_id);
      const isAssociatedByProject = proj && proj.team_id === filterTeam;
      const isAssociatedByDirectTask = (t as any).team_id === filterTeam;
      matchesTeam = !!(isAssociatedByProject || isAssociatedByDirectTask);
    }

    const matchesAssignee = filterAssignee === 'all' || t.assignee_id === filterAssignee;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;

    return matchesSearch && matchesProject && matchesTeam && matchesAssignee && matchesPriority;
  });

  const columns = {
    backlog: { name: 'Backlog', tasks: filteredTasks.filter(t => t.status === 'backlog') },
    todo: { name: 'To Do', tasks: filteredTasks.filter(t => t.status === 'todo') },
    in_progress: { name: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'in_progress') },
    review: { name: 'Review', tasks: filteredTasks.filter(t => t.status === 'review') },
    completed: { name: 'Completed', tasks: filteredTasks.filter(t => t.status === 'completed') }
  };

  const getPriorityBadgeColor = (prio: string) => {
    switch (prio) {
      case 'critical': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-605 dark:text-amber-400 border-amber-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-205 dark:border-slate-700/50';
    }
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
            <span key={index} className="inline-block rounded bg-brand-500/10 dark:bg-brand-500/20 px-1 py-0.5 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20">
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col transition-colors duration-200">
      {/* Top Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white md:text-3xl">Workspace Tasks Board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and organize all tasks across workspace projects and teams.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle board vs list view */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-1 shadow-xs shrink-0">
            <button
              onClick={() => setViewType('board')}
              className={`p-1.5 rounded-lg transition-colors ${viewType === 'board' ? 'bg-brand-500/10 text-brand-650 dark:text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-650'}`}
              title="Board View"
            >
              <KanbanSquare size={16} />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewType === 'list' ? 'bg-brand-500/10 text-brand-650 dark:text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-650'}`}
              title="List Table View"
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => {
              if (projects.length > 0) {
                setTaskProjId(projects[0].id);
                setNewTaskCol('todo');
                setIsNewTaskOpen(true);
              } else {
                alert("Please create a project first before creating tasks.");
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/10 p-4 shadow-xs">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-555" />
          <input
            type="text"
            placeholder="Search board tasks by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 py-3 pl-10 pr-4 text-xs focus:border-brand-500/80 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 py-2.5 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 py-2.5 px-3 text-xs text-slate-705 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 py-2.5 px-3 text-xs text-slate-705 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Assignees</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 py-2.5 px-3 text-xs text-slate-705 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <p>Loading tasks data...</p>
        </div>
      ) : viewType === 'board' ? (
        // Board View
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
                <div className="mb-4 flex items-center justify-between px-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">{col.name}</span>
                    <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {col.tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (projects.length > 0) {
                        setTaskProjId(projects[0].id);
                        setNewTaskCol(colStatus as any);
                        setIsNewTaskOpen(true);
                      }
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-3 min-h-[300px] overflow-y-auto">
                  {col.tasks.map((task) => {
                    const assignee = members.find(m => m.user_id === task.assignee_id);
                    const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'completed';
                    
                    // Resolve project name and team name
                    const proj = projects.find(p => p.id === task.project_id);
                    const taskTeamId = task.team_id || (proj && proj.team_id);
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
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase border ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold text-rose-500 dark:text-rose-400">
                              <AlertTriangle size={8} className="animate-pulse" />
                              <span>Overdue</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Project and Team details */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[9px] font-semibold">
                          {proj && (
                            <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-slate-500 dark:text-slate-400 uppercase max-w-[120px] truncate" title={proj.name}>
                              {proj.name}
                            </span>
                          )}
                          {team && (
                            <span 
                              className="rounded px-1.5 py-0.5 uppercase max-w-[120px] truncate"
                              style={{ backgroundColor: `${team.color}15`, color: team.color }}
                              title={team.name}
                            >
                              {team.name}
                            </span>
                          )}
                        </div>

                        {/* Checklist/Comment counters and assignee */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-850/50 pt-3 text-[10px] text-slate-500 dark:text-slate-450 font-semibold">
                          <div className="flex items-center gap-2">
                            {task.checklistCount && task.checklistCount.total > 0 && (
                              <div className="flex items-center gap-0.5" title="Checklist progress">
                                <CheckSquare size={10} />
                                <span>{task.checklistCount.completed}/{task.checklistCount.total}</span>
                              </div>
                            )}
                            {task.commentCount && task.commentCount > 0 ? (
                              <div className="flex items-center gap-0.5">
                                <MessageSquare size={10} />
                                <span>{task.commentCount}</span>
                              </div>
                            ) : null}
                            {task.attachmentCount && task.attachmentCount > 0 ? (
                              <div className="flex items-center gap-0.5">
                                <Paperclip size={10} />
                                <span>{task.attachmentCount}</span>
                              </div>
                            ) : null}
                          </div>

                          {assignee ? (
                            <img
                              src={assignee.profile.avatar_url}
                              alt=""
                              title={assignee.profile.full_name}
                              className="h-5.5 w-5.5 rounded-full object-cover border border-slate-200"
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
                    <div className="py-8 text-center text-slate-500 text-[10px]">No tasks in {col.name.toLowerCase()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // List View (Table layout)
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5">Task Title</th>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Team</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredTasks.map(task => {
                  const assignee = members.find(m => m.user_id === task.assignee_id);
                  const proj = projects.find(p => p.id === task.project_id);
                  const taskTeamId = task.team_id || (proj && proj.team_id);
                  const team = teams.find(t => t.id === taskTeamId);
                  const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'completed';

                  return (
                    <tr 
                      key={task.id}
                      onClick={() => handleOpenTaskDetails(task)}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs hover:text-brand-500 transition-colors">{task.title}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">{proj ? proj.name : 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5">
                        <span className={`rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-slate-100 dark:bg-slate-850 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-transparent">
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-505 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
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
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No tasks match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-850 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Create Workspace Task</h3>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Project *</label>
                <select
                  required
                  value={taskProjId}
                  onChange={(e) => setTaskProjId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm focus:border-brand-500 focus:outline-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build API integration handlers"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm text-slate-850 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  placeholder="Describe task directives..."
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assign To Member</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm focus:border-brand-500 focus:outline-none cursor-pointer"
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
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

      {/* Task detail drawer (Linear style side pane) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl h-screen bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-850 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 p-5 text-slate-850 dark:text-white bg-slate-50/50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <KanbanSquare className="text-brand-500" size={18} />
                <span className="text-xs font-semibold text-slate-455">Task Workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-rose-500"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {!isEditingTask ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug">{selectedTask.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-405 mt-2 leading-relaxed whitespace-pre-line">
                        {selectedTask.description || 'No description provided.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditingTask(true)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-900/20 p-4 border border-slate-200/50 dark:border-slate-850/50">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
                      <div className="mt-1.5 flex items-center gap-2">
                        {members.find(m => m.user_id === selectedTask.assignee_id) ? (
                          <>
                            <img
                              src={members.find(m => m.user_id === selectedTask.assignee_id)?.profile.avatar_url}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                              {members.find(m => m.user_id === selectedTask.assignee_id)?.profile.full_name}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Unassigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                      <div className="mt-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${getPriorityBadgeColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateTaskDetails} className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 p-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-850 dark:text-slate-200 focus:border-brand-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</label>
                      <select
                        value={editAssignee}
                        onChange={(e) => setEditAssignee(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs focus:border-brand-500 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs focus:border-brand-500 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
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
                      Save Updates
                    </button>
                  </div>
                </form>
              )}

              {/* Checklist */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-705 dark:text-slate-300 text-xs uppercase tracking-wider">
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
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/30 p-2.5 border border-slate-200 dark:border-slate-850/50 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          onChange={() => handleToggleChecklist(item.id, item.is_completed)}
                          className="h-4 w-4 rounded border-slate-350 dark:border-slate-705 text-brand-600 bg-slate-50 cursor-pointer focus:ring-0"
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
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs focus:outline-none"
                  />
                  <button type="submit" className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900">Add</button>
                </form>
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-705 dark:text-slate-300 text-xs uppercase tracking-wider">
                  <Paperclip size={14} className="text-violet-500" />
                  <span>Task Attachments</span>
                </div>
                <div className="space-y-2">
                  {taskAttachments.map(file => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/30 p-2 border border-slate-200 dark:border-slate-800/50 shadow-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {file.file_type?.startsWith('image/') ? (
                          <img src={file.url} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 text-[9px] font-bold text-slate-500">DOC</div>
                        )}
                        <div className="truncate">
                          <p className="text-xs text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-[9px] text-slate-450">{(file.size / 1024).toFixed(0)} KB</p>
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
                            loadAllTasks();
                          }} 
                          className="p-1 text-slate-455 hover:text-rose-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center w-full h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-brand-500/50 hover:bg-slate-100 dark:hover:bg-slate-950/45 cursor-pointer transition-all shadow-xs">
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Upload size={16} />
                    <span className="text-[10px] font-bold">Upload computer resources</span>
                  </div>
                  <input type="file" onChange={handleAddFileAttachment} className="hidden" />
                </label>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 font-bold text-slate-705 dark:text-slate-300 text-xs uppercase tracking-wider">
                  <MessageSquare size={14} className="text-brand-500" />
                  <span>Discussion Comments</span>
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Leave a comment reply..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs focus:outline-none"
                  />
                  <button type="submit" className="rounded-xl bg-brand-655 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500">Reply</button>
                </form>

                <div className="space-y-3.5">
                  {taskComments.map(comm => (
                    <div key={comm.id} className="flex gap-3 text-xs">
                      {comm.profile?.avatar_url ? (
                        <img src={comm.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold border border-slate-300 text-xs">{(comm.profile?.full_name || 'US').substring(0, 2).toUpperCase()}</div>
                      )}
                      <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-905 p-3 border border-slate-200/50 dark:border-slate-850 shadow-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{comm.profile?.full_name}</span>
                          <span className="text-[9px] text-slate-400">{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="mt-1 text-slate-605 dark:text-slate-300 leading-relaxed">{renderMentionedText(comm.content)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
