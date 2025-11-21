export const TASK_STATUSES = [
  { value: "not_started", label: "未着手", color: "bg-slate-200 text-slate-700" },
  { value: "in_progress", label: "進行中", color: "bg-blue-100 text-blue-700" },
  { value: "check_request", label: "チェック依頼", color: "bg-amber-100 text-amber-700" },
  { value: "done", label: "完了", color: "bg-emerald-100 text-emerald-700" },
  { value: "on_hold", label: "保留", color: "bg-purple-100 text-purple-700" },
];

export const TASK_TYPES = [
  { value: "new_article", label: "新規記事" },
  { value: "rewrite", label: "リライト" },
  { value: "other", label: "その他" },
];

export const TASK_SORT_OPTIONS = [
  { value: "dueDateAsc", label: "締め切りが早い順" },
  { value: "startDateAsc", label: "開始日が早い順" },
  { value: "createdAtDesc", label: "作成が新しい順" },
];

export const STATUS_MAP = TASK_STATUSES.reduce<Record<string, typeof TASK_STATUSES[number]>>(
  (acc, status) => {
    acc[status.value] = status;
    return acc;
  },
  {}
);

