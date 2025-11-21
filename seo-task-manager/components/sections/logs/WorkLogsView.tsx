"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkLogWithRelations } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUsers } from "@/hooks/useUsers";
import { formatDate, todayInputValue } from "@/lib/date";
import { STATUS_MAP } from "@/lib/constants";

export default function WorkLogsView() {
  const [selectedDate, setSelectedDate] = useState(todayInputValue());
  const [selectedUser, setSelectedUser] = useState("");
  const [logs, setLogs] = useState<WorkLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { users } = useUsers();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedDate) params.set("date", selectedDate);
    if (selectedUser) params.set("userId", selectedUser);
    return params.toString();
  }, [selectedDate, selectedUser]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = queryString ? `/api/worklogs?${queryString}` : "/api/worklogs";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("作業ログの取得に失敗しました");
      const data = (await res.json()) as WorkLogWithRelations[];
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8">
      <PageHeader title="作業ログ" description="日毎の作業記録を確認" />

      <section className="card p-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs text-slate-500">日付</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500">メンバー</label>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">すべて</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={fetchLogs}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            再読み込み
          </button>
        </div>
      </section>

      <section className="card p-5">
        {loading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">この条件の作業ログはありません。</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{log.user.name}</span>
                  <span>{formatDate(log.workDate)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{log.task.title}</p>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{log.note}</p>
                <div className="mt-2 text-xs text-slate-500">
                  ステータス: {STATUS_MAP[log.statusSnapshot]?.label ?? log.statusSnapshot}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

