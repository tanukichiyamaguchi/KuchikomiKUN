/**
 * KATEstageLASH Review System
 * Google Apps Script for Spreadsheet Integration
 *
 * ============================================
 * セットアップ手順
 * ============================================
 *
 * 1. Google Spreadsheetを新規作成
 * 2. 「拡張機能」→「Apps Script」を開く
 * 3. このコードを全てコピーしてCode.gsに貼り付け
 * 4. 「デプロイ」→「新しいデプロイ」をクリック
 * 5. 「種類の選択」で「ウェブアプリ」を選択
 * 6. 設定：
 *    - 説明: KATEstageLASH Review System
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 7. 「デプロイ」をクリック
 * 8. 表示されたURLをコピーして、script.jsのSPREADSHEET_URLに設定
 *
 * ============================================
 */

// スプレッドシートの設定
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME = '口コミデータ';

/**
 * 初回セットアップ - スプレッドシートにヘッダーを設定
 * スクリプトエディタから手動で一度実行してください
 */
function setupSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  // シートが存在しない場合は作成
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  // ヘッダー行を設定
  const headers = [
    '投稿日時',
    'メニュー',
    '総合満足度',
    '施術の仕上がり',
    '接客・カウンセリング',
    '店内の雰囲気',
    '価格・コスパ',
    '口コミ内容',
    'Google投稿済み'
  ];

  // ヘッダーを設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ヘッダーのスタイル設定
  headerRange.setBackground('#D4AF37');  // ゴールド
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 列幅を自動調整
  sheet.setColumnWidth(1, 150);  // 投稿日時
  sheet.setColumnWidth(2, 200);  // メニュー
  sheet.setColumnWidth(3, 100);  // 総合満足度
  sheet.setColumnWidth(4, 120);  // 施術の仕上がり
  sheet.setColumnWidth(5, 140);  // 接客
  sheet.setColumnWidth(6, 120);  // 雰囲気
  sheet.setColumnWidth(7, 100);  // コスパ
  sheet.setColumnWidth(8, 400);  // 口コミ内容
  sheet.setColumnWidth(9, 120);  // Google投稿済み

  // 固定行
  sheet.setFrozenRows(1);

  Logger.log('シートのセットアップが完了しました');
}

/**
 * POSTリクエストを処理
 * @param {Object} e - リクエストオブジェクト
 * @returns {ContentService.TextOutput} - レスポンス
 */
function doPost(e) {
  try {
    // リクエストデータをパース
    const data = JSON.parse(e.postData.contents);

    // データを保存
    const result = saveReviewData(data);

    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'データが保存されました',
      rowNumber: result.rowNumber
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラーレスポンス
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを処理（テスト用）
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'KATEstageLASH Review System API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 口コミデータをスプレッドシートに保存
 * @param {Object} data - 口コミデータ
 * @returns {Object} - 保存結果
 */
function saveReviewData(data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  // シートが存在しない場合はセットアップ
  if (!sheet) {
    setupSheet();
    sheet = spreadsheet.getSheetByName(SHEET_NAME);
  }

  // タイムスタンプをフォーマット
  const timestamp = formatTimestamp(data.timestamp);

  // 星評価を表示用に変換
  const formatRating = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // 行データを作成
  const rowData = [
    timestamp,
    data.menu || '',
    formatRating(data.overallRating || 0),
    formatRating(data.qualityRating || 0),
    formatRating(data.serviceRating || 0),
    formatRating(data.atmosphereRating || 0),
    formatRating(data.valueRating || 0),
    data.review || '',
    ''  // Google投稿済みフラグ（手動で更新）
  ];

  // 最終行に追加
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);

  // 新しい行のスタイル設定
  const range = sheet.getRange(newRow, 1, 1, rowData.length);

  // 交互の背景色
  if (newRow % 2 === 0) {
    range.setBackground('#FBF6E9');  // 薄いゴールド
  }

  // 口コミ内容セルを折り返し設定
  sheet.getRange(newRow, 8).setWrap(true);

  return {
    success: true,
    rowNumber: newRow
  };
}

/**
 * タイムスタンプをフォーマット
 * @param {string} isoString - ISO形式の日時文字列
 * @returns {string} - フォーマット済み日時
 */
function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch (e) {
    return new Date().toLocaleString('ja-JP');
  }
}

/**
 * 統計情報を取得（ダッシュボード用）
 */
function getStatistics() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() <= 1) {
    return {
      totalReviews: 0,
      averageRating: 0,
      reviewsByMenu: {}
    };
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();

  let totalRating = 0;
  let ratingCount = 0;
  const reviewsByMenu = {};

  data.forEach(row => {
    // 総合満足度の星の数をカウント
    const rating = (row[2].match(/★/g) || []).length;
    if (rating > 0) {
      totalRating += rating;
      ratingCount++;
    }

    // メニュー別カウント
    const menu = row[1];
    if (menu) {
      reviewsByMenu[menu] = (reviewsByMenu[menu] || 0) + 1;
    }
  });

  return {
    totalReviews: data.length,
    averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0,
    reviewsByMenu: reviewsByMenu
  };
}

/**
 * 日次レポートをメールで送信（トリガー設定用）
 */
function sendDailyReport() {
  const stats = getStatistics();
  const today = new Date().toLocaleDateString('ja-JP');

  const htmlBody = `
    <h2>KATEstageLASH 蒲田西口店 - 口コミレポート</h2>
    <p>日付: ${today}</p>
    <hr>
    <h3>統計情報</h3>
    <ul>
      <li>総口コミ数: ${stats.totalReviews}件</li>
      <li>平均評価: ${stats.averageRating} ★</li>
    </ul>
    <h3>メニュー別口コミ数</h3>
    <ul>
      ${Object.entries(stats.reviewsByMenu).map(([menu, count]) =>
        `<li>${menu}: ${count}件</li>`
      ).join('')}
    </ul>
    <hr>
    <p>
      <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}">
        スプレッドシートを開く
      </a>
    </p>
  `;

  // メール送信先を設定してください
  const emailAddress = Session.getActiveUser().getEmail();

  MailApp.sendEmail({
    to: emailAddress,
    subject: `[KATEstageLASH] 口コミレポート ${today}`,
    htmlBody: htmlBody
  });
}

/**
 * テスト用関数 - 手動でデータを追加
 */
function testAddData() {
  const testData = {
    timestamp: new Date().toISOString(),
    menu: 'まつげパーマ（パリジェンヌラッシュリフト）',
    overallRating: 5,
    qualityRating: 5,
    serviceRating: 5,
    atmosphereRating: 4,
    valueRating: 4,
    review: 'テスト口コミです。スタッフさんの対応がとても丁寧で、仕上がりも綺麗でした。また利用したいと思います。'
  };

  const result = saveReviewData(testData);
  Logger.log('Test result: ' + JSON.stringify(result));
}
