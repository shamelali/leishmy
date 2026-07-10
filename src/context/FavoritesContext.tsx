"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (artistId: string) => boolean;
  toggleFavorite: (artistId: string) => void;
  addFavorite: (artistId: string) => void;
  removeFavorite: (artistId: string) => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "leish_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites, mounted]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const currentUserId = user?.id ?? null;
    if (currentUserId === prevUserId) return;
    setPrevUserId(currentUserId);
    if (!currentUserId) return;
    /* eslint-enable react-hooks/set-state-in-effect */

    (async () => {
      try {
        const serverRes = await fetch(
          `/api/user/favorites`,
        );
        const serverData = serverRes.ok
          ? await serverRes.json()
          : { favorites: [] };
        const serverIds: string[] = (serverData.favorites || []).map((f: any) =>
          String(f.artist_id),
        );
        const localRaw = localStorage.getItem(STORAGE_KEY);
        const localIds: string[] = localRaw ? JSON.parse(localRaw) : [];

        if (serverIds.length === 0 && localIds.length > 0) {
          for (const id of localIds) {
            fetch(`/api/user/favorites`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ artistId: id }),
            }).catch(console.error);
          }
        } else if (serverIds.length > 0) {
          const merged = [...new Set([...serverIds, ...localIds])];
          setFavorites(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          for (const id of merged) {
            if (!serverIds.includes(id)) {
fetch(`/api/user/favorites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artistId: id }),
              }).catch(console.error);
            }
          }
        }
      } catch { console.error("Failed to sync favorites from server"); }
    })();
  }, [user, prevUserId]);

  const isFavorite = useCallback(
    (artistId: string) => favorites.includes(artistId),
    [favorites],
  );

  const syncFavorite = useCallback(
    async (artistId: string, add: boolean) => {
      if (!user?.id) return;
      try {
        await fetch(`/api/user/favorites`, {
          method: add ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistId }),
        });
      } catch { console.error("Failed to sync favorite"); }
    },
    [user],
  );

  const toggleFavorite = useCallback(
    (artistId: string) => {
      setFavorites((prev) => {
        const wasFav = prev.includes(artistId);
        return wasFav
          ? prev.filter((id) => id !== artistId)
          : [...prev, artistId];
      });
      syncFavorite(artistId, !favorites.includes(artistId));
    },
    [syncFavorite, favorites],
  );

  const addFavorite = useCallback(
    (artistId: string) => {
      setFavorites((prev) =>
        prev.includes(artistId) ? prev : [...prev, artistId],
      );
      syncFavorite(artistId, true);
    },
    [syncFavorite],
  );

  const removeFavorite = useCallback(
    (artistId: string) => {
      setFavorites((prev) => prev.filter((id) => id !== artistId));
      syncFavorite(artistId, false);
    },
    [syncFavorite],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        count: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      favorites: [] as string[],
      isFavorite: (_id: string) => false,
      toggleFavorite: (_id: string) => {},
      addFavorite: (_id: string) => {},
      removeFavorite: (_id: string) => {},
      count: 0,
    };
  }
  return ctx;
}
