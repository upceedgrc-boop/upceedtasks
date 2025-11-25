import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Vercel の serverless 環境でも動作するように、グローバルスコープで Prisma クライアントをシングルトン化
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// 開発環境ではグローバルに保存してホットリロード時の重複インスタンス化を防ぐ
// 本番環境（Vercel）では各リクエストごとに新しいインスタンスが作られる可能性があるが、
// Prisma Client は内部的に接続プールを管理するため問題ない
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

