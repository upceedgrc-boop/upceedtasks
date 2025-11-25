"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@prisma/client";
import { TASK_STATUSES, TASK_TYPES } from "@/lib/constants";
import { toDateInputValue } from "@/lib/date";
import { taskFormDefaultValues, type TaskFormValues } from "@/types/forms";

type Props = {
  initialValues?: Partial<TaskFormValues>;
  users: User[];
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function TaskForm({ initialValues, users, onSubmit, onCancel, submitLabel }: Props) {
  const [values, setValues] = useState<TaskFormValues>(() => ({
    ...taskFormDefaultValues,
    ...initialValues,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = submitting;

  const userOptions = useMemo(() => {
    return [...users]
      .filter((user) => user.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [users]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value, type } = target;
    if (target instanceof HTMLInputElement && type === "checkbox") {
      setValues((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }
    setValues((prev) => ({
      ...prev,
      [name]:
        name === "assigneeId" || name === "authorId" || name === "checkerId"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  useEffect(() => {
    if (!initialValues) return;
    setValues((prev) => ({
      ...prev,
      ...initialValues,
      assigneeId: initialValues.assigneeId !== undefined && initialValues.assigneeId !== null
        ? typeof initialValues.assigneeId === "number"
          ? initialValues.assigneeId
          : Number(initialValues.assigneeId) || ""
        : "",
      authorId: initialValues.authorId !== undefined && initialValues.authorId !== null
        ? typeof initialValues.authorId === "number"
          ? initialValues.authorId
          : Number(initialValues.authorId) || ""
        : "",
      checkerId: initialValues.checkerId !== undefined && initialValues.checkerId !== null
        ? typeof initialValues.checkerId === "number"
          ? initialValues.checkerId
          : Number(initialValues.checkerId) || ""
        : "",
    }));
  }, [initialValues]);

  const validate = () => {
    if (!values.title.trim()) return "タスク名は必須です";
    if (values.assigneeId === "") return "担当者を選択してください";
    if (values.authorId === "") return "タスク作成者を選択してください";
    if (values.checkerId === "") return "チェック担当を選択してください";
    if (!values.dueDate) return "締め切り日は必須です";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    try {
      setSubmitting(true);
      await onSubmit({
        ...values,
        startDate: toDateInputValue(values.startDate) || values.startDate,
        publishedAt: toDateInputValue(values.publishedAt) || values.publishedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存時にエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600">タスク名 *</label>
          <input
            name="title"
            value={values.title}
            onChange={handleChange}
            disabled={disabled}
            placeholder="例: 11月A案件の記事執筆"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">タスク内容</label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            disabled={disabled}
            rows={4}
            placeholder="概要や具体的な要件を記載..."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">ステータス *</label>
          <select name="status" value={values.status} onChange={handleChange} disabled={disabled}>
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">種別</label>
          <select name="type" value={values.type} onChange={handleChange} disabled={disabled}>
            {TASK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-600">担当者 *</label>
          <select
            name="assigneeId"
            value={values.assigneeId === "" ? "" : String(values.assigneeId)}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="">選択してください</option>
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">タスク作成者 *</label>
          <select
            name="authorId"
            value={values.authorId === "" ? "" : String(values.authorId)}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="">選択してください</option>
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">チェック担当 *</label>
          <select
            name="checkerId"
            value={values.checkerId === "" ? "" : String(values.checkerId)}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="">選択してください</option>
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">スタート日</label>
          <input
            type="date"
            name="startDate"
            value={values.startDate}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">締め切り日 *</label>
          <input
            type="date"
            name="dueDate"
            value={values.dueDate}
            onChange={handleChange}
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">フィードバック予定日</label>
          <input
            type="date"
            name="feedbackDate1"
            value={values.feedbackDate1}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">FBのFB予定日</label>
          <input
            type="date"
            name="feedbackDate2"
            value={values.feedbackDate2}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="border border-slate-100 rounded-2xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">記事情報</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600">公開日</label>
            <input
              type="date"
              name="publishedAt"
              value={values.publishedAt}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">記事URL</label>
            <input
              name="articleUrl"
              value={values.articleUrl}
              onChange={handleChange}
              disabled={disabled}
              placeholder="https://example.com/article..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">記事スラッグ／キーワード</label>
            <input
              name="articleSlug"
              value={values.articleSlug}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            disabled={disabled}
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {submitting ? "保存中..." : submitLabel ?? "保存する"}
        </button>
      </div>
    </form>
  );
}

