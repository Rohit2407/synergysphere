import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Users, BarChart3, MessageSquare, FileText, CheckCircle2, Shield, Globe, Lock as LockIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@/components/ui/notification";
import { TaskCard } from "@/components/task-card";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { CreateTaskModal } from "@/components/create-task-modal";
import { UserSearchModal } from "@/components/user-search-modal";
import { CreateCredentialModal } from "@/components/create-credential-modal";
import { useWebSocket } from "@/hooks/use-websocket";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ProjectDetail() {
  const [location, setLocation] = useLocation();
  const projectId = location.split("/").pop() || "";
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateCredential, setShowCreateCredential] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("global");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const { lastMessage } = useWebSocket(projectId);
  const queryClient = useQueryClient();
  const { user, changePassword } = useAuth();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/projects/${projectId}`],
    enabled: !!projectId,
  });

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: [`/projects/${projectId}/tasks/`],
    enabled: !!projectId,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: [`/projects/${projectId}/discussions/`, selectedChannel],
    queryFn: () => apiRequest("GET", `/projects/${projectId}/discussions/?channel=${selectedChannel}`),
    enabled: !!projectId,
  });

  const { data: activityLogs } = useQuery({
    queryKey: [`/projects/${projectId}/logs`],
    enabled: !!projectId,
  });

  const { data: members } = useQuery({
    queryKey: [`/projects/${projectId}/members`],
    enabled: !!projectId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      apiRequest("PUT", `/projects/${projectId}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/members`] });
      showNotification("Role updated successfully", "success");
    },
    onError: (error: any) => {
      showNotification(error.message || "Failed to update role", "error");
    },
  });

  const postDiscussionMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/projects/${projectId}/discussions/`, { content, channel: selectedChannel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/discussions/`, selectedChannel] });
      setNewComment("");
    },
  });

  const [newComment, setNewComment] = useState("");

  const handlePostComment = () => {
    if (newComment.trim()) {
      postDiscussionMutation.mutate(newComment);
    }
  };

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "TASK_CREATED":
        case "TASK_UPDATED":
        case "TASK_DELETED":
          refetchTasks();
          showNotification("Task updated", "info");
          break;
        case "MESSAGE_CREATED":
          if (lastMessage.data.project_id.toString() === projectId && 
              lastMessage.data.channel === selectedChannel) {
            refetchComments();
          }
          break;
        case "COMMENT_ADDED":
          showNotification("New comment added", "info");
          break;
      }
    }
  }, [lastMessage, refetchTasks]);

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
  };

  const hideNotification = () => setNotification(null);
  const handleBackClick = () => setLocation("/dashboard");
  const handleTaskClick = (taskId: string) => setSelectedTaskId(taskId);

  const currentMember = (members as any[])?.find((m: any) => m.user_id === user?.id);
  const currentRole = currentMember?.role || "stakeholder";

  const canManageMembers = currentRole === "manager";
  const canManageWork = ["manager", "project_manager", "employee"].includes(currentRole);
  const canPostDiscussion = canManageWork || currentRole === "stakeholder";

  useEffect(() => {
    if (currentRole === "stakeholder") {
      setSelectedChannel("manager");
    } else if (["employee", "project_manager"].includes(currentRole)) {
      setSelectedChannel("global");
    }
  }, [currentRole]);

  const tasksByStatus = {
    "todo": (tasks as any[])?.filter((task: any) => task.status === "todo") || [],
    "in_progress": (tasks as any[])?.filter((task: any) => task.status === "in_progress") || [],
    "done": (tasks as any[])?.filter((task: any) => task.status === "done") || [],
  };

  const totalTasks = (tasks as any[])?.length || 0;
  const completedTasks = tasksByStatus.done.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-foreground mb-2">Project Not Found</h3>
        <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
        <Button onClick={handleBackClick}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      {/* Password Change Overlay */}
      <AnimatePresence>
        {user?.needs_password_change && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LockIcon className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Secure Your Account</h2>
              <p className="text-muted-foreground text-sm mb-8">
                Your manager has provided temporary credentials. Please set a new password to continue.
              </p>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const pass = (e.currentTarget.elements.namedItem("new-password") as HTMLInputElement).value;
                  if (pass.length < 6) return showNotification("Password must be at least 6 characters", "error");
                  try {
                    await changePassword(pass);
                    showNotification("Password updated successfully!", "success");
                  } catch (err: any) {
                    showNotification(err.message || "Failed to update password", "error");
                  }
                }}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5 px-1">New Password</label>
                  <input
                    name="new-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                >
                  Update & Continue
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={{ show: { transition: { staggerChildren: 0.06 } } }} 
        className="space-y-5" 
        data-testid="project-detail-page"
      >
        {notification && (
          <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
        )}

        <TaskDetailModal taskId={selectedTaskId} projectId={projectId} open={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} onUpdate={(message) => showNotification(message, "success")} />
        <CreateTaskModal projectId={projectId} open={showCreateTask} onClose={() => setShowCreateTask(false)} onSuccess={(message) => showNotification(message, "success")} />
        <UserSearchModal open={showUserSearch} onClose={() => setShowUserSearch(false)} projectId={projectId} projectName={(project as any)?.name || ""} onSuccess={(message) => showNotification(message, "success")} />
        <CreateCredentialModal open={showCreateCredential} onClose={() => setShowCreateCredential(false)} projectId={projectId} projectName={(project as any)?.name || ""} />

        {/* Project Header & Progress */}
        <div className="flex flex-col lg:flex-row gap-5">
          <motion.div variants={fadeIn} className="flex-1 flex items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
            <button onClick={handleBackClick} className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary hover:bg-accent text-foreground transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="w-11 h-11 bg-violet-500/10 dark:bg-violet-500/20 rounded-xl flex items-center justify-center border border-violet-500/20">
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground truncate">
                {(project as any).name}
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5 truncate">
                {(project as any).description || "No description provided"}
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="lg:w-80 bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-foreground">Project Completion</span>
               <span className="text-xs font-bold text-blue-500">{progressPercentage}%</span>
             </div>
             <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercentage}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
               />
             </div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Completed", value: `${completedTasks}`, color: "text-blue-500", icon: CheckCircle2 },
            { label: "Total Tasks", value: `${totalTasks}`, color: "text-violet-500", icon: FileText },
            { label: "Team Members", value: `${(members as any[])?.length || 0}`, color: "text-emerald-500", icon: Users },
            { label: "Current Role", value: currentRole.replace("_", " "), color: "text-amber-500", icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-60`} />
              </div>
              <p className={`text-lg font-bold text-foreground capitalize`}>{stat.value}</p>
              {stat.label === "Current Role" && currentRole === "stakeholder" && (
                <div className="mt-2">
                   <span className="text-[8px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Restricted Access</span>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeIn}>
          <Tabs defaultValue="tasks" className="space-y-5">
            <TabsList className="grid w-full grid-cols-5 bg-card border border-border p-1 rounded-xl h-auto">
              <TabsTrigger value="tasks" className="rounded-lg text-xs py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="discussion" className="rounded-lg text-xs py-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chat
              </TabsTrigger>
              <TabsTrigger value="team" className="rounded-lg text-xs py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                <Users className="w-3.5 h-3.5 mr-1.5" /> Team
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg text-xs py-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Activity
              </TabsTrigger>
              <TabsTrigger value="files" className="rounded-lg text-xs py-2 data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Files
              </TabsTrigger>
            </TabsList>

            {/* ─── Tasks Tab ─── */}
            <TabsContent value="tasks" className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-foreground">Project Tasks</h3>
                {canManageWork && (
                  <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.97] font-medium text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                )}
              </div>

              {tasksLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="h-5 bg-muted rounded animate-pulse w-24"></div>
                      {[1, 2].map((j) => (
                        <div key={j} className="bg-card border border-border rounded-xl p-4 animate-pulse h-24"></div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Status Columns mapping */}
                  {[
                    { id: "todo", label: "To Do", color: "bg-slate-400" },
                    { id: "in_progress", label: "In Progress", color: "bg-amber-500" },
                    { id: "done", label: "Done", color: "bg-emerald-500" }
                  ].map((col) => (
                    <div key={col.id} className="space-y-3">
                      <div className="flex items-center justify-between bg-card border border-border px-3 py-2 rounded-xl">
                        <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-2">
                          <span className={`w-2 h-2 ${col.color} rounded-full`} /> {col.label}
                        </h4>
                        <span className="bg-secondary text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded border border-border/50">
                          {tasksByStatus[col.id as keyof typeof tasksByStatus].length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {tasksByStatus[col.id as keyof typeof tasksByStatus].map((task: any) => (
                          <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                        ))}
                        {tasksByStatus[col.id as keyof typeof tasksByStatus].length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl opacity-30">
                            <p className="text-[10px] font-medium uppercase">No tasks</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalTasks === 0 && !tasksLoading && (
                <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
                  <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Clear Horizon</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">This project is currently empty. Start by defining your first milestone.</p>
                  {canManageWork && (
                    <Button onClick={() => setShowCreateTask(true)} className="flex items-center gap-2 mx-auto rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-500">
                      <Plus className="w-4 h-4" /> Create First Task
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discussion" className="space-y-5">
              <div className="bg-card border border-border rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/10">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-500" /> Communications
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5 opacity-70">
                      {selectedChannel === "global" ? "Shared Workspace Channel" : "Private Stakeholder Lounge"}
                    </p>
                  </div>

                  {currentRole === "manager" && (
                    <div className="flex bg-secondary p-1 rounded-lg">
                      <button 
                        onClick={() => setSelectedChannel("global")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                          selectedChannel === "global" 
                            ? "bg-card text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Globe className="w-3 h-3" /> GLOBAL
                      </button>
                      <button 
                        onClick={() => setSelectedChannel("manager")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                          selectedChannel === "manager" 
                            ? "bg-card text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <LockIcon className="w-3 h-3" /> MANAGER
                      </button>
                    </div>
                  )}

                  {currentRole !== "manager" && (
                     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border border-border">
                       {selectedChannel === "global" ? <Globe className="w-3 h-3" /> : <LockIcon className="w-3 h-3" />}
                       {selectedChannel} ACCESS
                     </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {(!comments || (comments as any[]).length === 0) ? (
                    <div className="text-center py-20">
                      <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-6 h-6 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">Quiet space. Break the ice!</p>
                    </div>
                  ) : (
                    (comments as any[]).map((comment: any) => (
                      <div key={comment.id} className={`flex gap-3 ${comment.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm ${
                          comment.sender_id === user?.id 
                            ? 'bg-gradient-to-tr from-blue-500 to-indigo-500' 
                            : 'bg-gradient-to-tr from-violet-500 to-purple-500'
                        }`}>
                          {comment.sender.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={`max-w-[75%] space-y-1`}>
                          <div className={`flex items-center gap-2 ${comment.sender_id === user?.id ? 'justify-end' : ''}`}>
                            <span className="font-bold text-foreground text-[10px]">{comment.sender.username}</span>
                            <span className="text-[9px] text-muted-foreground opacity-60">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`p-3.5 shadow-sm border border-border/40 ${
                            comment.sender_id === user?.id 
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-secondary/80 text-foreground rounded-2xl rounded-tl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-secondary/20 border-t border-border flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canPostDiscussion && handlePostComment()}
                    placeholder={canPostDiscussion ? "Message workspace..." : "Read-only access"}
                    className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                    disabled={!canPostDiscussion || postDiscussionMutation.isPending}
                  />
                  <button
                    onClick={handlePostComment}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2"
                    disabled={!canPostDiscussion || !newComment.trim() || postDiscussionMutation.isPending}
                  >
                    Send <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border bg-secondary/10">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-500" /> Audit Log
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 opacity-70">Project event history</p>
                </div>

                <div className="p-5 overflow-y-auto max-h-[500px]">
                  {(!activityLogs || (activityLogs as any[]).length === 0) ? (
                    <div className="text-center py-20 opacity-50">
                      <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm font-medium">Awaiting first logs...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(activityLogs as any[]).map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 p-4 bg-secondary/30 border border-border/40 rounded-2xl hover:bg-secondary/50 transition-colors">
                          <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-snug">
                              <span className="font-bold">{log.user.username}</span> <span className="text-muted-foreground">{log.action.toLowerCase()}</span>
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase">{new Date(log.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-5">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/10">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" /> Crew Directory
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 opacity-70">
                      {((members as any[])?.length || 0)} Total contributors
                    </p>
                  </div>
                  {canManageMembers && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCreateCredential(true)}
                        className="flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 px-4 py-2 rounded-xl transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                      >
                        <Shield className="w-3.5 h-3.5" /> Credentials
                      </button>
                      <button
                        onClick={() => setShowUserSearch(true)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-xl transition-all shadow-md active:scale-95 font-bold text-[10px] uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> Invite
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {(members as any[])?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(members as any[]).map((member: any) => (
                        <div key={member.id} className="bg-secondary/40 border border-border/50 rounded-2xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all hover:bg-secondary/60">
                          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/10">
                            {member.user?.username?.substring(0, 2).toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground text-sm truncate">{member.user?.username}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {canManageMembers && member.user_id !== user?.id ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => updateRoleMutation.mutate({ userId: member.user_id, role: e.target.value })}
                                  disabled={updateRoleMutation.isPending}
                                  className="bg-secondary px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground focus:ring-0 cursor-pointer outline-none border border-border/50"
                                >
                                  <option value="manager">Manager</option>
                                  <option value="project_manager">PM</option>
                                  <option value="employee">Employee</option>
                                  <option value="stakeholder">Stakeholder</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                  member.role === 'manager'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : member.role === 'project_manager'
                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                    : member.role === 'stakeholder'
                                    ? 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                }`}>
                                  {member.role.replace("_", " ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-40">
                      <Users className="w-14 h-14 mx-auto mb-3" />
                      <p className="font-bold uppercase tracking-widest text-xs">Void space</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-5">
              <div className="text-center py-32 bg-secondary/10 rounded-3xl border border-dashed border-border opacity-60">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-1">Vault Offline</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">FileSystem module integration is pending deployment in this workspace.</p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </>
  );
}
