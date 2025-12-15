# KATEstageLASH 口コミ投稿システム セットアップガイド

## 概要

眉毛まつ毛サロン「KATEstageLASH 蒲田西口店」のお客様向け口コミ投稿システムです。
スマートフォンでの操作を前提とした、洗練されたUIデザインで構成されています。

## ファイル構成

```
KuchikomiKUN/
├── index.html          # メインHTML
├── style.css           # スタイルシート（金色コーポレートカラー）
├── script.js           # JavaScript（フロントエンド処理）
├── google-apps-script.js  # Google Apps Script（スプレッドシート連携）
├── logo.png            # ロゴ画像（別途配置）
└── SETUP.md            # このファイル
```

## セットアップ手順

### 1. ロゴ画像の配置

`logo.png` という名前でサロンのロゴ画像をindex.htmlと同じディレクトリに配置してください。
推奨サイズ: 幅400px程度（高解像度ディスプレイ対応のため2倍サイズ推奨）

### 2. Google Spreadsheet の設定

1. [Google Spreadsheet](https://sheets.google.com) で新しいスプレッドシートを作成
2. メニューから「拡張機能」→「Apps Script」を選択
3. `google-apps-script.js` の内容を全てコピーして貼り付け
4. 「保存」をクリック
5. `setupSheet` 関数を選択して「実行」→ ヘッダー行が自動作成されます
6. 「デプロイ」→「新しいデプロイ」をクリック
7. 以下の設定でデプロイ:
   - 種類: ウェブアプリ
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: 全員
8. 表示されたURLをコピー

### 3. API設定（script.js）

`script.js` ファイルの `CONFIG` セクションを編集:

```javascript
const CONFIG = {
    // OpenAI API Key（口コミ自動生成用）
    OPENAI_API_KEY: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',

    // 手順2で取得したGoogle Apps Script URL
    SPREADSHEET_URL: 'https://script.google.com/macros/s/xxxxxx/exec',

    // その他はそのままでOK
};
```

#### OpenAI API Keyの取得方法

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成またはログイン
3. 「API Keys」から新しいキーを作成
4. キーをコピーして `OPENAI_API_KEY` に設定

※ API Keyを設定しない場合でも、テンプレートベースの口コミ例が表示されます

### 4. ホスティング

以下のいずれかの方法でホスティングしてください:

#### 方法A: GitHub Pages（無料）
1. GitHubリポジトリにプッシュ
2. Settings → Pages → Source: main branch
3. 数分後に `https://username.github.io/repository/` でアクセス可能

#### 方法B: Netlify（無料）
1. [Netlify](https://netlify.com) にログイン
2. 「Add new site」→「Import an existing project」
3. GitHubリポジトリを選択
4. デプロイ設定はデフォルトでOK

#### 方法C: Vercel（無料）
1. [Vercel](https://vercel.com) にログイン
2. 「New Project」→ GitHubリポジトリをインポート
3. そのままデプロイ

### 5. QRコードの作成

ホスティングしたURLからQRコードを作成し、店舗に設置してください。

推奨ツール:
- [QRコード作成サイト](https://www.qrcode-monkey.com/)
- [Google Chart API](https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=YOUR_URL)

## 機能説明

### Step 1: 評価入力
- ご利用メニューの選択
- 5段階の星評価（タップ操作）
  - 総合満足度
  - 施術の仕上がり
  - 接客・カウンセリング
  - 店内の雰囲気
  - 価格・コスパ

### Step 2: 口コミ編集
- AI生成による口コミ例の提案（API設定時）
- テンプレートベースの口コミ例（API未設定時）
- お客様による自由編集
- 「別の口コミ例を見る」で再生成可能

### Step 3: Google投稿
- 口コミ内容のプレビュー
- ワンタップでクリップボードにコピー
- Googleマップの口コミページへ直接遷移
- 投稿データは自動でスプレッドシートに保存

## スプレッドシートのデータ形式

| 列 | 内容 |
|---|---|
| A | 投稿日時 |
| B | メニュー |
| C | 総合満足度（★表示） |
| D | 施術の仕上がり |
| E | 接客・カウンセリング |
| F | 店内の雰囲気 |
| G | 価格・コスパ |
| H | 口コミ内容 |
| I | Google投稿済み（手動チェック用） |

## カスタマイズ

### カラーテーマの変更

`style.css` の `:root` セクションでカラー変数を変更:

```css
:root {
    --gold-primary: #D4AF37;    /* メインゴールド */
    --gold-light: #F4E4BC;      /* 薄いゴールド */
    --gold-dark: #B8860B;       /* 濃いゴールド */
    /* ... */
}
```

### メニュー項目の編集

`index.html` の `<select id="menuSelect">` 内のオプションを編集してください。

### Google口コミURLの変更

`script.js` の `CONFIG.GOOGLE_REVIEW_URL` を変更:

```javascript
GOOGLE_REVIEW_URL: 'https://g.page/r/xxxxx/review',
```

## トラブルシューティング

### 口コミ例が生成されない
- OpenAI API Keyが正しく設定されているか確認
- ブラウザの開発者ツール（Console）でエラーを確認
- API Keyの残高/制限を確認

### スプレッドシートにデータが保存されない
- Google Apps ScriptのURLが正しいか確認
- Apps Scriptが正しくデプロイされているか確認
- デプロイ設定で「全員がアクセス可能」になっているか確認

### 表示が崩れる
- ブラウザのキャッシュをクリア
- CSSファイルが正しく読み込まれているか確認

## サポート

技術的な問題やカスタマイズのご要望は、開発担当者までお問い合わせください。
