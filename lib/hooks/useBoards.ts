"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

import { boardDataService, boardService, taskService } from "@/lib/services";
import { Board, ColumnWithTasks, Task } from "@/lib/supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";
import { PRIORITY } from "../constants";

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadBoards();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase]);

  async function loadBoards() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoards(supabase!, user.id);
      setBoards(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while loading boards.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createBoard(boardData: {
    title: string;
    description?: string;
    color?: string;
  }) {
    if (!user) throw new Error("User must be authenticated to create a board.");

    try {
      const newBoard = await boardDataService.createBoardWithDefaultColumns(
        supabase!,
        {
          ...boardData,
          userId: user.id,
        },
      );

      setBoards((prev) => [newBoard, ...prev]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while creating the board.",
      );
    }
  }

  return { boards, loading, error, loadBoards, createBoard };
}

export function useBoard(boardId: string) {
  const { supabase } = useSupabase();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBoard() {
    if (!boardId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await boardDataService.getBoardWithColumns(
        supabase!,
        boardId,
      );

      setBoard(data.board);
      setColumns(data.columnWithTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBoard(boardId: string, updates: Partial<Board>) {
    try {
      const updatedBoard = await boardService.updateBoard(
        supabase!,
        boardId,
        updates,
      );
      setBoard(updatedBoard);
      return updatedBoard;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while updating the board.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createRealTask(
    columnId: string,
    taskData: {
      title: string;
      description?: string;
      assignee?: string;
      dueDate?: string;
      priority?: PRIORITY;
    },
  ) {
    try {
      const newTask = await taskService.createTask(supabase!, {
        title: taskData.title,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.dueDate || null,
        column_id: columnId,
        sort_order:
          columns.find((col) => col.id === columnId)?.tasks.length || 0,
        priority: taskData.priority || "medium",
      });

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col,
        ),
      );

      return newTask;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while creating the task.",
      );
    }
  }

  async function moveTask(
    taskId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    try {
      await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);

      setColumns((prev) => {
        const newColumns = [...prev];
        let taskToMove: Task | null = null;
        for (const col of newColumns) {
          const taskIndex = col.tasks.findIndex((task) => task.id === taskId);
          if (taskIndex !== -1) {
            taskToMove = col.tasks[taskIndex];
            col.tasks.splice(taskIndex, 1);
            break;
          }
        }
        if (taskToMove) {
          // Add task to new col in UI
          const targetColumn = newColumns.find((col) => col.id === newColumnId);
          if (targetColumn) {
            targetColumn.tasks.splice(newOrder, 0, taskToMove);
          }
        }
        return newColumns;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while moving the task.",
      );
    }
  }

  useEffect(() => {
    if (boardId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadBoard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, supabase]);

  return {
    board,
    columns,
    loading,
    error,
    setColumns,
    updateBoard,
    createRealTask,
    moveTask,
  };
}
