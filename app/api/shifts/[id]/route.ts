import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shiftId = Number(id);
    const body = await request.json();

    const existing = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!existing) {
      return NextResponse.json({ message: "シフトが見つかりません" }, { status: 404 });
    }

    const baseDate =
      ("date" in body && body.date ? parseDateOnly(body.date) : null) ??
      toStartOfDay(new Date(existing.date));
    if (!baseDate) {
      return NextResponse.json({ message: "日付を正しく入力してください" }, { status: 400 });
    }

    const startTime =
      "startTime" in body && body.startTime
        ? combineDateAndTime(baseDate, body.startTime)
        : new Date(existing.startTime);
    const endTime =
      "endTime" in body && body.endTime
        ? combineDateAndTime(baseDate, body.endTime)
        : new Date(existing.endTime);

    if (!startTime || !endTime) {
      return NextResponse.json({ message: "時刻の形式が正しくありません" }, { status: 400 });
    }

    const validationError = validateBusinessHours(startTime, endTime, baseDate);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const data: Prisma.ShiftUpdateInput = {
      date: baseDate,
      startTime,
      endTime,
    };

    if ("memo" in body) {
      data.memo = body.memo ?? null;
    }
    if ("isWorking" in body) {
      data.isWorking = Boolean(body.isWorking);
    }
    if ("userId" in body && body.userId) {
      data.user = { connect: { id: Number(body.userId) } };
    }

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data,
      include: { user: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "シフト更新に失敗しました" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shiftId = Number(id);
    await prisma.shift.delete({ where: { id: shiftId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "シフト削除に失敗しました" }, { status: 400 });
  }
}


