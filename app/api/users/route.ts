import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma は Edge Runtime では動かないため、Node.js runtime を明示的に指定
export const runtime = "nodejs";
// 動的ルートとして扱い、静的最適化を無効化
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const users = await prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[GET /api/users] Found ${users.length} users (includeInactive: ${includeInactive})`);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET /api/users] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[GET /api/users] Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        message: "ユーザー取得に失敗しました", 
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await prisma.user.create({
      data: {
        name: body.name,
        role: body.role ?? "writer",
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        message: "ユーザー作成に失敗しました",
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}

