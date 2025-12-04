import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const projectIcons = [
  { icon: "fas fa-globe", color: "bg-blue-100 text-blue-600" },
  { icon: "fas fa-mobile-alt", color: "bg-purple-100 text-purple-600" },
  { icon: "fas fa-bullhorn", color: "bg-orange-100 text-orange-600" },
  { icon: "fas fa-cog", color: "bg-green-100 text-green-600" },
  { icon: "fas fa-chart-bar", color: "bg-indigo-100 text-indigo-600" },
  { icon: "fas fa-users", color: "bg-pink-100 text-pink-600" },
];

export function CreateProjectModal({ open, onClose, onSuccess }: CreateProjectModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "fas fa-folder",
    startDate: "",
    dueDate: "",
  });
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);

  const createProjectMutation = useMutation({
    mutationFn: (projectData: any) => apiRequest("POST", "/api/projects", projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onSuccess?.("Project created successfully");
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "fas fa-folder",
      startDate: "",
      dueDate: "",
    });
    setSelectedIconIndex(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const projectData = {
      name: formData.name,
      description: formData.description || null,
      icon: projectIcons[selectedIconIndex].icon,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    createProjectMutation.mutate(projectData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="create-project-modal">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project with name, description, icon, and date range.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
              data-testid="input-project-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project..."
              rows={3}
              data-testid="textarea-project-description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Icon
            </label>
            <div className="flex gap-3">
              {projectIcons.map((iconData, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-colors ${
                    selectedIconIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  } ${iconData.color}`}
                  onClick={() => setSelectedIconIndex(index)}
                  data-testid={`icon-option-${index}`}
                >
                  <i className={iconData.icon} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                data-testid="input-start-date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                data-testid="input-due-date"
              />
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
              disabled={!formData.name.trim() || createProjectMutation.isPending}
              data-testid="button-create-project"
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
