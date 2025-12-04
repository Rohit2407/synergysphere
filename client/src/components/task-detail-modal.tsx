import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User, Tag, MessageSquare, X } from "lucide-react";
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
    assigneeId: "",
    status: "",
    priority: "",
    dueDate: "",
  });
  const [newComment, setNewComment] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId && open,
  });

  const { data: projectMembers } = useQuery({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: open,
  });

  const { data: comments } = useQuery({
    queryKey: ["/api/tasks", taskId, "comments"],
    enabled: !!taskId && open,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (updates: any) => apiRequest("PATCH", `/api/tasks/${taskId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      onUpdate?.("Task updated successfully");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => apiRequest("POST", `/api/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      setNewComment("");
    },
  });

  useEffect(() => {
    if (task && typeof task === 'object' && 'title' in task) {
      const taskData = task as any;
      setFormData({
        title: taskData.title || "",
        description: taskData.description || "",
        assigneeId: taskData.assigneeId || "",
        status: taskData.status || "to-do",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate ? format(new Date(taskData.dueDate), "yyyy-MM-dd") : "",
      });
    }
  }, [task]);

  const handleSave = () => {
    const updates = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
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
          <DialogTitle data-testid="task-detail-title">
            {isLoading ? "Loading..." : (task && typeof task === 'object' && 'title' in task ? (task as any).title : "Task Details")}
          </DialogTitle>
          <DialogDescription>
            View and edit task details including assignee, status, priority, and due date.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-task-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                data-testid="textarea-task-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Assignee</label>
                <Select
                  value={formData.assigneeId || 'unassigned'}
                  onValueChange={(value) => setFormData({ ...formData, assigneeId: value === 'unassigned' ? '' : value })}
                >
                  <SelectTrigger data-testid="select-assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(projectMembers as any[])?.map((member: any) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to-do">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  data-testid="input-due-date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-priority">
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
            <div>
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
              </h4>
              
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {(comments as any[])?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {comment.user.fullName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comment.user.fullName} • {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    You
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    data-testid="textarea-new-comment"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    size="sm"
                    data-testid="button-add-comment"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateTaskMutation.isPending}
                data-testid="button-save-task"
              >
                {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
