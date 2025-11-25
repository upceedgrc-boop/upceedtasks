"use client";

import { useEffect, useState } from "react";
import type { User } from "@prisma/client";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        console.log("[useUsers] Fetching users from /api/users");
        const res = await fetch("/api/users");
        console.log("[useUsers] Response status:", res.status, res.ok);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.message || `ユーザー取得に失敗しました (${res.status})`;
          console.error("[useUsers] API error:", errorMessage, errorData);
          throw new Error(errorMessage);
        }
        
        const data = (await res.json()) as User[];
        console.log("[useUsers] Received users:", data.length, "users");
        
        if (mounted) {
          setUsers(data);
          setError(null);
          if (data.length === 0) {
            console.warn("[useUsers] ユーザーが0件です。データベースにユーザーが登録されているか確認してください。");
          } else {
            console.log("[useUsers] Users loaded successfully:", data.map(u => u.name).join(", "));
          }
        }
      } catch (err) {
        console.error("[useUsers] Error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "ユーザー取得エラー");
          setUsers([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  return { users, loading, error };
}

