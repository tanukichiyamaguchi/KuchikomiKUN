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
          value: parseInt(e.parameter.value) || 3,
          goodPoints: e.parameter.goodPoints || '',
          reviewLength: e.parameter.reviewLength || 'medium',
          writingStyle: e.parameter.writingStyle || 'polite'
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
 * Gemini 2.0 Flash APIを使用して口コミを生成
 * @param {Object} data - 評価データ
 * @returns {Object} - 生成結果
 */
function generateReviewWithAI(data) {
  // スクリプトプロパティからAPIキーを取得
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    Logger.log('GEMINI_API_KEY is not set in script properties');
    // APIキーが設定されていない場合はテンプレートを使用
    return {
      status: 'success',
      review: generateReviewFromTemplate(data),
      source: 'template',
      debug: 'API key not configured'
    };
  }

  try {
    const prompt = createReviewPrompt(data);
    Logger.log('Generated prompt length: ' + prompt.length);

    // Gemini 2.0 Flash API エンドポイント
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

    const payload = {
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
        temperature: 0.9,
        maxOutputTokens: 8192,
        topP: 0.95
      }
    };

    Logger.log('Calling Gemini API...');

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Gemini API Response Code: ' + responseCode);

    if (responseCode !== 200) {
      Logger.log('Gemini API Error Response: ' + responseText);
      // エラー時はテンプレートにフォールバック
      return {
        status: 'success',
        review: generateReviewFromTemplate(data),
        source: 'template',
        debug: 'API error: ' + responseCode
      };
    }

    const result = JSON.parse(responseText);
    Logger.log('Gemini API Response parsed successfully');
    Logger.log('Full response: ' + responseText.substring(0, 2000));

    // レスポンス構造を確認
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      Logger.log('Unexpected response structure: ' + responseText);
      return {
        status: 'success',
        review: generateReviewFromTemplate(data),
        source: 'template',
        debug: 'Invalid response structure'
      };
    }

    // Gemini 2.5 Flashは複数のpartsを返す可能性がある（thinking含む）
    const parts = result.candidates[0].content.parts;
    Logger.log('Number of parts: ' + parts.length);

    // 最後のpartがテキスト出力（thinkingがある場合は最初のpartがthinking）
    let review = '';
    for (let i = 0; i < parts.length; i++) {
      Logger.log('Part ' + i + ': ' + JSON.stringify(parts[i]).substring(0, 200));
      if (parts[i].text) {
        review = parts[i].text.trim();
      }
    }

    Logger.log('AI generated review length: ' + review.length);
    Logger.log('AI generated review: ' + review);

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
      source: 'template',
      debug: 'Exception: ' + error.toString()
    };
  }
}

/**
 * AIプロンプトを作成（SEO対策ワード含む、ユーザー選択の文体対応）
 * @param {Object} data - 評価データ
 * @returns {string} - プロンプト
 */
function createReviewPrompt(data) {
  // データが未定義の場合のデフォルト値
  const safeData = data || {};
  const menu = safeData.menu || '施術';
  const overall = safeData.overall || 3;
  const quality = safeData.quality || overall;
  const service = safeData.service || overall;
  const atmosphere = safeData.atmosphere || overall;
  const value = safeData.value || overall;
  const goodPoints = safeData.goodPoints || '';
  const reviewLength = safeData.reviewLength || 'medium';
  const writingStyle = safeData.writingStyle || 'polite';

  // サロン名
  const salonName = 'KATE stage LASH(ケイトステージラッシュ)蒲田西口店';

  // 文字数設定（ユーザー選択に基づく）
  let charInstruction = '';
  switch (reviewLength) {
    case 'short':
      charInstruction = '80〜150文字程度（簡潔に要点のみ）';
      break;
    case 'long':
      charInstruction = '300〜500文字程度（詳しく丁寧に）';
      break;
    case 'medium':
    default:
      charInstruction = '150〜250文字程度（標準的な長さ）';
      break;
  }

  // 良かったポイントのセクション（最重要）
  let goodPointsSection = '';
  if (goodPoints) {
    const pointsList = goodPoints.split(',').map(p => '- ' + p.trim()).join('\n');
    goodPointsSection = `

★★★【最重要】お客様が良かったと感じた点★★★
${pointsList}

【重要な指示】
上記の「良かった点」は、お客様が実際に選択した内容です。
口コミの中で、これらの良かった点を【必ず具体的に言及】してください。
例えば「仕上がりがきれい」が選ばれていれば、仕上がりについて詳しく書いてください。
「スタッフの対応が良い」が選ばれていれば、接客について触れてください。
良かった点は口コミの中心的な内容として扱い、自然な形で強調してください。`;
  }

  // 文体パターン（6種類 - ユーザーが選択）
  const writingPatterns = {
    polite: {
      style: '丁寧な敬語調',
      example: '〜でした、〜いただきました、〜させていただきました',
      characteristics: '礼儀正しく、感謝の気持ちを込めた表現。「ありがとうございました」など丁寧語を使用'
    },
    casual: {
      style: 'カジュアルな口語調',
      example: '〜だった、〜してくれた、〜で良かった',
      characteristics: '友達に話すような気軽な表現。堅苦しくない自然体の言葉遣い'
    },
    emotional: {
      style: '感情豊かな表現',
      example: '本当に〜、すごく〜、めっちゃ嬉しい〜',
      characteristics: '喜びや感動を素直に表現。感嘆詞やポジティブな形容詞を多用'
    },
    objective: {
      style: '冷静で客観的な評価',
      example: '〜と思います、〜という印象でした、〜と感じました',
      characteristics: '事実を淡々と述べるスタイル。主観的な感情表現は控えめに'
    },
    friendly: {
      style: '親しみやすい話し言葉',
      example: '〜なんです、〜ですよね、〜かな',
      characteristics: '読み手に語りかけるような表現。「〜おすすめです！」など親近感のある口調'
    },
    simple: {
      style: 'シンプルで短文中心',
      example: '短い文で簡潔に。ポイントを絞って。',
      characteristics: '無駄のない簡潔な表現。一文を短くし、要点を明確に'
    }
  };

  // ユーザーが選択した文体を取得
  const selectedPattern = writingPatterns[writingStyle] || writingPatterns.polite;

  // 絵文字使用の有無
  const useEmoji = Math.random() < 0.25; // 25%の確率で絵文字使用
  const emojiInstruction = useEmoji
    ? '適度に絵文字を使ってください（1〜2個程度、使いすぎない）'
    : '絵文字は使用しないでください';

  // 自然さを出すためのバリエーション要素
  const personalDetails = [
    '初めて来店した',
    '友人の紹介で来た',
    'ネットで見つけた',
    'リピーターとして通っている',
    '久しぶりに来店した',
    '引っ越してきて新しいサロンを探していた',
    '仕事帰りに寄った',
    '休日に予約を入れた'
  ];
  const randomDetail = personalDetails[Math.floor(Math.random() * personalDetails.length)];

  const specificScenarios = [
    '結婚式を控えていた',
    '久しぶりのお出かけ前だった',
    'プロフィール写真を撮る予定があった',
    '自分へのご褒美として',
    '毎朝のメイク時間を短縮したくて',
    '自まつ毛を活かしたくて',
    '眉毛の形に悩んでいた',
    '初めてのまつ毛パーマに挑戦'
  ];
  const randomScenario = specificScenarios[Math.floor(Math.random() * specificScenarios.length)];

  return `あなたは蒲田にある眉毛まつ毛サロン「${salonName}」に実際に通っている一般のお客様です。
Googleマップまたは口コミサイトに投稿する【ポジティブで自然な口コミ】を作成してください。

【サロン名】${salonName}
【施術メニュー】${menu}

【お客様の満足度】
- 総合: ${overall}/5点
- 仕上がり: ${quality}/5点
- 接客: ${service}/5点
- 雰囲気: ${atmosphere}/5点
- コスパ: ${value}/5点
${goodPointsSection}

【今回の文体】★お客様が選んだ文体です。必ずこの文体で書いてください★
- スタイル: ${selectedPattern.style}
- 表現例: ${selectedPattern.example}
- 特徴: ${selectedPattern.characteristics}

【文字数】${charInstruction}

【自然な口コミにするためのヒント】
- 来店シチュエーション例: ${randomDetail}
- 背景・きっかけ例: ${randomScenario}
※上記はあくまで参考です。自由にアレンジしてリアルな体験談を書いてください。

【絶対に守るべきルール】
1. 【禁止】ネガティブ・マイナスな表現は絶対に使わないでください
   - NG例: 残念、不満、期待外れ、悪い、改善してほしい、〜だけが、〜はイマイチ
   - NG例: 「〜以外は良かった」「強いて言えば」「唯一の欠点」などの否定的ニュアンス
2. 【必須】100%ポジティブな内容のみで構成してください
3. 【必須】定型文・テンプレート的な表現は避けてください
   - NG例: 「丁寧なカウンセリングでした」「仕上がりに満足です」（これだけだと機械的）
   - OK例: 具体的なエピソードや自分だけの感想を入れる

【自然な口コミを書くコツ】
- 「私は〜」「今回〜」など、一人称を自然に使う
- 具体的な状況や感情を入れる（例：「緊張してたけど〜」「思わず〜」）
- 友達や家族に話すような、生きた言葉で書く
- 同じ言い回しを繰り返さない
- 文の長さにバリエーションをつける（短い文と長い文を混ぜる）

【SEOキーワード】自然な文脈で2〜3個含める：
- 眉毛、まつ毛、まつげ、パリジェンヌ、ラッシュリフト、蒲田

【その他】
- サロン名を自然な形で1回言及
- ${emojiInstruction}
- 口コミ本文のみを出力（前置き不要）

人間が実際に書いたような、温かみのあるリアルな口コミを1つ生成：`;
}

/**
 * テンプレートから口コミを生成（フォールバック用）
 * @param {Object} data - 評価データ
 * @returns {string} - 生成された口コミ
 */
function generateReviewFromTemplate(data) {
  const safeData = data || {};
  const rating = safeData.overall || 3;
  const menu = safeData.menu || '施術';

  const templates = {
    5: [
      `友人の紹介でケイトステージラッシュ蒲田西口店に行ってきました！${menu}をお願いしたんですが、カウンセリングから施術まで本当に丁寧で感動しました。仕上がりを見た瞬間、思わず鏡を二度見しちゃいました笑 これはリピート確定です！`,
      `蒲田駅から近くて通いやすいケイトステージラッシュさん。${menu}の技術が本当にすごくて、自分史上最高の仕上がりになりました。スタッフさんとの会話も楽しくて、あっという間に終わった感じ。毎朝のメイクが楽しくなりそうです！`,
      `初めての${menu}でドキドキしてたけど、スタッフさんが優しく説明してくれて安心できました。仕上がりを見て「これこれ！私が求めてたのはこれ！」ってなりました。友達にも早速おすすめしちゃいました。`
    ],
    4: [
      `仕事帰りにケイトステージラッシュ蒲田西口店へ。${menu}をしてもらったんですが、疲れてたのにすっかりリフレッシュできました。仕上がりもナチュラルで自分に似合う感じにしてもらえて嬉しかったです。また行きます！`,
      `久しぶりの${menu}、ケイトステージラッシュさんにお願いしました。私の細かい希望も聞いてくれて、理想に近い仕上がりに。店内の雰囲気も落ち着いていて、ゆったり過ごせました。`,
      `蒲田で${menu}ができるサロンを探してて見つけたお店。行ってみたら接客も丁寧だし、技術も上手で大満足でした。次の予約も入れて帰ってきました！`
    ],
    3: [
      `ケイトステージラッシュ蒲田西口店で${menu}してきました。スタッフさんが親切で、リラックスして施術を受けられました。仕上がりも綺麗で、また利用したいと思います。`,
      `${menu}でお世話になりました。丁寧なカウンセリングで安心してお任せできました。蒲田駅から近いので通いやすいのも良いですね。`,
      `初めて行きましたが、ケイトステージラッシュさんは雰囲気が良くて居心地が良かったです。${menu}の仕上がりも自然な感じで気に入っています。`
    ],
    2: [
      `${menu}でケイトステージラッシュ蒲田西口店に行きました。スタッフさんが優しく対応してくださり、施術も丁寧でした。蒲田駅からのアクセスも良いので便利です。`,
      `友達に誘われてケイトステージラッシュへ。${menu}は初体験でしたが、分かりやすく説明してもらえて安心でした。店内も清潔感があって良かったです。`
    ],
    1: [
      `蒲田西口のケイトステージラッシュさんで${menu}を体験しました。丁寧に施術していただき、ありがとうございました。駅から近くて便利な立地ですね。`,
      `${menu}でお世話になりました。スタッフさんの対応が優しくて、緊張せずに過ごせました。ケイトステージラッシュ蒲田西口店、また機会があれば伺います。`
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
