import { NextRequest, NextResponse } from "next/server";
import { startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";

// Prisma は Edge Runtime では動かないため、Node.js runtime を明示的に指定
export const runtime = "nodejs";
// 動的ルートとして扱い、静的最適化を無効化
export const dynamic = "force-dynamic";

const BUSINESS_START_HOUR = 9;

const parseDateOnly = (value?: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toStartOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const combineDateAndTime = (date: Date, time: string) => {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr ?? 0);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  const result = new Date(date);
  if (hour === 24 && minute === 0) {
    result.setDate(result.getDate() + 1);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  result.setHours(hour, minute, 0, 0);
  return result;
};

const validateBusinessHours = (start: Date, end: Date, baseDate: Date) => {
  if (start >= end) {
    return "終了時刻は開始時刻より後にしてください";
  }
  const earliest = new Date(baseDate);
  earliest.setHours(BUSINESS_START_HOUR, 0, 0, 0);
  if (start < earliest) {
    return "開始時刻は09:00以降で入力してください";
  }
  const latest = new Date(baseDate);
  latest.setDate(latest.getDate() + 1);
  latest.setHours(0, 0, 0, 0);
  if (end > latest) {
    return "終了時刻は24:00までにしてください";
  }
  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");
  const dateParam = searchParams.get("date");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // 1ヶ月表示用: from/to パラメータがある場合
  if (fromParam || toParam) {
    const from = fromParam ? parseDateOnly(fromParam) : null;
    const to = toParam ? parseDateOnly(toParam) : null;

    if (!from || !to) {
      return NextResponse.json(
        { message: "from と to の両方を指定してください" },
        { status: 400 }
      );
    }

    const start = toStartOfDay(from);
    const end = new Date(to);
    end.setDate(end.getDate() + 1); // to の日を含めるため +1日

    const shifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      include: { user: true },
      orderBy: [{ user: { name: "asc" } }, { date: "asc" }],
    });

    return NextResponse.json(shifts);
  }

  // 週表示用: weekStart パラメータがある場合
  if (weekStartParam) {
    const parsedWeekStart = parseDateOnly(weekStartParam) ?? new Date();
    const start = toStartOfDay(startOfWeek(parsedWeekStart, { weekStartsOn: 1 }));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const weeklyShifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      include: { user: true },
      orderBy: [{ user: { name: "asc" } }, { date: "asc" }],
    });

    return NextResponse.json(weeklyShifts);
  }

  // 1日表示用: date パラメータがある場合
  const parsedDate = parseDateOnly(dateParam ?? undefined) ?? new Date();
  const dayStart = toStartOfDay(parsedDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    include: { user: true },
      orderBy: [{ user: { name: "asc" } }, { date: "asc" }],
  });

  return NextResponse.json(shifts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baseDate = parseDateOnly(body.date);
    if (!baseDate) {
      return NextResponse.json({ message: "日付を正しく入力してください" }, { status: 400 });
    }
    if (!body.userId) {
      return NextResponse.json({ message: "メンバーを選択してください" }, { status: 400 });
    }
    if (!body.startTime || !body.endTime) {
      return NextResponse.json({ message: "開始・終了時刻を入力してください" }, { status: 400 });
    }

    const startTime = combineDateAndTime(baseDate, body.startTime);
    const endTime = combineDateAndTime(baseDate, body.endTime);
    if (!startTime || !endTime) {
      return NextResponse.json({ message: "時刻の形式が正しくありません" }, { status: 400 });
    }
    const validationError = validateBusinessHours(startTime, endTime, baseDate);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        userId: Number(body.userId),
        date: baseDate,
        startTime,
        endTime,
        memo: body.memo ?? null,
        isWorking: body.isWorking ?? true,
      },
      include: { user: true },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "シフト登録に失敗しました" }, { status: 400 });
  }
}
