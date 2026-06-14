"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Filter,
  Grid3x3,
  List,
  Loader2,
  Plus,
  Rocket,
  Search,
  Trello,
} from "lucide-react";

import Navbar from "@/components/navbar";
import { getUsernameFromEmail } from "@/lib/getUsernameFromEmail";
import { Button } from "@/components/ui/button";
import { useBoards } from "@/lib/hooks/useBoards";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VIEW_MODE } from "@/lib/constants";
import { BoardCard } from "@/components/board-card"; // Import your new component here

export default function DashboardPage() {
  const { user } = useUser();
  const { createBoard, boards, loading, error } = useBoards();
  const [viewMode, setViewMode] = useState<VIEW_MODE>(VIEW_MODE.GRID);

  const handleCreateBoard = async () => {
    await createBoard({ title: "New Board" });
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
        <span>Loading your boards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <h2>Error loading boards</h2>
        <p>{error}</p>
      </div>
    );
  }

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
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Boards
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {boards.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Active Projects
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {boards.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Recent Activity
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      boards.filter((board) => {
                        const updatedAt = new Date(board.updated_at);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return updatedAt > oneWeekAgo;
                      }).length
                    }
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Boards
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {boards.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boards Section */}
        <div className="mb-6 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Your Boards
              </h2>
              <p className="text-gray-600">Manage your projects and tasks</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 rounded bg-white border p-1">
                <Button
                  variant={viewMode === VIEW_MODE.GRID ? "default" : "ghost"}
                  size={"sm"}
                  onClick={() => setViewMode(VIEW_MODE.GRID)}
                >
                  <Grid3x3 />
                </Button>
                <Button
                  variant={viewMode === VIEW_MODE.LIST ? "default" : "ghost"}
                  size={"sm"}
                  onClick={() => setViewMode(VIEW_MODE.LIST)}
                >
                  <List />
                </Button>
              </div>
              <Button variant="outline">
                <Filter />
                Filter
              </Button>

              <Button onClick={handleCreateBoard}>
                <Plus />
                Create Board
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search boards..."
              className="pl-10"
            />
          </div>

          {/* Unified Boards List/Grid Layout */}
          {boards.length === 0 ? (
            <div>No boards yet</div>
          ) : (
            <div
              className={
                viewMode === VIEW_MODE.GRID
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  : "flex flex-col space-y-4"
              }
            >
              {boards.map((board) => (
                <BoardCard key={board.id} board={board} />
              ))}

              {/* Reusable "Create new board" Button Card */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group">
                <CardContent
                  className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-[150px]"
                  onClick={handleCreateBoard}
                >
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                  <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">
                    Create new board
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}