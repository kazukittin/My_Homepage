# Calendar Backend for Render

Google Calendar の長期ログイン用バックエンドです。Render の Web Service として `server/` をデプロイします。

## Google Cloud Console

1. Google Calendar API を有効化します。
2. OAuth 同意画面を設定します。
3. OAuth クライアント ID を「ウェブ アプリケーション」で作成します。
4. 承認済みのリダイレクト URI に次を追加します。

```text
https://your-render-service.onrender.com/auth/callback
```

ローカルで試す場合はこれも追加します。

```text
http://localhost:3000/auth/callback
```

## Render

Render で New Web Service を作り、Root Directory を `server` にします。

Build Command:

```text
npm install
```

Start Command:

```text
npm start
```

Environment Variables:

```text
NODE_ENV=production
FRONTEND_URL=https://your-github-pages-url
BACKEND_URL=https://your-render-service.onrender.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
COOKIE_SECRET=32文字以上のランダム文字列
```

## Frontend

スタートページの設定画面で `Backend URL` に Render の URL を保存します。

```text
https://your-render-service.onrender.com
```

保存後、ログインボタンを押すと Google OAuth に移動します。ログイン後はバックエンドが refresh token を暗号化 Cookie に保存し、以後はバックエンド経由で予定を取得・編集します。
