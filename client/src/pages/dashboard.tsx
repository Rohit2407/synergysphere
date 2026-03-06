import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectModal } from "@/components/create-project-modal";
import { Plus, FolderKanban, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function Dashboard() {
  const { user } = useAuth();
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/projects/"],
    enabled: !!user,
  });

  const projectList = (projects as any[]) || [];

  const stats = [
    {
      label: "Projects",
      value: projectList.length,
      icon: FolderKanban,
      gradient: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-500/10",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Active",
      value: projectList.length,
      icon: Clock,
      gradient: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-500/10",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: 0,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-500/10",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Overdue",
      value: 0,
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-500/10",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
              <div className="h-8 bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded mb-3" />
              <div className="h-3 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.username}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projectList.length > 0
              ? `You have ${projectList.length} project${projectList.length > 1 ? "s" : ""}`
              : "Get started by creating your first project"}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateProject(true)}
          className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
          data-testid="button-new-project"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Project
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </div>
              <div className={`w-9 h-9 ${stat.bgLight} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Projects */}
      {projectList.length === 0 ? (
        <motion.div
          variants={item}
          className="text-center py-16 bg-card border border-border rounded-2xl"
        >
          <FolderKanban className="w-14 h-14 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Create your first project to start managing tasks and collaborating with your team.
          </p>
          <Button
            onClick={() => setShowCreateProject(true)}
            className="bg-gradient-to-r from-violet-500 to-blue-500 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Project
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projectList.map((project: any) => (
            <motion.div key={project.id} variants={item}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
      />
    </motion.div>
  );
}
