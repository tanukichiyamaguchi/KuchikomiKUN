/**
 * KATEstageLASH Review System
 * Google Apps Script for Spreadsheet Integration & AI Review Generation
 *
 * ============================================
 * セットアップ手順
 * ============================================
 *
 * 1. Google Spreadsheetを新規作成
 * 2. 「拡張機能」→「Apps Script」を開く
 * 3. このコードを全てコピーしてCode.gsに貼り付け
 * 4. Gemini APIキーを設定:
 *    - 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」
 *    - 「スクリプト プロパティを追加」をクリック
 *    - プロパティ名: GEMINI_API_KEY
 *    - 値: あなたのGemini APIキー（Google AI Studioで取得）
 * 5. 「デプロイ」→「新しいデプロイ」をクリック
 * 6. 「種類の選択」で「ウェブアプリ」を選択
 * 7. 設定：
 *    - 説明: KATEstageLASH Review System
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 8. 「デプロイ」をクリック
 * 9. 表示されたURLをコピーして、config.jsのGAS_URLに設定
 *
 * ============================================
 */

// スプレッドシートの設定
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME = '口コミデータ';
const SALON_NAME = 'KATEstageLASH 蒲田西口店';

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
  headerRange.setBackground('#C9A227');  // ゴールド
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
 * GETリクエストを処理（JSONP対応 - CORS回避）
 * @param {Object} e - リクエストオブジェクト
 * @returns {ContentService.TextOutput} - レスポンス
 */
function doGet(e) {
  try {
    const callback = e.parameter.callback || 'callback';
    const action = e.parameter.action || 'status';

    let result;

    switch (action) {
      case 'generate':
        // AI口コミ生成
        const data = {
          menu: e.parameter.menu || '',
          overall: parseInt(e.parameter.overall) || 3,
          quality: parseInt(e.parameter.quality) || 3,
          service: parseInt(e.parameter.service) || 3,
          atmosphere: parseInt(e.parameter.atmosphere) || 3,
          value: parseInt(e.parameter.value) || 3
        };
        result = generateReviewWithAI(data);
        break;
      case 'status':
      default:
        result = {
          status: 'ok',
          message: 'KATEstageLASH Review System API is running',
          version: '2.1'
        };
        break;
    }

    // JSONP形式でレスポンス
    const jsonp = callback + '(' + JSON.stringify(result) + ')';
    return ContentService.createTextOutput(jsonp)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);

  } catch (error) {
    const callback = (e && e.parameter && e.parameter.callback) || 'callback';
    const errorResponse = callback + '(' + JSON.stringify({
      status: 'error',
      message: error.toString()
    }) + ')';
    return ContentService.createTextOutput(errorResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

/**
 * POSTリクエストを処理（データ保存用）
 * @param {Object} e - リクエストオブジェクト
 * @returns {ContentService.TextOutput} - レスポンス
 */
function doPost(e) {
  try {
    // リクエストデータをパース
    const data = JSON.parse(e.postData.contents);

    // データ保存
    const result = saveReviewData(data);

    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

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
 * Gemini 2.5 Flash APIを使用して口コミを生成
 * @param {Object} data - 評価データ
 * @returns {Object} - 生成結果
 */
function generateReviewWithAI(data) {
  // スクリプトプロパティからAPIキーを取得
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    // APIキーが設定されていない場合はテンプレートを使用
    return {
      status: 'success',
      review: generateReviewFromTemplate(data),
      source: 'template'
    };
  }

  try {
    const prompt = createReviewPrompt(data);

    // Gemini 2.5 Flash API エンドポイント
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 500,
          topP: 0.95,
          topK: 40
        }
      }),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log('Gemini API Error: ' + responseText);
      // エラー時はテンプレートにフォールバック
      return {
        status: 'success',
        review: generateReviewFromTemplate(data),
        source: 'template'
      };
    }

    const result = JSON.parse(responseText);
    const review = result.candidates[0].content.parts[0].text.trim();

    return {
      status: 'success',
      review: review,
      source: 'ai'
    };

  } catch (error) {
    Logger.log('AI Generation Error: ' + error.toString());
    // エラー時はテンプレートにフォールバック
    return {
      status: 'success',
      review: generateReviewFromTemplate(data),
      source: 'template'
    };
  }
}

/**
 * AIプロンプトを作成（SEO対策ワード含む、様々な文体対応）
 * @param {Object} data - 評価データ
 * @returns {string} - プロンプト
 */
function createReviewPrompt(data) {
  const { menu, overall, quality, service, atmosphere, value } = data;

  // 評価に応じたトーン設定
  let tone = '';
  if (overall >= 5) {
    tone = '大変満足した体験として、積極的に褒める内容';
  } else if (overall >= 4) {
    tone = '満足した体験として、良かった点を具体的に挙げる内容';
  } else if (overall >= 3) {
    tone = '普通の体験として、淡々と感想を述べる内容';
  } else {
    tone = '改善を期待する控えめな内容';
  }

  // 文体のバリエーション
  const writingStyles = [
    '丁寧で礼儀正しい敬語調（「〜でした」「〜いただきました」）',
    'カジュアルでフレンドリーな口調（「〜だった」「〜してくれた」）',
    '熱烈で感動を込めた表現（「本当に」「すごく」などの強調）',
    '冷静で客観的な評価スタイル（事実を淡々と述べる）',
    '親しみやすい話し言葉調（「〜なんです」「〜ですよね」）',
    '簡潔でシンプルな表現（短文中心）',
    '詳細で説明的な文体（具体的な描写を含む）'
  ];
  const randomStyle = writingStyles[Math.floor(Math.random() * writingStyles.length)];

  // 文字数のバリエーション（100〜300文字）
  const charRanges = [
    { min: 100, max: 150, desc: '100〜150文字程度（簡潔に）' },
    { min: 150, max: 200, desc: '150〜200文字程度（標準的）' },
    { min: 200, max: 250, desc: '200〜250文字程度（やや詳しく）' },
    { min: 250, max: 300, desc: '250〜300文字程度（詳細に）' }
  ];
  const randomCharRange = charRanges[Math.floor(Math.random() * charRanges.length)];

  return `あなたは眉毛まつ毛サロンに通う一般のお客様です。
以下の評価に基づいて、Googleマップに投稿する口コミを作成してください。

【施術メニュー】${menu}

【評価】
- 総合満足度: ${overall}点/5点
- 施術の仕上がり: ${quality}点/5点
- 接客・カウンセリング: ${service}点/5点
- 店内の雰囲気: ${atmosphere}点/5点
- 価格・コスパ: ${value}点/5点

【口コミのトーン】${tone}

【今回の文体】${randomStyle}

【文字数】${randomCharRange.desc}

【重要なルール】
1. 必ず以下のSEOキーワードのうち1〜3個を自然に含めてください：
   - 眉毛関連: 眉毛、まゆ毛、アイブロウ、眉毛サロン、眉毛スタイリング、眉デザイン
   - まつ毛関連: まつ毛、まつげ、まつ毛パーマ、まつげパーマ、パリジェンヌ、ラッシュリフト、まつ毛サロン
   - 施術関連: 仕上がり、デザイン、施術、カウンセリング、技術

2. 絵文字は使用しないでください
3. サロン名は含めないでください
4. 実際に体験したかのような具体的で自然な表現を使ってください
5. 他の口コミとは異なる独自の視点や表現を心がけてください
6. 口コミ本文のみを出力してください（説明や前置きは不要）

口コミを1つだけ生成してください：`;
}

/**
 * テンプレートから口コミを生成（フォールバック用）
 * @param {Object} data - 評価データ
 * @returns {string} - 生成された口コミ
 */
function generateReviewFromTemplate(data) {
  const rating = data.overall || 3;
  const menu = data.menu || '施術';

  const templates = {
    5: [
      `初めて${menu}を体験しましたが、スタッフさんの丁寧なカウンセリングのおかげで、理想通りの仕上がりになりました。施術中もリラックスできる雰囲気で、あっという間に終わりました。仕上がりも持ちも最高で、友達にもおすすめしたいサロンです。`,
      `${menu}でお世話になりました。カウンセリングがとても丁寧で、私の希望をしっかり聞いてくださいました。技術力が高く、自然で美しい仕上がりに大満足です。店内も清潔感があり、また絶対リピートします。`,
      `今まで色々なサロンを試しましたが、ここが一番良かったです。${menu}の仕上がりが素晴らしく、毎朝のメイク時間が短縮されました。スタッフさんも親切で、価格以上の価値があると思います。`
    ],
    4: [
      `${menu}を受けました。スタッフさんの対応も良く、仕上がりも綺麗で満足しています。駅からも近くて通いやすいので、また利用したいと思います。`,
      `丁寧なカウンセリングで安心してお任せできました。${menu}の仕上がりも良く、友人にも褒められました。次回も同じスタッフさんにお願いしたいです。`,
      `初めての来店でしたが、スタッフさんが親切に説明してくださり、リラックスして施術を受けられました。${menu}の仕上がりも満足です。`
    ],
    3: [
      `${menu}を体験しました。スタッフさんの対応は丁寧で、仕上がりも悪くないと思います。また機会があれば利用したいです。`,
      `予約通りの時間で施術していただきました。${menu}の仕上がりは期待通りでした。普通に良いサロンだと思います。`,
      `${menu}で伺いました。カウンセリングもしっかりしていて、施術も丁寧でした。特に不満はありませんでした。`
    ],
    2: [
      `${menu}を受けました。もう少しカウンセリングに時間をかけていただけると、より希望に近い仕上がりになったかもしれません。`,
      `施術自体は問題なかったのですが、思っていた仕上がりと少し違いました。次回はもっと詳しく希望を伝えてみようと思います。`
    ],
    1: [
      `今回の${menu}は期待していた仕上がりではありませんでした。もう少しカウンセリングで希望を聞いていただきたかったです。`,
      `残念ながら今回は満足できる仕上がりではありませんでした。改善を期待しています。`
    ]
  };

  const ratingTemplates = templates[rating] || templates[3];
  const randomIndex = Math.floor(Math.random() * ratingTemplates.length);

  return ratingTemplates[randomIndex];
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
    range.setBackground('#F7F3E3');  // 薄いゴールド
  }

  // 口コミ内容セルを折り返し設定
  sheet.getRange(newRow, 8).setWrap(true);

  return {
    status: 'success',
    message: 'データが保存されました',
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
 * AI生成テスト用関数
 */
function testAIGeneration() {
  const testData = {
    action: 'generate',
    menu: 'まつげパーマ（パリジェンヌラッシュリフト）',
    overall: 5,
    quality: 5,
    service: 5,
    atmosphere: 4,
    value: 4
  };

  const result = generateReviewWithAI(testData);
  Logger.log('AI Generation Result: ' + JSON.stringify(result));
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
