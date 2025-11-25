"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import type { ShiftWithUser } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUsers } from "@/hooks/useUsers";
import { formatTimeRange, startOfWeekInputValue, todayInputValue } from "@/lib/date";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type ShiftFormValues = {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  memo: string;
};

type ViewMode = "week" | "month";

const dateKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return format(normalized, "yyyy-MM-dd");
};

export default function ShiftsView() {
  const { users, loading: usersLoading } = useUsers();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthStart, setMonthStart] = useState(todayInputValue());
  const [weekStart, setWeekStart] = useState(startOfWeekInputValue());
  const [shifts, setShifts] = useState<ShiftWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ShiftFormValues>({
    userId: "",
    date: todayInputValue(),
    startTime: "09:00",
    endTime: "12:00",
    memo: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const weekDays = useMemo(() => {
    const start = parseISO(weekStart);
    return Array.from({ length: 7 }).map((_, index) => {
      const current = addDays(start, index);
      return {
        date: current,
        key: format(current, "yyyy-MM-dd"),
        label: `${format(current, "M/d")} (${WEEKDAY_LABELS[current.getDay()]})`,
        isToday: format(current, "yyyy-MM-dd") === todayInputValue(),
      };
    });
  }, [weekStart]);

  const monthDays = useMemo(() => {
    const start = parseISO(monthStart);
    return Array.from({ length: 30 }).map((_, index) => {
      const current = addDays(start, index);
      return {
        date: current,
        key: format(current, "yyyy-MM-dd"),
        label: `${format(current, "M/d")} (${WEEKDAY_LABELS[current.getDay()]})`,
        isToday: format(current, "yyyy-MM-dd") === todayInputValue(),
      };
    });
  }, [monthStart]);

  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return "";
    const first = weekDays[0].date;
    const last = weekDays[weekDays.length - 1].date;
    return `${format(first, "yyyy/MM/dd")} - ${format(last, "MM/dd")}`;
  }, [weekDays]);

  const monthRangeLabel = useMemo(() => {
    if (monthDays.length === 0) return "";
    const first = monthDays[0].date;
    const last = monthDays[monthDays.length - 1].date;
    return `${format(first, "yyyy/MM/dd")} - ${format(last, "MM/dd")} (30日間)`;
  }, [monthDays]);

  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftWithUser[]>();
    shifts.forEach((shift) => {
      const key = `${shift.userId}-${dateKey(shift.date)}`;
      const list = map.get(key) ?? [];
      list.push(shift);
      list.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      map.set(key, list);
    });
    return map;
  }, [shifts]);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      let url = "";
      if (viewMode === "month") {
        const from = monthStart;
        const toDate = new Date(parseISO(monthStart));
        toDate.setDate(toDate.getDate() + 29); // 30日間
        const to = format(toDate, "yyyy-MM-dd");
        url = `/api/shifts?from=${from}&to=${to}`;
      } else {
        url = `/api/shifts?weekStart=${weekStart}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("シフトの取得に失敗しました");
      const data = (await res.json()) as ShiftWithUser[];
      setShifts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "シフトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [viewMode, monthStart, weekStart]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    if (viewMode === "week") {
      setFormValues((prev) => ({ ...prev, date: weekStart }));
    } else {
      setFormValues((prev) => ({ ...prev, date: monthStart }));
    }
  }, [viewMode, weekStart, monthStart]);

  const shiftWeek = (offset: number) => {
    const base = parseISO(weekStart);
    base.setDate(base.getDate() + offset * 7);
    setWeekStart(format(base, "yyyy-MM-dd"));
  };

  const shiftMonth = (offset: number) => {
    const base = parseISO(monthStart);
    base.setDate(base.getDate() + offset * 30);
    setMonthStart(format(base, "yyyy-MM-dd"));
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.userId) {
      setFormError("メンバーを選択してください");
      return;
    }
    if (!formValues.startTime || !formValues.endTime) {
      setFormError("開始／終了時刻を入力してください");
      return;
    }
    setFormError(null);
    try {
      setSubmitting(true);
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(formValues.userId),
          date: formValues.date,
          startTime: formValues.startTime,
          endTime: formValues.endTime,
          memo: formValues.memo || undefined,
        }),
      });
      if (!res.ok) {
        const message = (await res.json().catch(() => ({}))).message ?? "登録に失敗しました";
        throw new Error(message);
      }
      setFormValues((prev) => ({
        ...prev,
        startTime: "09:00",
        endTime: "12:00",
        memo: "",
      }));
      await fetchShifts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm("このシフトを削除しますか？");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/shifts/${shiftId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "シフト削除に失敗しました");
    }
  };

  const displayDays = viewMode === "month" ? monthDays : weekDays;
  const rangeLabel = viewMode === "month" ? monthRangeLabel : weekRangeLabel;

  return (
    <div className="space-y-8">
      <PageHeader
        title={viewMode === "month" ? "月間シフト表" : "週間シフト表"}
        description={
          viewMode === "month"
            ? "メンバーごとの出勤予定を1ヶ月先まで管理します"
            : "メンバーごとの出勤予定を週単位で管理します"
        }
      />

      <section className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "week"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                週表示
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "month"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                1ヶ月表示
              </button>
            </div>
            <p className="text-xs uppercase text-slate-400">
              {viewMode === "month" ? "表示中の期間" : "表示中の週"}
            </p>
            <p className="text-lg font-semibold text-slate-900">{rangeLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === "week" ? (
              <>
                <button
                  type="button"
                  onClick={() => shiftWeek(-1)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ◀ 前の週
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(startOfWeekInputValue())}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <RotateCcw size={14} />
                  今週
                </button>
                <button
                  type="button"
                  onClick={() => shiftWeek(1)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  次の週 ▶
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ◀ 前の30日
                </button>
                <button
                  type="button"
                  onClick={() => setMonthStart(todayInputValue())}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <RotateCcw size={14} />
                  今日から
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  次の30日 ▶
                </button>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={16} />
              読み込み中...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 text-slate-600 sticky left-0 bg-white z-10">メンバー</th>
                    {displayDays.map((day) => (
                      <th
                        key={day.key}
                        className={`pb-3 px-2 text-slate-600 min-w-[80px] ${
                          day.isToday ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{day.label}</span>
                          {day.isToday && (
                            <span className="text-[10px] text-blue-600 font-normal">今日</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={displayDays.length + 1} className="py-6 text-center text-sm text-slate-500">
                        ユーザーを読み込み中です...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={displayDays.length + 1} className="py-6 text-center text-sm text-slate-500">
                        メンバーが登録されていません。
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="py-3 pr-4 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">
                          {user.name}
                        </td>
                        {displayDays.map((day) => {
                          const key = `${user.id}-${day.key}`;
                          const cellShifts = shiftMap.get(key) ?? [];
                          return (
                            <td
                              key={day.key}
                              className={`py-3 px-2 align-top min-w-[80px] ${
                                day.isToday ? "bg-blue-50" : ""
                              }`}
                            >
                              {cellShifts.length === 0 ? (
                                <span className="text-xs text-slate-400">-</span>
                              ) : (
                                <div className="space-y-1">
                                  {cellShifts.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-700 flex items-center justify-between gap-2"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                          {formatTimeRange(shift.startTime, shift.endTime)}
                                        </p>
                                        {shift.memo && (
                                          <p className="text-[11px] text-slate-400 truncate">{shift.memo}</p>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteShift(shift.id)}
                                        className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                                        aria-label="シフト削除"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">シフトを登録</h2>
          <p className="text-sm text-slate-500">
            表示中の期間に対して、任意のメンバーのシフトを追加できます
          </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">メンバー</label>
            <select
              name="userId"
              value={formValues.userId}
              onChange={handleFormChange}
              className="mt-1"
            >
              <option value="">選択してください</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">日付</label>
            <select name="date" value={formValues.date} onChange={handleFormChange} className="mt-1">
              {displayDays.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">開始時刻</label>
            <input
              type="time"
              name="startTime"
              min="09:00"
              max="23:59"
              value={formValues.startTime}
              onChange={handleFormChange}
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">終了時刻</label>
            <input
              type="time"
              name="endTime"
              min={formValues.startTime}
              max="23:59"
              value={formValues.endTime}
              onChange={handleFormChange}
              className="mt-1"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">メモ（任意）</label>
            <input
              name="memo"
              value={formValues.memo}
              onChange={handleFormChange}
              placeholder="リモート／タスク名など"
              className="mt-1"
            />
          </div>
          {formError && (
            <p className="md:col-span-2 text-sm text-rose-600">{formError}</p>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
            >
              {submitting ? "登録中..." : "シフトを追加"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


