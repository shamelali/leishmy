"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageIcon, Plus, Trash2, Grid3X3, FolderOpen, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function InspirationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    fetch(`/api/inspiration?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setBoards(data.boards || []);
        setItems(data.items || []);
        if (data.boards?.length > 0 && !activeBoardId) {
          setActiveBoardId(data.boards[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router, activeBoardId]);

  const createBoard = async () => {
    if (!user || !boardName.trim()) return;
    const res = await fetch(`/api/inspiration?userId=${user.id}&action=create-board`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: boardName, description: boardDescription }),
    });
    const data = await res.json();
    if (data.success) {
      setBoards((prev) => [...prev, data.board]);
      setActiveBoardId(data.board.id);
      setShowCreateBoard(false);
      setBoardName("");
      setBoardDescription("");
    }
  };

  const deleteBoard = async (boardId: number) => {
    if (!user) return;
    await fetch(`/api/inspiration?userId=${user.id}&action=delete-board`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId }),
    });
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    setItems((prev) => prev.filter((i) => i.boardId !== boardId));
    if (activeBoardId === boardId) {
      setActiveBoardId(boards.find((b) => b.id !== boardId)?.id || null);
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!user) return;
    await fetch(`/api/inspiration?userId=${user.id}&action=delete-item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const boardItems = items.filter((i) => i.boardId === activeBoardId);
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ImageIcon className="w-6 h-6 text-rose-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Inspiration</h1>
          <span className="px-3 py-1 text-sm font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full">
            {items.length}
          </span>
        </div>

        <div className="flex gap-4 flex-wrap mb-6">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => setActiveBoardId(board.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeBoardId === board.id
                  ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400"
                  : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-rose-200 dark:hover:border-rose-800"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              {board.name}
              <span className="ml-1 text-xs opacity-60">
                ({items.filter((i) => i.boardId === board.id).length})
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBoard(board.id);
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-950/50 text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          ))}
          <button
            onClick={() => setShowCreateBoard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-gray-400 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-500 transition-all"
          >
            <Plus className="w-4 h-4" /> New Board
          </button>
        </div>

        {showCreateBoard && (
          <div className="mb-6 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Create New Board</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Board name..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <input
                type="text"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={createBoard}
                  disabled={!boardName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-700 text-sm disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateBoard(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeBoard && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-rose-500" />
              {activeBoard.name}
              {activeBoard.description && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  {activeBoard.description}
                </span>
              )}
            </h2>
          </div>
        )}

        {boardItems.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No saved looks yet</h2>
            <p className="text-gray-400 mb-6">
              Browse artists and save their portfolio looks, or upload your own inspiration!
            </p>
            <Link
              href="/artists"
              className="inline-flex px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all"
            >
              Browse Artists
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {boardItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.caption || "Saved look"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    {item.caption && (
                      <p className="text-white text-xs font-medium truncate">{item.caption}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(item.tags || []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white/80 hover:text-red-400 hover:bg-black/60 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
