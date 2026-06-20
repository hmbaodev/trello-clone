import { TABLES } from "@/lib/constants";
import { Board, Column, Task } from "@/lib/supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";

export const boardService = {
  async getBoard(supabase: SupabaseClient, boardId: string): Promise<Board> {
    const { data, error } = await supabase
      .from(TABLES.BOARDS)
      .select("*")
      .eq("id", boardId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getBoards(supabase: SupabaseClient, userId: string): Promise<Board[]> {
    const { data, error } = await supabase
      .from(TABLES.BOARDS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async createBoard(
    supabase: SupabaseClient,
    board: Omit<Board, "id" | "created_at" | "updated_at">,
  ): Promise<Board> {
    const { data, error } = await supabase
      .from(TABLES.BOARDS)
      .insert(board)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateBoard(
    supabase: SupabaseClient,
    boardId: string,
    updates: Partial<Board>,
  ): Promise<Board> {
    const { data, error } = await supabase
      .from(TABLES.BOARDS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", boardId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};

export const columnService = {
  async getColumns(
    supabase: SupabaseClient,
    boardId: string,
  ): Promise<Column[]> {
    const { data, error } = await supabase
      .from(TABLES.COLUMNS)
      .select("*")
      .eq("board_id", boardId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async createColumn(
    supabase: SupabaseClient,
    column: Omit<Column, "id" | "created_at">,
  ): Promise<Column> {
    const { data, error } = await supabase
      .from(TABLES.COLUMNS)
      .insert(column)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateColumnTitle(
    supabase: SupabaseClient,
    columnId: string,
    newTitle: string,
  ): Promise<Column> {
    const { data, error } = await supabase
      .from(TABLES.COLUMNS)
      .update({ title: newTitle })
      .eq("id", columnId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};

export const taskService = {
  async getTasksByBoard(
    supabase: SupabaseClient,
    boardId: string,
  ): Promise<Task[]> {
    // docs: https://supabase.com/docs/reference/javascript/update (select)
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select(`*,columns!inner(board_id)`)
      .eq("columns.board_id", boardId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async createTask(
    supabase: SupabaseClient,
    task: Omit<Task, "id" | "created_at" | "updated_at">,
  ): Promise<Task> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert(task)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async moveTask(
    supabase: SupabaseClient,
    taskId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .update({
        column_id: newColumnId,
        sort_order: newOrder,
      })
      .eq("id", taskId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};

export const boardDataService = {
  async getBoardWithColumns(supabase: SupabaseClient, boardId: string) {
    const [board, columns] = await Promise.all([
      boardService.getBoard(supabase, boardId),
      columnService.getColumns(supabase, boardId),
    ]);

    if (!board) throw new Error("Board not found");

    const tasks = await taskService.getTasksByBoard(supabase, boardId);

    const columnWithTasks = columns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.column_id === column.id),
    }));

    return { board, columnWithTasks };
  },

  async createBoardWithDefaultColumns(
    supabase: SupabaseClient,
    boardData: {
      title: string;
      description?: string;
      color?: string;
      userId: string;
    },
  ) {
    const board = await boardService.createBoard(supabase, {
      title: boardData.title,
      description: boardData.description || null,
      color: boardData.color || "bg-blue-500",
      user_id: boardData.userId,
    });

    const defaultColumns = [
      { title: "To Do", sort_order: 0 },
      { title: "In Progress", sort_order: 1 },
      { title: "Review", sort_order: 2 },
      { title: "Done", sort_order: 3 },
    ];

    await Promise.all(
      defaultColumns.map((column) =>
        columnService.createColumn(supabase, {
          ...column,
          board_id: board.id,
          user_id: boardData.userId,
        }),
      ),
    );

    return board;
  },
};
