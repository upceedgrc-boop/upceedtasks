import type { TaskFormValues } from "@/types/forms";

export const taskFormToPayload = (values: TaskFormValues) => ({
  title: values.title,
  description: values.description,
  status: values.status,
  type: values.type,
  startDate: values.startDate || null,
  dueDate: values.dueDate,
  feedbackDate1: values.feedbackDate1 || null,
  feedbackDate2: values.feedbackDate2 || null,
  publishedAt: values.publishedAt || null,
  articleUrl: values.articleUrl || null,
  articleSlug: values.articleSlug || null,
  assigneeId: values.assigneeId,
  authorId: values.authorId,
  checkerId: values.checkerId,
});

