import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Folder, CheckCircle2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notification } from "@/components/ui/notification";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectModal } from "@/components/create-project-modal";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const handleProjectClick = (projectId: string) => {
    setLocation(`/projects/${projectId}`);
  };

  // Calculate dashboard stats
  const stats = {
    total: (projects as any[])?.length || 0,
    active: (projects as any[])?.filter((p: any) => p.status === "active")?.length || 0,
    pending: (projects as any[])?.filter((p: any) => p.status === "planning")?.length || 0,
    totalMembers: (projects as any[])?.reduce((acc: number, p: any) => acc + p.memberCount, 0) || 0,
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(message) => showNotification(message, "success")}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="dashboard-title">
            Projects
          </h2>
          <p className="text-muted-foreground">
            Manage your team projects and collaboration
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
          data-testid="button-new-project"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-projects">
                {stats.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-active-projects">
                {stats.active}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-projects">
                {stats.pending}
              </p>
              <p className="text-sm text-muted-foreground">Planning</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-members">
                {stats.totalMembers}
              </p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-lg mb-4"></div>
              <div className="h-5 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded mb-4"></div>
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : projects && (projects as any[]).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
          {(projects as any[]).map((project: any) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="empty-projects-state">
          <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to get started with team collaboration
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
}
