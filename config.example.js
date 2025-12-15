/**
 * KATEstageLASH Review System - 設定ファイル
 *
 * 使用方法：
 * 1. このファイルを「config.js」という名前でコピー
 * 2. 各設定値を入力
 * 3. config.jsは.gitignoreで除外されているため、GitHubにはアップロードされません
 */

const CONFIG = {
    // OpenAI API Key（口コミ自動生成用）
    // https://platform.openai.com/api-keys で取得
    OPENAI_API_KEY: '',

    // Google Apps Script Web App URL（スプレッドシート連携用）
    // SETUP.mdの手順に従ってデプロイ後、URLを貼り付け
    SPREADSHEET_URL: '',

    // Google Review URL
    GOOGLE_REVIEW_URL: 'https://g.page/r/CawIWPvYFL2vEBM/review',

    // Salon Info
    SALON_NAME: 'KATEstageLASH 蒲田西口店',

    // Review Settings
    MAX_CHARS: 500,
    MIN_CHARS: 50
};
