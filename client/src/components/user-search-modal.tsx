import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
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
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching } = useQuery({
  queryKey: ["/api/users/search", searchQuery],
  queryFn: async () => {
    if (searchQuery.length < 2) return [];
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to search users");
    return res.json();
  },
  enabled: searchQuery.length >= 2,
});


  const { data: currentMembers } = useQuery({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });

  const inviteUserMutation = useMutation({
    mutationFn: (userData: { userId: string; role: string }) => 
      apiRequest("POST", `/api/projects/${projectId}/members`, userData),
    onSuccess: (_, { userId }) => {
      setInvitedUsers(prev => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setInvitedUsers(new Set());
    }
  }, [open]);

  const handleClose = () => {
    setSearchQuery("");
    setInvitedUsers(new Set());
    onClose();
  };

  const handleInviteUser = (userId: string) => {
    inviteUserMutation.mutate({ userId, role: "member" });
  };

  const users = searchResults as User[] || [];
  const members = currentMembers as any[] || [];
  const memberIds = new Set(members.map(m => m.userId));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-user-search"
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Type at least 2 characters to search for users</p>
              </div>
            ) : isSearching ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-48"></div>
                        </div>
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const isAlreadyMember = memberIds.has(user.id);
                  const isInvited = invitedUsers.has(user.id);
                  
                  return (
                    <Card key={user.id} className={`transition-all ${
                      isAlreadyMember ? 'opacity-50' : 'hover:shadow-md'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{user.fullName}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="truncate">@{user.username}</span>
                              <span>•</span>
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAlreadyMember ? (
                              <Badge variant="secondary">Member</Badge>
                            ) : isInvited ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                Invited
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleInviteUser(user.id)}
                                disabled={inviteUserMutation.isPending}
                                data-testid={`button-invite-${user.id}`}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Invite
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {invitedUsers.size > 0 && (
                <span className="text-green-600">
                  {invitedUsers.size} user{invitedUsers.size !== 1 ? 's' : ''} invited
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} data-testid="button-close">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}