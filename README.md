# にゃんにゃん Discord AI アシスタントボット

このプロジェクトは、Discord上でAIアシスタントとして働くにゃんこボットだにゃ。Perplexity AIのAPIを使って、ユーザーさんからの質問に日本語で答えるにゃ。

## 主なできること

- AIとおしゃべり
- おしゃべりの記録を管理
- prefixの変更（管理者さんだけにゃ）
- ヘルプコマンド

## セットアップのやり方

1. 必要なものをインストールするにゃ：
   ```
   npm install discord.js-selfbot-v13 node-fetch
   ```

2. `ADMIN_USER_IDS`と`API_KEY`を正しい値に設定するにゃ。

3. Discordのtokenを`client.login("token")`に設定するにゃ。

## 使い方

ボットを起動するには：

```
node index.js
```

## コマンド

- `,ai [質問]`: AIに質問するにゃ
- `,del`: おしゃべりの記録を消すにゃ
- `,prefix [新しいprefix]`: prefixを変えるにゃ（管理者さんだけにゃ）
- `,help`: ヘルプメッセージを見せるにゃ

## 技術的なこと

### 使ってるライブラリ

- discord.js-selfbot-v13: Discordとおしゃべりするにゃ
- node-fetch: HTTPリクエストを送るにゃ
- fs: ファイルをいじるにゃ
- path: ファイルの場所を扱うにゃ

### 主な機能

1. **おしゃべりの記録管理**:
   - ユーザーさんごとのおしゃべりをJSONファイルに保存するにゃ
   - `getUserHistory`と`saveUserHistory`関数で記録を管理するにゃ

2. **AIとのおしゃべり**:
   - Perplexity AIのAPIを使うにゃ
   - 返事の内容をチェックする機能もあるにゃ

3. **コマンドの処理**:
   - `messageCreate`イベントでコマンドを見つけるにゃ
   - それぞれのコマンドに合わせた処理をするにゃ

4. **管理者さんの機能**:
   - `isAdmin`関数で管理者さんかどうか確認するにゃ
   - prefixを変えるコマンドは管理者さんだけが使えるにゃ

## よくあるエラーと対処法

1. **tokenが無効にゃ**
   エラー: `An invalid token was provided.`
   対処法: 
   - tokenが正しくコピーされているか確認するにゃ
   - tokenを再生成して新しいものに更新するにゃ

2. **権限が足りないにゃ**
   エラー: `DiscordAPIError: Missing Permissions`
   対処法:
   - botに必要な権限があるか確認するにゃ
   - サーバー設定でbotの役割の権限を確認・修正するにゃ

3. **リクエストが多すぎるにゃ**
   エラー: `DiscordAPIError: You are being rate limited.`
   対処法:
   - リクエストの頻度を下げるにゃ
   - 一度にたくさんの操作をしないようにするにゃ

4. **メッセージが長すぎるにゃ**
   エラー: `DiscordAPIError: Invalid Form Body content: Must be 2000 or fewer in length.`
   対処法:
   - メッセージを2000文字以内に収めるにゃ
   - 長いメッセージは分けて送るにゃ

5. **コマンドの引数がおかしいにゃ**
   エラー: `DiscordAPIError: Invalid Form Body`
   対処法:
   - コマンドの引数が正しいか確認するにゃ
   - エラーメッセージをよく見てデバッグするにゃ

## 注意すること

このボットはセルフボットとして作られてるから、Discordの規約に反しちゃうかもしれないにゃ。個人で使ったり、勉強のためだけに使ってにゃ。

## ライセンス

このプロジェクトはMITライセンスで公開されてるにゃ。詳しいことは`LICENSE`ファイルを見てにゃ。
ゃ。
