"use client";

import { useState, useRef, useEffect } from "react";
import { BookmarkPlus, Check, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Board {
  id: number;
  name: string;
}

export default function SaveToBoard({ imageUrl, artistId, artistName }: { imageUrl: string; artistId: string; artistName: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = async () => {
    if (!user) return;
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/inspiration?userId=${user.id}&action=boards`);
      const data = await res.json();
      setBoards(data.boards || []);
    } catch { setBoards([]); }
    setLoading(false);
  };

  const handleSave = async (boardId: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inspiration?userId=${user.id}&action=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, imageUrl, sourceArtistId: artistId, sourceType: "artist_portfolio", caption: `From ${artistName}'s portfolio`, tags: [artistName] }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setOpen(false);
      }
    } catch { console.error("Failed to save"); }
    setSaving(false);
  };

  const handleCreateAndSave = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/inspiration?userId=${user.id}&action=create-board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), isPublic: false }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.board?.id) {
          await handleSave(data.board.id);
        }
      }
    } catch { console.error("Failed to create board"); }
    setCreating(false);
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleOpen}
        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-neutral-900/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-neutral-800"
        title="Save to board"
      >
        {saved ? <Check className="w-4 h-4 text-green-500" /> : <BookmarkPlus className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
      </button>

      {open && (
        <div className="absolute top-10 right-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-100 dark:border-neutral-800 z-50 p-2">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-3">Loading boards...</p>
          ) : boards.length === 0 && !newName ? (
            <div className="py-2">
              <p className="text-xs text-gray-400 text-center mb-2">No boards yet</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Board name"
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800"
                />
                <button
                  onClick={handleCreateAndSave}
                  disabled={creating || !newName.trim()}
                  className="px-2 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-violet-400"
                >
                  {creating ? "..." : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSave(b.id)}
                  disabled={saving}
                  className="w-full text-left px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {b.name}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-neutral-800 pt-1 mt-1">
                <div className="flex gap-2 px-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New board..."
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800"
                  />
                  <button
                    onClick={handleCreateAndSave}
                    disabled={creating || !newName.trim()}
                    className="shrink-0 px-2 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-violet-400"
                  >
                    {creating ? "..." : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
