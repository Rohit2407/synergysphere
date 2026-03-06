import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Users, Mail } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface TeamMember {
  id: number;
  username: string;
  email: string;
}

export function Team() {
  const { user } = useAuth();
  
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["/users/"],
    enabled: !!user,
  });

  const members = (teamMembers as TeamMember[]) || [];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 bg-card border border-border p-5 rounded-2xl">
          <Users className="w-5 h-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground">Team Members</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div>
                  <div className="h-4 bg-muted rounded w-24 mb-1.5" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item} className="flex items-center gap-3 bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div className="w-9 h-9 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <Users className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Team Members</h1>
          <p className="text-xs text-muted-foreground">{members.length} registered user{members.length !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {members.length === 0 ? (
        <motion.div variants={item} className="text-center py-12 bg-card border border-border rounded-2xl">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground mb-1">No Team Members Yet</h3>
          <p className="text-muted-foreground text-sm">
            Start by creating projects and inviting team members.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <motion.div
              key={member.id}
              variants={item}
              whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {member.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {member.username}
                  </h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}