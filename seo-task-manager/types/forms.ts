export type TaskFormValues = {
  title: string;
  description: string;
  status: string;
  type: string;
  assigneeId: number | "";
  authorId: number | "";
  checkerId: number | "";
  startDate: string;
  dueDate: string;
  feedbackDate1: string;
  feedbackDate2: string;
  publishedAt: string;
  articleUrl: string;
  articleSlug: string;
};

export const taskFormDefaultValues: TaskFormValues = {
  title: "",
  description: "",
  status: "not_started",
  type: "new_article",
  assigneeId: "",
  authorId: "",
  checkerId: "",
  startDate: "",
  dueDate: "",
  feedbackDate1: "",
  feedbackDate2: "",
  publishedAt: "",
  articleUrl: "",
  articleSlug: "",
};

