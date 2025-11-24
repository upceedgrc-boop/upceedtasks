# SEOメディア事業部タスク管理

NotionライクなUIでSEOチームのタスクと作業ログを一元管理するNext.jsアプリです。Next.js (App Router) + Prisma + PostgreSQL（Supabase）構成で、ローカル開発からVercelなどへのデプロイまでを意識しています。

## 技術スタック

- Next.js 16 (App Router) + React 19 + TypeScript
- UI: Tailwind CSS, lucide-react
- データ: Prisma ORM + PostgreSQL (Supabase)
- API: `/app/api/*` のRoute HandlerでCRUDを提供

## セットアップ手順

```bash
git clone <this-repo>
cd seo-task-manager
cp env.example .env                      # Supabaseの接続文字列に書き換え
npm install
npx prisma migrate dev --name init_pg    # Supabase(PostgreSQL)にスキーマを適用
npx prisma db seed                       # メンバーの初期データ投入
npm run dev
```

`.env` には Supabase の `postgresql://...` 形式の `DATABASE_URL` を設定してください（例は `env.example` に記載）。ローカルで PostgreSQL を用意すれば同じ手順で動作します。

## 主要ページ

- `/` ダッシュボード  
  - 当日出勤者（Shift）と「今日やるタスク」をカードで表示。右側スライドパネルで詳細編集・作業ログ追加が可能。
- `/tasks` タスク一覧  
  - 担当者・チェック担当・ステータス・種別・締め切り範囲・ソートでフィルタリング。新規タスク作成ドロワーと詳細パネルを提供。
- `/members` 担当者別ビュー  
  - メンバーごとに担当タスク／チェック担当タスクを切り分け、ステータスや担当の付け替えを即時更新。
- `/published` 月次公開記事ビュー  
  - 月と種別（新規／リライト）で公開済みタスクを絞り込み、公開日・URL・担当情報を一覧表示。
- `/logs` 作業ログ  
  - 日付＆メンバーでWorkLogを検索し、日々の進捗を確認。

## データモデル

- **User**
  - `id`, `name`, `role ("writer" | "checker" | "admin" ...)`, `isActive`, timestamps
  - `npx prisma db seed` で下記18名が自動登録されます  
    大川 慎太郎 / 杉山 諒也 / 日向 祥太 / 川名 亜由美 / 北條 貴斗 / 北川 育実 / 八木 智輝 / 西川 結唯 / 荒島 未琴 / 丹羽 美月 / 小岩 歌姫 / 高橋 和哉 / 花沢 愛 / 樋口 雄大 / 橋本 優奈 / 権田 啓 / 丹野 涼大 / 柴田 岳人
- **Task**
  - 主要フィールド: `title`, `description`, `status`, `type ("new_article" | "rewrite" | "other")`, `startDate`, `dueDate`, `feedbackDate1/2`, `assigneeId`, `authorId`, `checkerId`
  - SEO向け拡張: `isPublished`, `publishedAt`, `articleUrl`, `articleSlug`
- **WorkLog**
  - `userId`, `taskId`, `workDate`, `note`, `statusSnapshot`
- **Shift**
  - `userId`, `date`, `isWorking`, `memo` (リモート／半休などをメモ可能)

Prismaスキーマは `prisma/schema.prisma` を参照してください。

## ステータス & 種別

### Task.status 候補

- `not_started`（未着手）
- `in_progress`（進行中）
- `check_request`（チェック依頼）
- `done`（完了）
- `on_hold`（保留）

UI上では色付きピル型バッジで区別しています。

### Task.type 候補

- `new_article` （新規記事）
- `rewrite` （リライト）
- `other` （その他施策）

新規記事・リライトのタスクが「完了」になると自動的に公開済み扱いとなり、公開記事ビュー（月別）に表示されます。公開日を指定しなかった場合は完了時刻が `publishedAt` に入ります。

## Vercel × Supabase デプロイ手順（完全無料構成）

1. **GitHubへPush**  
   本リポジトリを GitHub に公開（`git init` → `git remote add` → `git push origin main`）。
2. **SupabaseでPostgreSQL作成**  
   https://supabase.com → New Project → Connection string で `postgresql://...` を取得。
3. **Prisma設定**  
   - `prisma/schema.prisma` の provider は `postgresql` に設定済み。  
   - `.env`/`DATABASE_URL` に Supabase の接続文字列を貼り付け。  
   - `npx prisma migrate dev` → `npx prisma db seed` を実行して Supabase 上にテーブルと初期データを作成。
4. **Vercelプロジェクト作成**  
   https://vercel.com で GitHub をインポート → `DATABASE_URL` を環境変数として登録 → `Deploy`。
5. **動作確認**  
   `https://{project}.vercel.app` を開き、タスク作成やステータス更新が Supabase に書き込まれるか確認。

> SQLite での簡易動作にも対応したい場合は、別ブランチで provider を `sqlite` に戻し、`DATABASE_URL="file:./prisma/dev.db"` を使ってください。ただし本番デプロイは Supabase/PostgreSQL を想定しています。

## Assumptions（仮定）

- 認証は不要との要件に従い、すべてのAPIはローカル環境で信頼された利用を想定しています。
- WorkLogの`userId`はタスクの担当者で記録すると想定（必要に応じてフォーム拡張可能）。
- 日次シフト（Shift）は1ユーザー1日1件のユニーク制約としました。
- 月次公開ビューでは `publishedAt` が設定されたタスクのみを表示し、`isPublished` も true であることを前提としています。新規記事 / リライトのタスクが完了になった際に自動で公開済み化しています。

---

ご不明点や追加要件があればお気軽にお知らせください。READMEやUIテキストはすべて日本語で統一しています。

