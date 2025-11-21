import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const start = date ? new Date(date) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      user: true,
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(shifts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shift = await prisma.shift.upsert({
      where: {
        userId_date: {
          userId: Number(body.userId),
          date: new Date(body.date),
        },
      },
      update: {
        isWorking: body.isWorking,
        memo: body.memo,
      },
      create: {
        userId: Number(body.userId),
        date: new Date(body.date),
        isWorking: body.isWorking ?? true,
        memo: body.memo,
      },
    });
    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "シフト登録に失敗しました" }, { status: 400 });
  }
}

