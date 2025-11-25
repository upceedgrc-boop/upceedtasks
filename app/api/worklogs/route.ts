import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma は Edge Runtime では動かないため、Node.js runtime を明示的に指定
export const runtime = "nodejs";
// 動的ルートとして扱い、静的最適化を無効化
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (date) {
    const target = new Date(date);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);
    where.workDate = { gte: target, lt: next };
  }
  if (userId) {
    where.userId = Number(userId);
  }

  const logs = await prisma.workLog.findMany({
    where,
    orderBy: { workDate: "desc" },
    include: {
      user: true,
      task: true,
    },
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workLog = await prisma.workLog.create({
      data: {
        workDate: body.workDate ? new Date(body.workDate) : new Date(),
        note: body.note,
        statusSnapshot: body.statusSnapshot,
        userId: Number(body.userId),
        taskId: Number(body.taskId),
      },
    });
    return NextResponse.json(workLog, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "作業ログの登録に失敗しました" }, { status: 400 });
  }
}

