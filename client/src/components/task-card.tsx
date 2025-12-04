import { Calendar, User, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
  dueDate: string | null;
  assignee?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTagColor = (tag: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    ];
    const index = tag.length % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
      data-testid={`task-card-${task.id}`}
    >
      <CardContent className="p-4">
        <h4 className="font-medium text-foreground mb-2" data-testid="task-title">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid="task-description">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {getInitials(task.assignee.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground" data-testid="task-assignee">
                {task.assignee.fullName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Unassigned</span>
            </div>
          )}
          
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="task-due-date">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), "MMM dd")}
            </div>
          )}
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className={`text-xs ${getTagColor(tag)}`}>
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          
          {task.status === "done" && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <i className="fas fa-check" />
              Completed
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
