"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import Navbar from "@/components/navbar";
import { useBoard } from "@/lib/hooks/useBoards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Column from "@/components/column";
import Task from "@/components/task";
import TaskOverlay from "@/components/task-overlay";
import { DEFAULT_COLORS, PRIORITY } from "@/lib/constants";
import { ColumnWithTasks } from "@/lib/supabase/models";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const {
    board,
    columns,
    updateBoard,
    createRealTask,
    setColumns,
    moveTask,
    createColumn,
    updateColumnTitle
  } = useBoard(id);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [editingColumn, setEditingColumn] = useState<ColumnWithTasks | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Update document title dynamically in client-side once board is loaded
  useEffect(() => {
    if (board?.title) {
      document.title = board.title;
    } else {
      document.title = "Loading Board...";
    }
  }, [board?.title]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleUpdateBoard = async (ev: React.SubmitEvent) => {
    ev.preventDefault();

    if (!newTitle.trim() || !board) return;

    try {
      await updateBoard(board.id, {
        title: newTitle.trim(),
        color: newColor || board.color,
      });
      setIsEditingTitle(false);
    } catch {}
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority?: PRIORITY;
  }) => {
    const targetColumn = columns[0];
    if (!targetColumn) {
      throw new Error("No column available to create tasks");
    }

    await createRealTask(targetColumn.id, taskData);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateTask = async (ev: any) => {
    ev.preventDefault();

    const formData = new FormData(ev.currentTarget);
    const taskData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: (formData.get("assignee") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority: (formData.get("priority") as PRIORITY) || "medium",
    };

    if (taskData.title.trim()) {
      await createTask(taskData);

      // Close the dialog after creating a task (Shadcn UI doesn't close automatically)
      const trigger = document.querySelector(
        '[data-state="open"',
      ) as HTMLElement;
      if (trigger) trigger.click();
    }
  };

  const handleDragStart = (ev: DragStartEvent) => {
    const taskId = ev.active.id as string;
    const task = columns
      .flatMap((col) => col.tasks)
      .find((task) => task.id === taskId);

    if (task) setActiveTask(task);
  };

  const handleDragOver = (ev: DragOverEvent) => {
    const { active, over } = ev;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId),
    );
    const targetColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === overId),
    );

    if (!sourceColumn || !targetColumn) return;

    if (sourceColumn.id === targetColumn.id) {
      const activeIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === activeId,
      );
      const overIndex = targetColumn.tasks.findIndex(
        (task) => task.id === overId,
      );

      if (activeIndex !== overIndex) {
        setColumns((prev: ColumnWithTasks[]) => {
          const newColumns = [...prev];
          const column = newColumns.find((col) => col.id === sourceColumn.id);

          if (column) {
            const tasks = [...column.tasks];
            const [removed] = tasks.splice(activeIndex, 1);
            tasks.splice(overIndex, 0, removed);
            column.tasks = tasks;
          }

          return newColumns;
        });
      }
    }
  };

  const handleDragEnd = async (ev: DragEndEvent) => {
    const { active, over } = ev;

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );

      // Move task to another column
      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        await moveTask(taskId, targetColumn.id, targetColumn.tasks.length);
      }
    } else {
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );

      const targetColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === overId),
      );

      if (sourceColumn && targetColumn) {
        const oldIndex = sourceColumn.tasks.findIndex(
          (task) => task.id === taskId,
        );
        const newIndex = targetColumn.tasks.findIndex(
          (task) => task.id === overId,
        );

        if (oldIndex !== newIndex) {
          await moveTask(taskId, targetColumn.id, newIndex);
        }
      }
    }
  };

  async function handleCreateColumn(ev: React.SubmitEvent) {
    ev.preventDefault();

    if (!newColumnTitle.trim()) return;

    await createColumn(newColumnTitle.trim());

    setNewColumnTitle("");
    setIsCreatingColumn(false);
  }

  function handleEditColumn(column: ColumnWithTasks) {
    setIsEditingColumn(true);
    setEditingColumn(column);
    setEditingColumnTitle(column.title);
  }

  async function handleUpdateColumn(ev: React.SubmitEvent) {
    ev.preventDefault();

    if (!editingColumnTitle.trim() || !editingColumn) return;

    await updateColumnTitle(editingColumn.id, editingColumnTitle.trim());

    setEditingColumnTitle("");
    setIsEditingColumn(false);
    setEditingColumn(null);
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          boardTitle={board?.title}
          onEditBoard={() => {
            setNewTitle(board?.title ?? "");
            setNewColor(board?.color ?? "");
            setIsEditingTitle(true);
          }}
          onFilterClick={() => setIsFilterOpen(true)}
          filterCount={2}
        />

        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent className="w-95vw max-w-106.25 mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateBoard}>
              <div className="space-y-2">
                <Label htmlFor="boardTitle">Board Title</Label>
                <Input
                  id="boardTitle"
                  value={newTitle}
                  onChange={(ev) => setNewTitle(ev.target.value)}
                  placeholder="Enter board title..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Board Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`size-8 rounded-full ${color} ${color === newColor ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingTitle(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Save changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="w-95vw max-w-106.25 mx-auto">
            <DialogHeader>
              <DialogTitle>Filter Tasks</DialogTitle>
              <p className="text-sm text-gray-600">
                Filter tasks by priority, assignee, or due date
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PRIORITY).map((priority) => (
                    <Button key={priority} size="sm">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              {/* <div className="space-y-2">
              <Label>Assignee</Label>

            </div> */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                >
                  Clear Filters
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Board Content */}
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Tasks: </span>
                {columns?.reduce((sum, col) => sum + col.tasks.length, 0)}
              </div>
            </div>

            {/* Add tag dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto cursor-pointer">
                  <Plus />
                  Add Tasks
                </Button>
              </DialogTrigger>
              <DialogContent className="w-95vw max-w-106.25 mx-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <p className="text-sm text-gray-600">
                    Add a new task to the board
                  </p>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateTask}>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Task title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Task description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Input
                      id="assignee"
                      name="assignee"
                      placeholder="Assignee"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select name="priority" defaultValue={PRIORITY.MEDIUM}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PRIORITY).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" id="dueDate" name="dueDate" />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" className="cursor-pointer">
                      Create Task
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Board Columns */}
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto 
            lg:pb-6 lg:px-2 lg:-mx-2 lg:[&::-webkit-scrollbar]:h-2 
            lg:[&::-webkit-scrollbar-track]:bg-gray-100 
            lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full 
            space-y-4 lg:space-y-0"
            >
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onCreateTask={handleCreateTask}
                  onEditColumn={handleEditColumn}
                >
                  <SortableContext
                    items={column.tasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {column.tasks.map((task) => (
                        <Task key={task.id} task={task} />
                      ))}
                    </div>
                  </SortableContext>
                </Column>
              ))}
              <div className="w-full lg:shrink-0 lg:w-80">
                <Button
                  variant="outline"
                  className="size-full cursor-pointer min-h-50 border-dashed border-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsCreatingColumn(true)}
                >
                  <Plus />
                  Add another list
                </Button>
              </div>
              <DragOverlay>
                {activeTask && <TaskOverlay task={activeTask} />}
              </DragOverlay>
            </div>
          </DndContext>
        </main>
      </div>

      {/* Column Creation Dialog */}
      <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
        <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Add new column to organize your tasks
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                placeholder="Enter column title..."
                onChange={(ev) => setNewColumnTitle(ev.target.value)}
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => {
                  setIsCreatingColumn(false);
                  setNewColumnTitle("");
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                Edit Column
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Column Editing Dialog */}
      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the title of your column
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                placeholder="Enter column title..."
                onChange={(ev) => setEditingColumnTitle(ev.target.value)}
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => {
                  setIsEditingColumn(false);
                  setEditingColumnTitle("");
                  setEditingColumn(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                Edit Column
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
