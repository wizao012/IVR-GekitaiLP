# 営業電話 撃退くん LP

実写調B案（電話機＋小さなキャラクター）をFVに採用した完成版です。元のPDFモックアップをベースにした、GitHub Pages用の静的LPです。ビルドやライブラリのインストールは不要です。

## ファイル

- `index.html`：LP本体
- `thank-you.html`：フォーム送信完了画面
- `styles.css`：ページ・ボタン・フォームのデザイン
- `form.js`：入力チェック、送信処理、完了画面への遷移
- `assets/`：表示画像。フォルダごと配置してください
- `.nojekyll`：GitHub Pagesで静的ファイルをそのまま配信する設定

## GitHub Pagesへの配置

1. ZIPを展開します。
2. `gekitai-kun-lp`フォルダの**中身**を、公開するGitHubリポジトリのルートへアップロードします。`index.html`がルートにある状態にしてください。
3. リポジトリの Settings → Pages → Build and deployment で、Sourceを「Deploy from a branch」、Branchをアップロード先のブランチ、フォルダを「/(root)」に設定して保存します。
4. 表示された公開URLにアクセスしてください。

相対パスを使っているため、リポジトリ名を含むURLでも、独自ドメインでも利用できます。公開先のリポジトリへのアップロードは今回行っていません。

[GitHub公式：公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 反映内容

- 黒・赤・黄色と筆文字、縦スクロール構成を維持。
- FVに選択済みの実写調B案を反映。接客のお悩み・業種別の画像も前回の微調整を反映済み。FVは内蔵画像生成ツールによる実写調画像です。最終FVの生成プロンプトを `image-generation-notes.json` に収録。
- 既存の相談CTAを、立体感・押下時の変化がある実際のリンクボタンに変更。
- 仕組みの説明後にCTAを追加。画面下部に相談・電話の固定導線を追加。
- ヘッダー、要所、フォーム後、完了画面に `050-5291-8069` の電話リンクを設定。
- フォームを入力できるHTMLとして実装。プライバシーポリシーへの同意を必須化。
- 指定Webhookへの送信と完了画面を追加。
- 会社概要・プライバシーポリシーを指定URLへリンク。

## フォーム設定（既存Zapier項目に合わせて更新）

送信先：`https://hooks.zapier.com/hooks/catch/12525485/un3enoi/`

画像の `querystring` グループに合わせ、下記をWebhook URLのクエリパラメータに設定してPOSTします。画面上の表示名はZapierが整形します。単にPOST本文のキーを変更するのではなく、既存の `Querystring Company` / `Querystring Tel` 等への対応を意図した形式です。

| クエリのキー | 内容 |
| --- | --- |
| `company` | 会社・店舗名 |
| `name` | お名前 |
| `tel` | 電話番号（全角数字を半角化し、区切りを除去。先頭の+は保持） |
| `email` | メールアドレス |
| `utm_source` | LP URLの同名パラメータ。未指定時は空文字 |
| `utm_content` | LP URLの同名パラメータ。未指定時は空文字 |
| `utm_term` | LP URLの同名パラメータ。未指定時は空文字 |
| `submitted_at` | 日本時間 `YYYY-MM-DD HH:mm:ss` |
| `submitted_at_iso` | 同じ時点のUTC、ISO 8601（ミリ秒付き） |
| `source` | 既存値 `cloudphone_sns_form` を維持 |
| `page_url` | ページ読込時のLP URL。UTMやfbclid等のクエリを含め、#以降を除外 |
| `lp_name` | 追加のLP識別情報。常に `撃退くん` |

以下はPOST本文（フォーム形式）で送ります。長くなり得る相談内容はURLに含めません。

| 本文のキー | 内容 |
| --- | --- |
| `message` | 相談内容 |
| `privacy_consent` | `同意する` |
| `submission_id` | 送信識別子。同じ画面からの再試行は同じ値 |
| `lp_name` | `撃退くん`（本文にも付与） |

入力値やURLをURLSearchParamsでエンコードします。独自のContent-Typeヘッダーは付けず、HTTP成功応答を確認した場合だけ完了画面へ移動します。通信失敗時は入力を残します。`no-cors` で結果を確認せず成功扱いにする処理はありません。

添付画像は受信項目の見本として使用しています。画像中の氏名・連絡先・過去の送信日時・旧ページURLは固定値として埋め込んでいません。

[Zapier公式：Webhookのデータ形式](https://help.zapier.com/hc/en-us/articles/8496083355661-How-to-get-started-with-Webhooks-by-Zapier) / [ブラウザ送信とCORS](https://help.zapier.com/hc/en-us/articles/8496291737485-Troubleshoot-webhooks-in-Zapier)

## 確認済み・公開後の確認

ローカルで画像・リンク先ファイル・アンカー・JavaScript構文を確認しました。既存形式への変更後も、クエリの項目名、URLエンコード、UTM、日本時間とUTCの対応、source、LP識別子を模擬通信で確認しています。模擬通信で、送信データの識別情報、成功時の遷移、HTTPエラー、通信エラー、タイムアウト、二重送信防止、不正入力を確認しました。

**実際のZapierへのテスト送信は行っていません。** 公開後、運用担当者のテスト情報で1件送信し、完了画面、Zapierの受信履歴、`lp_name = 撃退くん`、後続の通知・保存先への反映を確認してください。Zapierの有効状態や後続アクションは、この納品ファイルからは確認できません。

フォームはJavaScriptを使用します。デザイン確認は `index.html` を開くことで可能ですが、実際の送信確認には公開したHTTPSのURLを使用してください。

## 掲載リンク

- [会社概要](https://012grp.co.jp/company/corporate_profile)
- [プライバシーポリシー](https://012grp.co.jp/policy)

本文のビジュアルは画像形式です。ボタン・フォーム・電話・企業情報リンクはHTMLで実装しています。画像内コピーの変更は画像差し替えで対応してください。


## ファビコン・端末用アイコン（追加）

既存ロゴの「盾＋受話器」を、赤・黒・白の簡潔なマークに整理しました。
LPと送信完了画面の両方に実装しています。

- `favicon.svg`：拡大しても鮮明なアイコン
- `favicon.ico`：16・32・48pxを含む従来ブラウザ向けアイコン
- `assets/favicon-16.png` / `favicon-32.png`：PNGアイコン
- `assets/apple-touch-icon.png`：180px、iPhone等のホーム画面保存用
- `assets/icon-192.png` / `icon-512.png`：端末向けアイコン
- `site.webmanifest`：サイト名、アイコン、背景色の定義（オフライン動作は追加していません）

公開先がサブディレクトリの場合にも対応する相対パスです。faviconのキャッシュにより反映に時間がかかる場合は、ページを再読み込みしてください。
