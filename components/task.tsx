import type { Task } from "@/lib/supabase/models";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { getPriorityColor } from "@/lib/getPriorityColor";

interface TaskProps {
  task: Task;
}

const Task = ({ task }: TaskProps) => {
  return (
    <div>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {/* Task header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
                {task.title}
              </h4>
            </div>
            {/* Task Description */}
            <p className="text-xs text-gray-600 line-clamp-2">
              {task.description || "No description"}
            </p>
            {/* Task metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {task.assignee && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="size-3" />
                    <span className="truncate">{task.assignee}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="size-3" />
                    <span className="truncate">{task.due_date}</span>
                  </div>
                )}
                <div
                  className={`size-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Task;
