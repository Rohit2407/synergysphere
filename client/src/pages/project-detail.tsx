import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Users, Calendar, BarChart3, MessageSquare, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@/components/ui/notification";
import { TaskCard } from "@/components/task-card";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { CreateTaskModal } from "@/components/create-task-modal";
import { UserSearchModal } from "@/components/user-search-modal";
import { useWebSocket } from "@/hooks/use-websocket";

export default function ProjectDetail() {
  const [location, setLocation] = useLocation();
  const projectId = location.split("/").pop() || "";
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const { lastMessage } = useWebSocket(projectId);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    enabled: !!projectId,
  });

  const { data: members } = useQuery({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: !!projectId,
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "TASK_CREATED":
        case "TASK_UPDATED":
        case "TASK_DELETED":
          refetchTasks();
          showNotification("Task updated", "info");
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

  const hideNotification = () => {
    setNotification(null);
  };

  const handleBackClick = () => {
    setLocation("/dashboard");
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // Group tasks by status
  const tasksByStatus = {
    "to-do": (tasks as any[])?.filter((task: any) => task.status === "to-do") || [],
    "in-progress": (tasks as any[])?.filter((task: any) => task.status === "in-progress") || [],
    "done": (tasks as any[])?.filter((task: any) => task.status === "done") || [],
  };

  // Calculate project stats
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
    <div className="space-y-6" data-testid="project-detail-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <TaskDetailModal
        taskId={selectedTaskId}
        projectId={projectId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={(message) => showNotification(message, "success")}
      />

      <CreateTaskModal
        projectId={projectId}
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSuccess={(message) => showNotification(message, "success")}
      />

      <UserSearchModal
        open={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        projectId={projectId}
        projectName={(project as any)?.name || ""}
        onSuccess={(message) => showNotification(message, "success")}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBackClick}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <i className={`${project && typeof project === 'object' && 'icon' in project ? (project as any).icon : "fas fa-folder"} text-primary`} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="project-name">
            {project && typeof project === 'object' && 'name' in project ? (project as any).name : 'Loading...'}
          </h2>
          <p className="text-muted-foreground" data-testid="project-description">
            {project && typeof project === 'object' && 'description' in project ? ((project as any).description || "No description provided") : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="text-2xl font-bold text-foreground" data-testid="project-progress">
            {progressPercentage}%
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Tasks</p>
          <p className="text-2xl font-bold text-foreground" data-testid="project-task-count">
            {completedTasks}/{totalTasks}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Team</p>
          <p className="text-2xl font-bold text-foreground" data-testid="project-member-count">
            {(members as any[])?.length || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Due Date</p>
          <p className="text-2xl font-bold text-foreground" data-testid="project-due-date">
            {project && typeof project === 'object' && 'dueDate' in project && (project as any).dueDate ? new Date((project as any).dueDate).toLocaleDateString() : "Not set"}
          </p>
        </div>
      </div>

      {/* Project Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="discussion" data-testid="tab-discussion">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">
            <FileText className="w-4 h-4 mr-2" />
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            <Button onClick={() => setShowCreateTask(true)} data-testid="button-add-task">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Tasks Board */}
          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-3"></div>
                      <div className="h-3 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="tasks-board">
              {/* To Do Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    To Do
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                      {tasksByStatus["to-do"].length}
                    </span>
                  </h4>
                </div>
                
                <div className="space-y-3" data-testid="todo-tasks">
                  {tasksByStatus["to-do"].map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task.id)}
                    />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    In Progress
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                      {tasksByStatus["in-progress"].length}
                    </span>
                  </h4>
                </div>
                
                <div className="space-y-3" data-testid="in-progress-tasks">
                  {tasksByStatus["in-progress"].map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                    Done
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                      {tasksByStatus.done.length}
                    </span>
                  </h4>
                </div>
                
                <div className="space-y-3" data-testid="done-tasks">
                  {tasksByStatus.done.map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {totalTasks === 0 && !tasksLoading && (
            <div className="text-center py-12" data-testid="empty-tasks-state">
              <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Tasks Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first task to start organizing your project work
              </p>
              <Button onClick={() => setShowCreateTask(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create First Task
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="discussion" className="space-y-6">
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Discussion Coming Soon</h3>
            <p className="text-muted-foreground">
              Project discussions and threaded conversations will be available here
            </p>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({(members as any[])?.length || 0})
            </h2>
            <Button
              onClick={() => setShowUserSearch(true)}
              data-testid="button-invite-members"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          </div>
          
          {(members as any[])?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(members as any[]).map((member: any) => (
                <div
                  key={member.id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {member.user.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{member.user.fullName}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        @{member.user.username} • {member.role || 'Member'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Team Members Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by inviting team members to collaborate on this project
              </p>
              <Button onClick={() => setShowUserSearch(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Invite Members
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">File Sharing Coming Soon</h3>
            <p className="text-muted-foreground">
              Project file sharing and document management will be available here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
