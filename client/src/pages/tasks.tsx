import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "to-do" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  projectId: string;
  project: {
    name: string;
    icon: string;
  };
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "done": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "in-progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "to-do": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

export function Tasks() {
  const { user } = useAuth();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/user/tasks"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <CheckSquare className="w-6 h-6" />
          <h1 className="text-2xl font-bold">My Tasks</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const taskList = tasks as Task[] || [];
  const todoTasks = taskList.filter(t => t.status === "to-do");
  const inProgressTasks = taskList.filter(t => t.status === "in-progress");
  const doneTasks = taskList.filter(t => t.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckSquare className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Tasks</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            To Do ({todoTasks.length})
          </h2>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        Due {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <i className={task.project.icon + " w-3 h-3"} />
                      {task.project.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {todoTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks to do
              </p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500"></div>
            In Progress ({inProgressTasks.length})
          </h2>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        Due {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <i className={task.project.icon + " w-3 h-3"} />
                      {task.project.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {inProgressTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks in progress
              </p>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-green-500" />
            Done ({doneTasks.length})
          </h2>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 opacity-75">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium line-through">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        Due {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <i className={task.project.icon + " w-3 h-3"} />
                      {task.project.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {doneTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No completed tasks
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}