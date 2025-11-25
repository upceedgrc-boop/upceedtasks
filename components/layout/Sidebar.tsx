"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  Layers,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: Layers },
  { href: "/tasks", label: "タスク一覧", icon: ClipboardList },
  { href: "/members", label: "担当者別", icon: CheckSquare },
  { href: "/published", label: "公開記事", icon: FileText },
  { href: "/logs", label: "作業ログ", icon: CalendarDays },
  { href: "/shifts", label: "シフト", icon: CalendarClock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 border-r border-slate-200 bg-white px-4 py-6 hidden md:flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">SEOメディア事業部</p>
        <h1 className="text-2xl font-semibold text-slate-900">タスク管理</h1>
      </div>
      <nav className="flex-1">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="text-xs text-slate-400">
        <p>NotionライクなUIでSEOチームの進行を可視化</p>
      </div>
    </aside>
  );
}

