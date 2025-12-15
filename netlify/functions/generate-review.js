/**
 * Netlify Function: 口コミ生成API
 * OpenAI APIキーを安全にサーバーサイドで使用
 */

exports.handler = async (event, context) => {
    // CORSヘッダー
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // OPTIONSリクエスト（CORS preflight）
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // POSTのみ許可
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { menu, ratings } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        const prompt = createPrompt(menu, ratings);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `あなたは美容サロンの口コミを作成するアシスタントです。
お客様の満足度に基づいて、自然で具体的な口コミを生成してください。
口コミは日本語で、100〜200文字程度で作成してください。
絵文字は使用せず、丁寧な言葉遣いで書いてください。`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API request failed');
        }

        const data = await response.json();
        const review = data.choices[0].message.content.trim();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ review })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function createPrompt(menu, ratings) {
    const { overall, quality, service, atmosphere, value } = ratings;

    return `以下の評価に基づいて、眉毛まつ毛サロン「KATEstageLASH 蒲田西口店」の口コミを作成してください。

施術メニュー: ${menu}
総合満足度: ${overall}点/5点
施術の仕上がり: ${quality}点/5点
接客・カウンセリング: ${service}点/5点
店内の雰囲気: ${atmosphere}点/5点
価格・コスパ: ${value}点/5点

${overall >= 4 ? '満足した点を具体的に褒める内容で' : overall >= 3 ? '良かった点と感想を含めて' : '改善を期待する控えめな内容で'}、口コミを作成してください。`;
}
