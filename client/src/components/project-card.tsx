import { Link } from "wouter";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

const gradients = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-violet-500",
];

export function ProjectCard({ project }: { project: Project }) {
  const gradient = gradients[project.id % gradients.length];

  return (
    <Link href={`/projects/${project.id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/5 transition-all"
      >
        {/* Gradient accent stripe */}
        <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

        <div className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {project.name}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2 mb-3 min-h-[2rem]">
            {project.description || "No description"}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(project.created_at), "MMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>Team</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
