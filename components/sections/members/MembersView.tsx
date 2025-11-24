"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TaskWithUsers } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUsers } from "@/hooks/useUsers";
import { TASK_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/date";

export default function MembersView() {
  const { users } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<TaskWithUsers[]>([]);
  const [checkingTasks, setCheckingTasks] = useState<TaskWithUsers[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const fetchMemberTasks = useCallback(
    async (userId: number) => {
      setLoading(true);
      try {
        const [assignedRes, checkingRes] = await Promise.all([
          fetch(`/api/tasks?assigneeId=${userId}&excludeDone=true`),
          fetch(`/api/tasks?checkerId=${userId}&excludeDone=true`),
        ]);
        if (!assignedRes.ok || !checkingRes.ok) {
          throw new Error("タスク取得に失敗しました");
        }
        const assignedData = (await assignedRes.json()) as TaskWithUsers[];
        const checkingData = (await checkingRes.json()) as TaskWithUsers[];
        setAssignedTasks(assignedData);
        setCheckingTasks(checkingData);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMemberTasks(selectedUserId);
    }
  }, [selectedUserId, fetchMemberTasks]);

  const handleStatusChange = async (taskId: number, status: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("更新に失敗しました");
    if (selectedUserId) fetchMemberTasks(selectedUserId);
  };

  const handleAssigneeChange = async (taskId: number, assigneeId: number) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId }),
    });
    if (!res.ok) throw new Error("担当者更新に失敗しました");
    if (selectedUserId) fetchMemberTasks(selectedUserId);
  };

  const handleCheckerChange = async (taskId: number, checkerId: number) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkerId }),
    });
    if (!res.ok) throw new Error("チェック担当更新に失敗しました");
    if (selectedUserId) fetchMemberTasks(selectedUserId);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="担当者別ビュー" description="メンバーごとのタスクとチェック状況を把握" />
      <section className="card p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-500">メンバーを選択</label>
          <select
            value={selectedUserId ?? ""}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
          >
            <option value="">選択してください</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </div>
        {currentUser && (
          <p className="text-sm text-slate-500">
            {currentUser.name} さんの担当タスクとチェック対応状況
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskColumn
          title="担当タスク（未完了）"
          tasks={assignedTasks}
          loading={loading}
          users={users}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onCheckerChange={handleCheckerChange}
          type="assignee"
        />
        <TaskColumn
          title="チェック担当タスク"
          tasks={checkingTasks}
          loading={loading}
          users={users}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onCheckerChange={handleCheckerChange}
          type="checker"
        />
      </div>
    </div>
  );
}

type ColumnProps = {
  title: string;
  tasks: TaskWithUsers[];
  loading: boolean;
  users: { id: number; name: string }[];
  onStatusChange: (taskId: number, status: string) => Promise<void>;
  onAssigneeChange: (taskId: number, assigneeId: number) => Promise<void>;
  onCheckerChange: (taskId: number, checkerId: number) => Promise<void>;
  type: "assignee" | "checker";
};

function TaskColumn({
  title,
  tasks,
  loading,
  users,
  onStatusChange,
  onAssigneeChange,
  onCheckerChange,
  type,
}: ColumnProps) {
  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{tasks.length}件</span>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-500">現在タスクはありません。</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">締め切り: {formatDate(task.dueDate)}</p>
                </div>
                <StatusBadge value={task.status} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">ステータス更新</label>
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value)}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">チェック担当</label>
                  <select
                    value={task.checkerId}
                    onChange={(e) => onCheckerChange(task.id, Number(e.target.value))}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">担当者</label>
                  <select
                    value={task.assigneeId}
                    onChange={(e) => onAssigneeChange(task.id, Number(e.target.value))}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                {type === "checker" && (
                  <p className="text-xs text-slate-500">担当: {task.assignee.name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

