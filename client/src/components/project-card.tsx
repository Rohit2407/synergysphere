import { Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progressPercentage = project.taskCount > 0 
    ? Math.round((project.completedTaskCount / project.taskCount) * 100) 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "planning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getIconClass = (iconString: string) => {
    // Extract the icon class from the string (e.g., "fas fa-globe" -> "fa-globe")
    return iconString.includes("fa-") ? iconString : "fas fa-folder";
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={onClick}
      data-testid={`project-card-${project.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <i className={`${getIconClass(project.icon)} text-primary`} />
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="project-name">
          {project.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2" data-testid="project-description">
          {project.description || "No description provided"}
        </p>
        
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {/* Show placeholder avatars for team members */}
              {Array.from({ length: Math.min(3, project.memberCount) }, (_, i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-background">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project.memberCount} members
            </span>
          </div>
          <span className="text-muted-foreground flex items-center gap-1" data-testid="task-count">
            <CheckCircle2 className="w-3 h-3" />
            {project.completedTaskCount}/{project.taskCount} tasks
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium" data-testid="progress-percentage">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
