"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

import { boardDataService } from "@/lib/services";
import { Board } from "@/lib/supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { boards, loading, error, createBoard };
}
