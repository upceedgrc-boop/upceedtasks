# Supabase 接続トラブルシューティング

## 現在の接続設定

- **ホスト**: `db.htnyjcmjxkebdkeaprztt.supabase.co`
- **ポート**: `5432` (Direct connection)
- **データベース**: `postgres`
- **ユーザー**: `postgres`

## 接続エラー (P1001) が発生している場合

### 1. Supabase プロジェクトの確認

1. Supabase ダッシュボードにアクセス
2. プロジェクトがアクティブか確認
3. プロジェクトが削除されていないか確認

### 2. 接続文字列の確認

Supabase ダッシュボードで以下を確認：

1. **Settings → Database**
2. **Connection string** セクションを確認
3. **Direct connection** と **Connection Pooling** の両方の接続文字列を確認

### 3. IP アドレスの許可設定

1. **Settings → Database → Network Restrictions**
2. ローカル開発環境の場合は、すべての IP アドレスを許可する設定を確認
3. 本番環境（Vercel）の場合は、Vercel の IP アドレスを許可するか、すべての IP アドレスを許可

### 4. Connection Pooling を試す

Direct connection (ポート 5432) がうまくいかない場合、Connection Pooling (ポート 6543) を試してください：

```
postgresql://postgres:upceed999@db.htnyjcmjxkebdkeaprztt.supabase.co:6543/postgres?pgbouncer=true
```

### 5. パスワードの確認

Supabase ダッシュボードで：

1. **Settings → Database → Database Password**
2. パスワードが `upceed999` であることを確認
3. 異なる場合は、`.env` ファイルを更新

## 接続テスト

以下のコマンドで接続をテストできます：

```bash
npx prisma db execute --stdin <<< "SELECT 1;"
```

または、Supabase ダッシュボードの **SQL Editor** で直接クエリを実行して、データベースが動作していることを確認してください。

