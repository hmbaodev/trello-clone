import { ColumnWithTasks } from "@/lib/supabase/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface ColumnProps {
  column: ColumnWithTasks;
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateTask: (taskData: any) => Promise<void>;
  onEditColumn: (columnWithTasks: ColumnWithTasks) => void;
}

const Column = ({
  column,
  children,
  onCreateTask,
  onEditColumn,
}: ColumnProps) => {
  return (
    <div className="w-full lg:shrink-0 lg:w-80">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Column Header */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {column.tasks.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 cursor-pointer"
            >
              <MoreHorizontal />
            </Button>
          </div>
        </div>
        {/* Column Content */}
        <div className="p-2">{children}</div>
      </div>
    </div>
  );
};

export default Column;
