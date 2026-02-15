/**
 * KATEstageLASH Review System - Configuration
 *
 * このファイルで設定を管理します。
 * GAS_URLにはデプロイしたGoogle Apps ScriptのURLを設定してください。
 */

window.CONFIG = {
    // Google Apps Script Web App URL
    // GASをデプロイ後、ここにURLを設定してください
    GAS_URL: 'https://script.google.com/macros/s/AKfycbz_v-ryvOez8fxin6WSaCRTLhGjcYo_pQ4LlZWENu1StBni9P2ruxM1gqdQrni1ZxFZ/exec',

    // Hot Pepper Beauty Review URL (Primary)
    // サロンのHot Pepper Beauty口コミ投稿ページURLを設定してください
    HOTPEPPER_REVIEW_URL: 'http://b.hpr.jp/kr/hp/H000797013',

    // Google Review URL (Secondary)
    GOOGLE_REVIEW_URL: 'https://g.page/r/CawIWPvYFL2vEBM/review',

    // Salon Info
    SALON_NAME: 'KATEstageLASH 蒲田西口店',

    // Review Settings
    MAX_CHARS: 10000,  // 実質無制限
    MIN_CHARS: 30
};
