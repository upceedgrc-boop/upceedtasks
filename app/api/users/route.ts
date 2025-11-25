import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma は Edge Runtime では動かないため、Node.js runtime を明示的に指定
export const runtime = "nodejs";
// 動的ルートとして扱い、静的最適化を無効化
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 環境変数のチェック
    if (!process.env.DATABASE_URL) {
      console.error("[GET /api/users] DATABASE_URL is not set");
      return NextResponse.json(
        {
          message: "データベース接続設定がありません",
          error: "DATABASE_URL environment variable is not set",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    console.log(`[GET /api/users] Starting query (includeInactive: ${includeInactive})`);
    
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

    console.log(`[GET /api/users] Found ${users.length} users`);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET /api/users] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[GET /api/users] Error details:", {
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

