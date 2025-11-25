import { PrismaClient } from "@prisma/client";

// 環境変数のチェック
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please set it in your .env file or Vercel environment variables."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Vercel の serverless 環境でも動作するように、グローバルスコープで Prisma クライアントをシングルトン化
// Vercel では各関数実行ごとに新しいコンテキストが作られるため、グローバルに保存しても問題ない
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// 開発環境と本番環境の両方でグローバルに保存して、重複インスタンス化を防ぐ
// Vercel の serverless 環境では、同じ Lambda コンテナ内で複数回実行される可能性があるため
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

