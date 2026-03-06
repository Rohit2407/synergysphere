import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Key, Mail, User } from "lucide-react";

interface CreateCredentialModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function CreateCredentialModal({ open, onClose, projectId, projectName }: CreateCredentialModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/projects/${projectId}/members/create-credential`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/members`] });
      toast({
        title: "Success",
        description: `Credentials created for ${username}.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create credentials.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("employee");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      username,
      email,
      password,
      role
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle>Create Member Credentials</DialogTitle>
          <DialogDescription>
            Atomic creation of a new user account and project membership for "{projectName}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Project Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="manager">Manager</option>
              <option value="project_manager">Project Manager</option>
              <option value="employee">Employee</option>
              <option value="stakeholder">Stakeholder</option>
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-500 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create & Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
