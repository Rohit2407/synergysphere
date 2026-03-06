import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserSearchModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess?: (message: string) => void;
}

export function UserSearchModal({ open, onClose, projectId, projectName, onSuccess }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("employee");
  const [invitedUsers, setInvitedUsers] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      return res.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: currentMembers } = useQuery({
    queryKey: [`/projects/${projectId}/members`],
    enabled: !!projectId,
  });

  const inviteUserMutation = useMutation({
    mutationFn: (userData: { user_id: number; role: string; project_id: number }) =>
      apiRequest("POST", `/projects/${projectId}/members`, userData),
    onSuccess: (_, { user_id }) => {
      setInvitedUsers(prev => new Set(prev).add(user_id));
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/members`] });
      onSuccess?.("User invited successfully");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to invite user. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedRole("employee");
      setInvitedUsers(new Set());
    }
  }, [open]);

  const handleClose = () => {
    setSearchQuery("");
    setSelectedRole("employee");
    setInvitedUsers(new Set());
    onClose();
  };

  const handleInviteUser = (userId: number) => {
    inviteUserMutation.mutate({
      user_id: userId,
      role: selectedRole,
      project_id: parseInt(projectId),
    });
  };

  const users = (searchResults as User[]) || [];
  const members = (currentMembers as any[]) || [];
  const memberUserIds = new Set(members.map(m => m.user_id));

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="user-search-modal">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
          <DialogDescription>
            Search and invite users to join "{projectName}" project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
                data-testid="input-user-search"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-secondary border border-border rounded-xl px-3 text-sm font-medium focus:ring-0 outline-none h-10 min-w-[140px]"
            >
              <option value="manager">Manager</option>
              <option value="project_manager">Project Manager</option>
              <option value="employee">Employee</option>
              <option value="stakeholder">Stakeholder</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Type at least 2 characters to search</p>
              </div>
            ) : isSearching ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-28 mb-1" />
                        <div className="h-3 bg-muted rounded w-40" />
                      </div>
                      <div className="w-16 h-8 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const isAlreadyMember = memberUserIds.has(user.id);
                  const isInvited = invitedUsers.has(user.id);

                  return (
                    <div
                      key={user.id}
                      className={`bg-card border border-border rounded-xl p-3 transition-all ${
                        isAlreadyMember ? "opacity-50" : "hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-tr from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">{user.username}</h4>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAlreadyMember ? (
                            <Badge variant="secondary" className="text-xs">Member</Badge>
                          ) : isInvited ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Added
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleInviteUser(user.id)}
                              disabled={inviteUserMutation.isPending}
                              data-testid={`button-invite-${user.id}`}
                              className="text-xs h-7"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Invite
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 mt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {invitedUsers.size > 0 && (
                <span className="text-emerald-600">
                  {invitedUsers.size} user{invitedUsers.size !== 1 ? "s" : ""} invited
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleClose} data-testid="button-close">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}