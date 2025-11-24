"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Loader2, Plus } from "lucide-react";
import type { TaskWithUsers } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useUsers } from "@/hooks/useUsers";
import { TASK_SORT_OPTIONS, TASK_STATUSES, TASK_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { taskFormToPayload } from "@/lib/taskPayload";
import type { TaskFormValues } from "@/types/forms";

type Filters = {
  assigneeId: string;
  checkerId: string;
  status: string;
  type: string;
  startFrom: string;
  dueDate: string;
  sort: string;
};

const initialFilters: Filters = {
  assigneeId: "",
  checkerId: "",
  status: "",
  type: "",
  startFrom: "",
  dueDate: "",
  sort: "dueDateAsc",
};

export default function TasksView() {
  const { users, loading: usersLoading } = useUsers();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [tasks, setTasks] = useState<TaskWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
    if (filters.checkerId) params.set("checkerId", filters.checkerId);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.startFrom) params.set("startFrom", filters.startFrom);
    if (filters.dueDate) params.set("dueDate", filters.dueDate);
    if (filters.sort) params.set("sort", filters.sort);
    return params.toString();
  }, [filters]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = queryString ? `/api/tasks?${queryString}` : "/api/tasks";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("タスク取得に失敗しました");
      const data = (await res.json()) as TaskWithUsers[];
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    const payload = taskFormToPayload(values);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const message = (await res.json().catch(() => ({}))).message ?? "作成に失敗しました";
      throw new Error(message);
    }
    setShowCreate(false);
    await fetchTasks();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="タスク一覧"
        description="フィルタとソートでタスクを整理"
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            新規タスク
          </button>
        }
      />

      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={16} />
          <span>フィルタ</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">担当者</label>
            <select name="assigneeId" value={filters.assigneeId} onChange={handleFilterChange}>
              <option value="">すべて</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">チェック担当</label>
            <select name="checkerId" value={filters.checkerId} onChange={handleFilterChange}>
              <option value="">すべて</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">ステータス</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">すべて</option>
              {TASK_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">種別</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">すべて</option>
              {TASK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">スタート日</label>
            <input
              type="date"
              name="startFrom"
              value={filters.startFrom}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">締め切り日</label>
            <input
              type="date"
              name="dueDate"
              value={filters.dueDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select name="sort" value={filters.sort} onChange={handleFilterChange} className="w-full md:w-auto">
            {TASK_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500"
          >
            条件をリセット
          </button>
          <div className="text-xs text-slate-400">自動で再検索されます</div>
        </div>
      </section>

      <section className="card p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            読み込み中...
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-500">条件に一致するタスクがありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-3">タスク名</th>
                  <th className="pb-3">担当</th>
                  <th className="pb-3">チェック</th>
                  <th className="pb-3">ステータス</th>
                  <th className="pb-3">種別</th>
                  <th className="pb-3">締め切り</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <td className="py-3">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                    </td>
                    <td className="py-3 text-slate-600">{task.assignee.name}</td>
                    <td className="py-3 text-slate-600">{task.checker.name}</td>
                    <td className="py-3">
                      <StatusBadge value={task.status} />
                    </td>
                    <td className="py-3 text-slate-600">
                      {TASK_TYPES.find((type) => type.value === task.type)?.label ?? task.type}
                    </td>
                    <td className="py-3 text-slate-600">{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-40 flex">
          <div className="hidden flex-1 bg-black/30 md:block" onClick={() => setShowCreate(false)} />
          <div className="w-full max-w-xl bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase">新規タスク</p>
                <h3 className="text-lg font-semibold text-slate-900">タスク作成</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                閉じる
              </button>
            </div>
            {usersLoading ? (
              <p className="text-sm text-slate-500">ユーザー読み込み中...</p>
            ) : (
              <TaskForm
                users={users}
                onSubmit={handleCreateTask}
                onCancel={() => setShowCreate(false)}
                submitLabel="作成する"
              />
            )}
          </div>
        </div>
      )}

      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        users={users}
        onUpdated={fetchTasks}
      />
    </div>
  );
}

