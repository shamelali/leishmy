"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authClient, useSession } from "@/lib/auth/client";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  phone?: string | null;
  location?: string | null;
  avatar?: string | null;
  bio?: string | null;
  specialties?: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Partial<UserProfile> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [profile, setProfile] = useState<{
    role: string | null;
    phone: string | null;
    location: string | null;
    avatar: string | null;
    bio: string | null;
    specialties?: string[];
  }>({ role: null, phone: null, location: null, avatar: null, bio: null, specialties: [] });

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/user?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setProfile({
            role: data.user.role || null,
            phone: data.user.phone || null,
            location: data.user.location || null,
            avatar: data.user.avatar || null,
            bio: data.user.bio || null,
            specialties: data.user.specialties || [],
          });
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const user: UserProfile | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email,
        role: profile.role,
        phone: profile.phone,
        location: profile.location,
        avatar: profile.avatar,
        bio: profile.bio,
        specialties: profile.specialties,
      }
    : null;

  const login = async (email: string, password?: string) => {
    try {
      const { error } = await authClient.signIn.email({
        email,
        password: password ?? "",
      });
      if (error) {
        return { success: false, error: error.message || "Login failed" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Network error during login" };
    }
  };

  const register = async (data: Partial<UserProfile> & { password?: string }) => {
    try {
      const { error } = await authClient.signUp.email({
        email: data.email!,
        password: data.password ?? "",
        name: data.name ?? "",
      });
      if (error) {
        return { success: false, error: error.message || "Registration failed" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Network error during registration" };
    }
  };

  const logout = async () => {
    await authClient.signOut();
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user?.id) return;
    fetch("/api/user?action=profile&userId=" + user.id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isPending,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
