"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TaskWithUsers } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/date";

const tabs = [
  { value: "new_article", label: "新規記事" },
  { value: "rewrite", label: "リライト" },
];

export default function PublishedView() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activeTab, setActiveTab] = useState("new_article");
  const [tasks, setTasks] = useState<TaskWithUsers[]>([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      isPublished: "true",
      type: activeTab,
      publishedMonth: month,
    });
    return params.toString();
  }, [activeTab, month]);

  const fetchPublished = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?${query}`);
      if (!res.ok) throw new Error("公開済みタスクの取得に失敗しました");
      const data = (await res.json()) as TaskWithUsers[];
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  return (
    <div className="space-y-8">
      <PageHeader title="公開記事ビュー" description="公開済みの記事を月別に確認" />

      <section className="card p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">対象月</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="flex items-end gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  activeTab === tab.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600"
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        {loading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-500">この月の公開済み記事はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-3">公開日</th>
                  <th className="pb-3">タスク名</th>
                  <th className="pb-3">担当</th>
                  <th className="pb-3">チェック</th>
                  <th className="pb-3">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="py-3 text-slate-600">{formatDate(task.publishedAt)}</td>
                    <td className="py-3 text-slate-900 font-semibold">{task.title}</td>
                    <td className="py-3 text-slate-600">{task.assignee.name}</td>
                    <td className="py-3 text-slate-600">{task.checker.name}</td>
                    <td className="py-3 text-slate-600">
                      {task.articleUrl ? (
                        <a
                          href={task.articleUrl}
                          className="text-slate-900 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          リンク
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

