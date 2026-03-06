import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { CheckSquare, Clock, AlertCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  deadline?: string;
  project_id: number;
  assignee_id?: number;
  created_at: string;
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "high": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "medium": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "low": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    default: return "bg-secondary text-muted-foreground border-border";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "todo": return "To Do";
    case "in_progress": return "In Progress";
    case "done": return "Done";
    default: return status;
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case "todo": return "bg-slate-400";
    case "in_progress": return "bg-amber-500";
    case "done": return "bg-emerald-500";
    default: return "bg-slate-400";
  }
}

function TaskItem({ task }: { task: Task }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h4>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${getPriorityStyle(task.priority)}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
      {task.description && (
        <p className="text-muted-foreground text-[11px] mb-3 line-clamp-1">{task.description}</p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${getStatusDot(task.status)}`} />
          <span className="text-[10px] font-medium text-muted-foreground">{getStatusLabel(task.status)}</span>
        </div>
        {task.deadline && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>{format(new Date(task.deadline), "MMM dd")}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function Tasks() {
  const { user } = useAuth();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/users/me/tasks"],
    enabled: !!user,
  });

  const taskList = (tasks as Task[]) || [];
  const todoTasks = taskList.filter(t => t.status === "todo");
  const inProgressTasks = taskList.filter(t => t.status === "in_progress");
  const doneTasks = taskList.filter(t => t.status === "done");

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 bg-card border border-border p-5 rounded-2xl">
          <CheckSquare className="w-5 h-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground">My Tasks</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-8 bg-card border border-border rounded-xl animate-pulse" />
              <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
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
        <div className="w-9 h-9 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
          <CheckSquare className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Tasks</h1>
          <p className="text-xs text-muted-foreground">{taskList.length} task{taskList.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* To Do */}
        <div className="space-y-3">
          <motion.div variants={item} className="flex items-center justify-between bg-card border border-border px-3 py-2 rounded-xl">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> To Do
            </h4>
            <span className="bg-secondary text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded">{todoTasks.length}</span>
          </motion.div>
          {todoTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No tasks to do</p>
          ) : (
            todoTasks.map(task => <TaskItem key={task.id} task={task} />)
          )}
        </div>

        {/* In Progress */}
        <div className="space-y-3">
          <motion.div variants={item} className="flex items-center justify-between bg-card border border-border px-3 py-2 rounded-xl">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> In Progress
            </h4>
            <span className="bg-secondary text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded">{inProgressTasks.length}</span>
          </motion.div>
          {inProgressTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No tasks in progress</p>
          ) : (
            inProgressTasks.map(task => <TaskItem key={task.id} task={task} />)
          )}
        </div>

        {/* Done */}
        <div className="space-y-3">
          <motion.div variants={item} className="flex items-center justify-between bg-card border border-border px-3 py-2 rounded-xl">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" /> Done
            </h4>
            <span className="bg-secondary text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded">{doneTasks.length}</span>
          </motion.div>
          {doneTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No completed tasks</p>
          ) : (
            doneTasks.map(task => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>
    </motion.div>
  );
}