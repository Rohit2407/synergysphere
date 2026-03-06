import { motion } from "framer-motion";
import { AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline?: string;
  assignees: { id: number; username: string }[];
  subtasks?: any[];
}

function getPriorityDot(priority: string) {
  switch (priority) {
    case "high": return "bg-rose-500";
    case "medium": return "bg-amber-500";
    case "low": return "bg-emerald-500";
    default: return "bg-slate-400";
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case "high": return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
    case "medium": return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "low": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    default: return "text-muted-foreground bg-secondary";
  }
}

export function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-3 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getPriorityDot(task.priority)}`} />
        <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors flex-1">
          {task.title}
        </h4>
      </div>

      {task.description && (
        <p className="text-muted-foreground text-[11px] line-clamp-1 ml-4 mb-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between ml-4">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getPriorityLabel(task.priority)}`}>
            {task.priority}
          </span>
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
               <FileText className="w-2.5 h-2.5" /> {task.subtasks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.deadline && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <AlertCircle className="w-2.5 h-2.5" />
              {format(new Date(task.deadline), "MMM dd")}
            </span>
          )}
          <div className="flex -space-x-2 overflow-hidden">
            {task.assignees?.map((user: any) => (
              <div 
                key={user.id} 
                title={user.username}
                className="w-5 h-5 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] font-extrabold border border-card shadow-sm"
              >
                {user.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
