import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    console.log(`[API /users] Found ${users.length} users (includeInactive: ${includeInactive})`);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("[API /users] Error fetching users:", error);
    return NextResponse.json(
      { 
        message: "ユーザー取得に失敗しました", 
        error: error instanceof Error ? error.message : String(error) 
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
    console.error(error);
    return NextResponse.json({ message: "ユーザー作成に失敗しました" }, { status: 400 });
  }
}

