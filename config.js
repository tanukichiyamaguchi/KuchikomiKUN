/**
 * KATEstageLASH Review System - Configuration
 *
 * このファイルで設定を管理します。
 * GAS_URLにはデプロイしたGoogle Apps ScriptのURLを設定してください。
 */

window.CONFIG = {
    // Google Apps Script Web App URL
    // GASをデプロイ後、ここにURLを設定してください
    GAS_URL: 'https://script.google.com/macros/s/AKfycbxV-Tnl_hr-C8bJfoM3VTe4xXE_yaES7sqy9u9M2sA4r1uJ0aQaIoNiTKdN-xIB_mWGZg/exec',

    // Hot Pepper Beauty Review URL (Primary)
    // サロンのHot Pepper Beauty口コミ投稿ページURLを設定してください
    HOTPEPPER_REVIEW_URL: 'https://beauty.hotpepper.jp/kr/slnH000770276/review/',

    // Google Review URL (Secondary)
    GOOGLE_REVIEW_URL: 'https://g.page/r/CawIWPvYFL2vEBM/review',

    // Salon Info
    SALON_NAME: 'KATEstageLASH 蒲田西口店',

    // Review Settings
    MAX_CHARS: 500,
    MIN_CHARS: 50
};
