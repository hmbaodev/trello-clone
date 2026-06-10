"use client";

import { useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";

import Navbar from "@/components/navbar";
import { getUsernameFromEmail } from "@/lib/getUsernameFromEmail";
import { Button } from "@/components/ui/button";
import { useBoards } from "@/lib/hooks/useBoards";

export default function DashboardPage() {
  const { user } = useUser();
  const { createBoard } = useBoards();

  const handleCreateBoard = async () => {
    await createBoard({ title: "New Board" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back,{" "}
            {user?.firstName ??
              getUsernameFromEmail(
                user?.emailAddresses[0].emailAddress as string,
              )}
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your boards today.
          </p>
          <Button className="w-full sm:w-auto cursor-pointer mt-2" onClick={handleCreateBoard}>
            <Plus className="size-4" />
            Create Board
          </Button>
        </div>
      </main>
    </div>
  );
}
