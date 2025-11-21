import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SEOメディア事業部タスク管理",
  description: "Notion風のUIでSEOチームのタスクを管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSans.className} bg-brand-bg`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen bg-brand-bg px-4 py-6 md:px-10">
            <div className="mx-auto max-w-6xl space-y-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

