"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@prisma/client";
import { X } from "lucide-react";
import { TaskForm } from "./TaskForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, todayInputValue, toDateInputValue } from "@/lib/date";
import { STATUS_MAP, TASK_STATUSES } from "@/lib/constants";
import type { TaskDetail } from "@/types";
import { taskFormToPayload } from "@/lib/taskPayload";
import type { TaskFormValues } from "@/types/forms";

type Props = {
  taskId: number | null;
  onClose: () => void;
  users: User[];
  onUpdated?: () => void;
};

export function TaskDetailPanel({ taskId, onClose, users, onUpdated }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logNote, setLogNote] = useState("");
  const [logStatus, setLogStatus] = useState("in_progress");
  const [logDate, setLogDate] = useState(todayInputValue());
  const [logSubmitting, setLogSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchTask(id: number) {
      try {
        setLoading(true);
        const res = await fetch(`/api/tasks/${id}`);
        if (!res.ok) throw new Error("タスク詳細の取得に失敗しました");
        const data = (await res.json()) as TaskDetail;
        if (active) {
          setTask(data);
          setLogStatus(data.status);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "取得に失敗しました");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (taskId) {
      fetchTask(taskId);
    } else {
      setTask(null);
    }
    return () => {
      active = false;
    };
  }, [taskId]);

  const refetchTask = async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("タスク再取得に失敗しました");
      const data = (await res.json()) as TaskDetail;
      setTask(data);
      setLogStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "タスク再取得エラー");
    }
  };

  const initialFormValues = useMemo<Partial<TaskFormValues> | undefined>(() => {
    if (!task) return undefined;
    return {
      title: task.title,
      description: task.description,
      status: task.status,
      type: task.type,
      assigneeId: task.assigneeId,
      authorId: task.authorId,
      checkerId: task.checkerId,
      startDate: toDateInputValue(task.startDate),
      dueDate: toDateInputValue(task.dueDate) ?? "",
      feedbackDate1: toDateInputValue(task.feedbackDate1),
      feedbackDate2: toDateInputValue(task.feedbackDate2),
      publishedAt: toDateInputValue(task.publishedAt),
      articleUrl: task.articleUrl ?? "",
      articleSlug: task.articleSlug ?? "",
    };
  }, [task]);

  const handleUpdate = async (values: TaskFormValues) => {
    if (!taskId) return;
    const payload = taskFormToPayload(values);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const message = (await res.json().catch(() => ({}))).message ?? "更新に失敗しました";
      throw new Error(message);
    }
    await refetchTask();
    onUpdated?.();
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    try {
      setLogSubmitting(true);
      const res = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          userId: task.assigneeId,
          workDate: logDate,
          statusSnapshot: logStatus,
          note: logNote,
        }),
      });
      if (!res.ok) throw new Error("作業ログの登録に失敗しました");
      setLogNote("");
      await refetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作業ログ登録に失敗しました");
    } finally {
      setLogSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 w-full max-w-xl transform bg-white shadow-2xl transition-transform duration-300 ${
        taskId ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-xs text-slate-400 uppercase">詳細パネル</p>
          <h2 className="text-lg font-semibold text-slate-900">
            {task ? task.title : "タスク詳細"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-slate-100 transition"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>
      <div className="h-[calc(100vh-72px)] overflow-y-auto px-6 py-6 space-y-6">
        {loading && <p className="text-sm text-slate-500">読み込み中...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {task && (
          <>
            <div className="space-y-2">
              <StatusBadge value={task.status} />
              <p className="text-sm text-slate-500">種別: {task.type}</p>
              <p className="text-sm text-slate-500">
                担当: {task.assignee.name} / チェック: {task.checker.name}
              </p>
              <p className="text-sm text-slate-500">
                締め切り: {formatDate(task.dueDate)} / 開始: {formatDate(task.startDate)}
              </p>
            </div>
            <div className="card p-4">
              {initialFormValues && (
                <TaskForm
                  initialValues={initialFormValues}
                  users={users}
                  onSubmit={handleUpdate}
                  submitLabel="更新する"
                />
              )}
            </div>
            <div className="card p-4 space-y-4">
              <h3 className="text-base font-semibold text-slate-900">作業ログ</h3>
              <form className="space-y-3" onSubmit={handleCreateLog}>
                <textarea
                  className="w-full"
                  rows={3}
                  placeholder="今日の作業内容を入力"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-500">ステータス</label>
                    <select value={logStatus} onChange={(e) => setLogStatus(e.target.value)}>
                      {TASK_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">作業日</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
                >
                  {logSubmitting ? "登録中..." : "ログを追加"}
                </button>
              </form>
              <div className="space-y-3">
                {task.workLogs.length === 0 && (
                  <p className="text-sm text-slate-500">まだログがありません。</p>
                )}
                {task.workLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{log.user.name}</span>
                      <span>{formatDate(log.workDate)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{log.note}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      ステータス: {STATUS_MAP[log.statusSnapshot]?.label ?? log.statusSnapshot}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

