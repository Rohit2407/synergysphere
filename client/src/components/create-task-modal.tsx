import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface CreateTaskModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export function CreateTaskModal({
  projectId,
  open,
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_ids: [] as number[],
    parent_id: "" as string | number,
    deadline: "",
    priority: "medium",
    status: "todo",
  });

  // Fetch all members of this project
  const { data: members } = useQuery({
    queryKey: [`/projects/${projectId}/members`],
    enabled: open,
  });

  // Fetch all tasks of this project to select a parent
  const { data: tasks } = useQuery({
    queryKey: [`/projects/${projectId}/tasks/`],
    enabled: open,
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) =>
      apiRequest("POST", `/projects/${projectId}/tasks/`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/projects/${projectId}/tasks/`],
      });
      onSuccess?.("Task created successfully");
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignee_ids: [],
      parent_id: "",
      deadline: "",
      priority: "medium",
      status: "todo",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData: any = {
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      deadline: formData.deadline
        ? new Date(formData.deadline).toISOString()
        : null,
      assignee_ids: formData.assignee_ids.length > 0 ? formData.assignee_ids : [],
      parent_id: formData.parent_id ? Number(formData.parent_id) : null,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="create-task-modal">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task with title, description, assignee, due date,
            priority, and status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter task title"
              required
              data-testid="input-task-title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the task..."
              rows={3}
              data-testid="textarea-task-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Assignees
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-xl border border-border min-h-[44px]">
                {(members as any[])?.length > 0 ? (
                  (members as any[]).map((m: any) => (
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
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                        {m.user?.username}
                      </span>
                    </label>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No members found</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Parent Task (for Nested)
              </label>
              <Select
                value={String(formData.parent_id)}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parent_id: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standalone Task" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Standalone (No Parent)</SelectItem>
                  {(tasks as any[])?.filter(t => !t.parent_id).map((task: any) => (
                    <SelectItem key={task.id} value={String(task.id)}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-foreground mb-2">
               Deadline
             </label>
             <Input
               type="date"
               value={formData.deadline}
               onChange={(e) =>
                 setFormData({ ...formData, deadline: e.target.value })
               }
               data-testid="input-due-date"
             />
           </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger data-testid="select-status">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.title.trim() || createTaskMutation.isPending
              }
              data-testid="button-create-task"
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
