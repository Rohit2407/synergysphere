import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar, FolderOpen } from "lucide-react";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role?: string;
  joinedAt?: string;
  projectsCount?: number;
  tasksCount?: number;
}

export function Team() {
  const { user } = useAuth();
  
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Team Members</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
                  </div>
                </div>
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

  const members = teamMembers as TeamMember[] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Team Members</h1>
      </div>

      {members.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
            <p className="text-muted-foreground">
              Start by creating projects and inviting team members to collaborate.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{member.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{member.username}</p>
                  </div>
                  {member.role && (
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                
                {member.joinedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  {member.projectsCount !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FolderOpen className="w-3 h-3" />
                      <span>{member.projectsCount} projects</span>
                    </div>
                  )}
                  
                  {member.tasksCount !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{member.tasksCount} tasks</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}