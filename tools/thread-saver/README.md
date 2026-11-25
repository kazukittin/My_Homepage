# いつもちゃんねる スレ監視・自動保存（PC版）

スタートページ版の「スレ監視」はページを開いている間だけの通知でしたが、こちらはPC上で定期実行され、新しいレスに付いた**画像・動画ファイルを実ファイルとして自動保存**します。ブラウザを閉じていても動きます（PCの電源が入っていて、ログインしている必要があります）。

## セットアップ

1. このフォルダ（`tools/thread-saver`）をPC上に置く（リポジトリを clone 済みならそのままでOK）
2. PowerShellでこのフォルダを開き、セットアップを実行

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\setup.ps1
   ```

3. 初回は `config.json` が作成されてメモ帳が開くので、次を編集して保存する
   - `threads`: 監視したいスレのURL（複数可）。`https://e.5chan.jp/McBp1cW8hm` の形でOK（`?from=new2` などのパラメータは付けても自動で取り除かれます）
   - `saveDir`: 保存先フォルダ（`%USERPROFILE%` などの環境変数も使えます）
4. もう一度 `setup.ps1` を実行すると、タスクスケジューラに `ItsumoThreadSaver` が登録され、5分おきにチェックが走ります

## 動作

- 5分おきに各スレの全レスを確認し、前回チェック以降の新しいレスだけを処理します
- 画像は `saveDir\<スレのコード>\0001_xxxxxxxx.jpg` のような名前で保存されます
- 動画も同じフォルダに保存されます
- 外部リンクが貼られたレスは、ファイルを保存する代わりに同じフォルダの `links.txt` に「日時・レス番号・URL」を追記します（同一スレ内の引用リンクは対象外）
- **初回実行時は、その時点の最新レスまでを既読として監視を開始します**（過去分は保存しません）
  - 過去分も含めて全部保存したい場合は、初回だけ手動で次を実行してください

    ```powershell
    powershell -ExecutionPolicy Bypass -File .\thread-saver.ps1 -DownloadAll
    ```

- 保存に失敗したファイルは、次回の実行で自動的に再試行されます
- 実行ログは `saver.log`、監視状態は `state.json` に記録されます（どちらもこのフォルダ内）

## オプション

| オプション | 内容 |
|---|---|
| `-DownloadAll` | 初回に過去分も含めて保存する |
| `-DryRun` | 実際には保存せず、保存予定のファイル名だけを表示する |

## 解除

```powershell
Unregister-ScheduledTask -TaskName 'ItsumoThreadSaver' -Confirm:$false
```

## 注意

- スレが終わって次スレに移ったら、`config.json` のURLを新しいスレに差し替えてください（状態はスレごとに分かれているので、そのまま追加でも大丈夫です）
- スタートページ側の「スレ監視」カードとは別々に動きます。ページ側は通知用、こちらは保存用として併用できます
- `config.json` / `state.json` / `saver.log` は個人用のファイルなので、リポジトリの `.gitignore` で除外しています
