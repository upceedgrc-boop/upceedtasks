import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Prisma は Edge Runtime では動かないため、Node.js runtime を明示的に指定
export const runtime = "nodejs";
// 動的ルートとして扱い、静的最適化を無効化
export const dynamic = "force-dynamic";

const parseNumber = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseDate = (value: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toNullableDate = (value?: string | null) => {
  const parsed = parseDate(value ?? null);
  return parsed ?? null;
};

const PUBLISHABLE_TYPES = new Set(["new_article", "rewrite"]);

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

export async function GET(request: Request) {
  try {
    // 環境変数のチェック
    if (!process.env.DATABASE_URL) {
      console.error("[GET /api/tasks] DATABASE_URL is not set");
      return NextResponse.json(
        {
          message: "データベース接続設定がありません",
          error: "DATABASE_URL environment variable is not set",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const where: Prisma.TaskWhereInput = {};

    const assigneeId = parseNumber(searchParams.get("assigneeId"));
    if (assigneeId) where.assigneeId = assigneeId;

    const checkerId = parseNumber(searchParams.get("checkerId"));
    if (checkerId) where.checkerId = checkerId;

    const status = searchParams.get("status");
    if (status) where.status = status;

    const type = searchParams.get("type");
    if (type) where.type = type;

    const isPublished = searchParams.get("isPublished");
    if (isPublished === "true") where.isPublished = true;
    if (isPublished === "false") where.isPublished = false;

    const publishedMonth = searchParams.get("publishedMonth");
    if (publishedMonth) {
      const [year, month] = publishedMonth.split("-").map(Number);
      if (year && month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        where.publishedAt = { gte: start, lt: end };
      }
    }

    const startFrom = parseDate(searchParams.get("startFrom"));
    if (startFrom) {
      const existing =
        where.startDate && typeof where.startDate === "object" ? where.startDate : {};
      where.startDate = { ...existing, gte: startFrom };
    }

    const startBefore = parseDate(searchParams.get("startBefore"));
    if (startBefore) {
      const existing =
          where.startDate && typeof where.startDate === "object" ? where.startDate : {};
      where.startDate = { ...existing, lte: startBefore };
    }

    const dueDate = parseDate(searchParams.get("dueDate"));
    if (dueDate) {
      const existing =
        where.dueDate && typeof where.dueDate === "object" ? where.dueDate : {};
      where.dueDate = { ...existing, lte: dueDate };
    }

    const excludeDone = searchParams.get("excludeDone");
    if (excludeDone === "true") {
      where.status = { not: "done" };
    }

    const todayOnly = searchParams.get("isToday");
    if (todayOnly === "true") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.AND = [
        { OR: [{ startDate: null }, { startDate: { lte: today } }] },
        { status: { not: "done" } },
      ];
    }

    let orderBy: Prisma.TaskOrderByWithRelationInput = { dueDate: "asc" };
    const sort = searchParams.get("sort");
    if (sort === "startDateAsc") {
      orderBy = { startDate: "asc" };
    } else if (sort === "createdAtDesc") {
      orderBy = { createdAt: "desc" };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      include: {
        assignee: true,
        author: true,
        checker: true,
      },
    });

    console.log(`[GET /api/tasks] Found ${tasks.length} tasks`);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[GET /api/tasks] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[GET /api/tasks] Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code,
    });

    // Prisma の接続エラーの場合、より詳細な情報を返す
    if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database server")) {
      return NextResponse.json(
        {
          message: "データベースサーバーに接続できません",
          error: "Database connection failed. Please check DATABASE_URL and Supabase connection.",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    if (errorMessage.includes("P1000") || errorMessage.includes("Authentication failed")) {
      return NextResponse.json(
        {
          message: "データベース認証に失敗しました",
          error: "Database authentication failed. Please check DATABASE_URL credentials.",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "タスク取得に失敗しました",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const statusValue: string = body.status ?? "not_started";
    const typeValue: string = body.type ?? "new_article";

    if (!body.assigneeId || !body.authorId || !body.checkerId) {
      return NextResponse.json(
        { message: "担当者、タスク作成者、チェック担当は必須です" },
        { status: 400 }
      );
    }

    const assigneeId = Number(body.assigneeId);
    const authorId = Number(body.authorId);
    const checkerId = Number(body.checkerId);

    if (Number.isNaN(assigneeId) || Number.isNaN(authorId) || Number.isNaN(checkerId)) {
      return NextResponse.json(
        { message: "担当者、タスク作成者、チェック担当のIDが無効です" },
        { status: 400 }
      );
    }

    const publishState = resolvePublishState(typeValue, statusValue, body.publishedAt);

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? "",
        status: statusValue,
        type: typeValue,
        startDate: toNullableDate(body.startDate),
        dueDate: new Date(body.dueDate),
        feedbackDate1: toNullableDate(body.feedbackDate1),
        feedbackDate2: toNullableDate(body.feedbackDate2),
        isPublished: publishState.isPublished,
        publishedAt: publishState.publishedAt,
        articleUrl: body.articleUrl || null,
        articleSlug: body.articleSlug || null,
        assigneeId,
        authorId,
        checkerId,
      },
      include: {
        assignee: true,
        author: true,
        checker: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        message: "タスクの作成に失敗しました",
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}

