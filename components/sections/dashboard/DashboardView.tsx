"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import type { TaskWithUsers, ShiftWithUser } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTimeRange, todayInputValue } from "@/lib/date";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { useUsers } from "@/hooks/useUsers";

export default function DashboardView() {
  const today = useMemo(() => todayInputValue(), []);
  const { users } = useUsers();
  const [tasks, setTasks] = useState<TaskWithUsers[]>([]);
  const [shifts, setShifts] = useState<ShiftWithUser[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setTaskLoading(true);
      const res = await fetch("/api/tasks?isToday=true");
      if (!res.ok) throw new Error("タスク取得に失敗しました");
      const data = (await res.json()) as TaskWithUsers[];
      setTasks(data);
    } finally {
      setTaskLoading(false);
    }
  }, []);

  const fetchShifts = useCallback(async () => {
    try {
      setShiftLoading(true);
      const res = await fetch(`/api/shifts?date=${today}`);
      if (!res.ok) throw new Error("シフト取得に失敗しました");
      const data = (await res.json()) as ShiftWithUser[];
      setShifts(data.filter((shift) => shift.isWorking));
    } finally {
      setShiftLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTasks();
    fetchShifts();
  }, [fetchShifts, fetchTasks]);

  return (
    <div className="space-y-8">
      <PageHeader title="ダッシュボード" description="今日の出勤状況と進行中タスクを確認" />

      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Users size={18} />
          <span>本日出勤のメンバー</span>
        </div>
        {shiftLoading && <p className="text-sm text-slate-500">読み込み中...</p>}
        {!shiftLoading && shifts.length === 0 && (
          <p className="text-sm text-slate-500">本日のシフト登録はありません。</p>
        )}
        <div className="flex flex-wrap gap-2">
          {shifts.map((shift) => (
            <span
              key={shift.id}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs md:text-sm text-slate-700"
            >
              <span className="font-medium">{shift.user.name}</span>
              <span className="ml-1 text-slate-500">
                {formatTimeRange(shift.startTime, shift.endTime)}
              </span>
              {shift.memo && <span className="ml-1 text-slate-400">{shift.memo}</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">本日やるタスク</h2>
            <p className="text-sm text-slate-500">スタート日が今日まで & 未完了のタスク</p>
          </div>
          <button
            type="button"
            onClick={fetchTasks}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            再読み込み
          </button>
        </div>
        {taskLoading && <p className="mt-4 text-sm text-slate-500">読み込み中...</p>}
        {!taskLoading && tasks.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">該当するタスクはありません。</p>
        )}
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="w-full rounded-2xl border border-slate-100 p-4 text-left transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-slate-900">{task.title}</p>
                  <p className="text-sm text-slate-500">
                    担当: {task.assignee.name} / チェック: {task.checker.name}
                  </p>
                </div>
                <StatusBadge value={task.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>開始日: {formatDate(task.startDate)}</span>
                <span>締め切り: {formatDate(task.dueDate)}</span>
                <span>作成者: {task.author.name}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        users={users}
        onUpdated={fetchTasks}
      />
    </div>
  );
}

