import Link from "next/link";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Board } from "@/lib/supabase/models";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link href={`/boards/${board.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`w-4 h-4 ${board.color} rounded`} />
            <Badge className="text-xs" variant="secondary">
              New
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">
            {board.title}
          </CardTitle>
          <CardDescription className="text-sm mb-4 line-clamp-2">
            {board.description}
          </CardDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
            <span>
              Created {new Date(board.created_at).toLocaleDateString()}
            </span>
            <span>
              Updated {new Date(board.updated_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
