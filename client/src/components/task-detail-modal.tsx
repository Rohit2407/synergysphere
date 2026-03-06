import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface TaskDetailModalProps {
  taskId: string | null;
  projectId: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: (message: string) => void;
}

export function TaskDetailModal({ taskId, projectId, open, onClose, onUpdate }: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_ids: [] as number[],
    status: "",
    priority: "",
    deadline: "",
  });
  const [newComment, setNewComment] = useState("");

  const { data: tasks, isLoading } = useQuery({
    queryKey: [`/projects/${projectId}/tasks/`],
    enabled: !!taskId && open,
  });

  const { data: members } = useQuery({
    queryKey: [`/projects/${projectId}/members`],
    enabled: open,
  });

  const { data: comments } = useQuery({
    queryKey: [`/projects/${projectId}/discussions/`, taskId],
    queryFn: () => apiRequest("GET", `/projects/${projectId}/discussions/?task_id=${taskId}`),
    enabled: !!projectId && !!taskId && open,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (updates: any) => apiRequest("PUT", `/projects/${projectId}/tasks/${taskId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/tasks/`] });
      onUpdate?.("Task updated successfully");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => apiRequest("POST", `/projects/${projectId}/discussions/`, { content, task_id: Number(taskId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/discussions/`, taskId] });
      setNewComment("");
    },
  });

  const task = (tasks as any[])?.find((t: any) => t.id === Number(taskId));

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assignee_ids: task.assignees?.map((a: any) => a.id) || [],
        status: task.status || "todo",
        priority: task.priority || "medium",
        deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : "",
      });
    }
  }, [task, taskId]);

  const handleSave = () => {
    const updates: any = {
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      assignee_ids: formData.assignee_ids,
    };
    updateTaskMutation.mutate(updates);
    onClose();
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="task-detail-modal">
        <DialogHeader>
          <DialogTitle data-testid="task-detail-title">Task Details</DialogTitle>
          <DialogDescription>
            View and edit task details, manage assignees, and discuss progress.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-task-title"
                className="bg-secondary/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="textarea-task-description"
                className="bg-secondary/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Assignees</label>
                <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-xl border border-border min-h-[44px]">
                  {(members as any[])?.map((m: any) => (
                    <label key={m.user_id} className="flex items-center gap-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.assignee_ids.includes(m.user_id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...formData.assignee_ids, m.user_id]
                            : formData.assignee_ids.filter(id => id !== m.user_id);
                          setFormData({ ...formData, assignee_ids: ids });
                        }}
                        className="w-3.5 h-3.5 rounded border-border text-indigo-600 focus:ring-indigo-600/20"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                        {m.user?.username}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status" className="bg-secondary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subtasks Section */}
            {task && (
              <div className="p-4 bg-secondary/10 rounded-2xl border border-border/50">
                <div className="flex items-center justify-between mb-3">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <FileText className="w-3 h-3" /> Subtasks ({task.subtasks?.length || 0})
                   </h4>
                </div>
                <div className="space-y-2">
                  {task.subtasks?.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between bg-card p-3 rounded-xl border border-border/50 shadow-sm group hover:border-indigo-500/30 transition-colors">
                      <span className="text-sm font-semibold text-foreground">{sub.title}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        sub.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-secondary text-muted-foreground border-border'
                      }`}>
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                  {(!task.subtasks || task.subtasks.length === 0) && (
                    <p className="text-[10px] text-muted-foreground italic py-2 px-1">No nested subtasks defined.</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Deadline</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  data-testid="input-due-date"
                  className="bg-secondary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-priority" className="bg-secondary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comments Section */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                Task Channel
              </h4>
              
              <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-1">
                {(comments as any[])?.length > 0 ? (
                  (comments as any[]).map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-9 h-9 rounded-xl shadow-sm border border-border/50 shrink-0">
                        <AvatarFallback className="text-[11px] bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold">
                          {comment.sender?.username?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-secondary/30 rounded-2xl rounded-tl-sm p-3.5 border border-border/40">
                          <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 px-1">
                          <span className="text-[10px] font-bold text-foreground">{comment.sender?.username}</span>
                          <span className="text-[10px] text-muted-foreground opacity-60">• {format(new Date(comment.created_at), "MMM dd, h:mm a")}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-secondary/5 rounded-2xl border border-dashed border-border/50">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">No activity recorded</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-start bg-secondary/20 p-2 rounded-2xl border border-border/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Broadcast a message to this task channel..."
                  rows={2}
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm resize-none py-2 px-3"
                  data-testid="textarea-new-comment"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-10 w-10 shrink-0 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  data-testid="button-add-comment"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button variant="ghost" onClick={onClose} data-testid="button-cancel" className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest">
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateTaskMutation.isPending}
                data-testid="button-save-task"
                className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-11 px-8 font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {updateTaskMutation.isPending ? "Syncing..." : "Apply Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
