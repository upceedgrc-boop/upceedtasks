import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const PUBLISHABLE_TYPES = new Set(["new_article", "rewrite"]);

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolvePublishState = (
  type: string,
  status: string,
  publishedAtInput?: string | Date | null,
  fallback?: Date | null
) => {
  const shouldPublish = PUBLISHABLE_TYPES.has(type) && status === "done";
  if (!shouldPublish) {
    return { isPublished: false, publishedAt: null };
  }
  if (!publishedAtInput && fallback) {
    return { isPublished: true, publishedAt: fallback };
  }
  if (!publishedAtInput) {
    return { isPublished: true, publishedAt: new Date() };
  }
  const parsed =
    typeof publishedAtInput === "string"
      ? parseDate(publishedAtInput) ?? undefined
      : publishedAtInput ?? undefined;
  return { isPublished: true, publishedAt: parsed ?? new Date() };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: {
      assignee: true,
      author: true,
      checker: true,
      workLogs: {
        orderBy: { workDate: "desc" },
        include: { user: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ message: "タスクが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const taskId = Number(id);
    const current = await prisma.task.findUnique({ where: { id: taskId } });
    if (!current) {
      return NextResponse.json({ message: "タスクが見つかりません" }, { status: 404 });
    }

    const nextStatus: string = "status" in body ? body.status : current.status;
    const nextType: string = "type" in body ? body.type : current.type;
    const publishState = resolvePublishState(
      nextType,
      nextStatus,
      body.publishedAt,
      current.publishedAt
    );
    const data: Prisma.TaskUpdateInput = {};

    if ("title" in body) data.title = body.title;
    if ("description" in body) data.description = body.description ?? "";
    if ("status" in body) data.status = body.status;
    if ("type" in body) data.type = body.type;
    if ("startDate" in body) data.startDate = parseDate(body.startDate);
    if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
    if ("feedbackDate1" in body) data.feedbackDate1 = parseDate(body.feedbackDate1);
    if ("feedbackDate2" in body) data.feedbackDate2 = parseDate(body.feedbackDate2);
    if ("articleUrl" in body) data.articleUrl = body.articleUrl || null;
    if ("articleSlug" in body) data.articleSlug = body.articleSlug || null;
    if ("assigneeId" in body && body.assigneeId)
      data.assignee = { connect: { id: Number(body.assigneeId) } };
    if ("checkerId" in body && body.checkerId)
      data.checker = { connect: { id: Number(body.checkerId) } };
    if ("authorId" in body && body.authorId)
      data.author = { connect: { id: Number(body.authorId) } };

    data.isPublished = publishState.isPublished;
    data.publishedAt = publishState.publishedAt;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: true,
        author: true,
        checker: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "タスク更新に失敗しました" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "削除に失敗しました" }, { status: 400 });
  }
}

