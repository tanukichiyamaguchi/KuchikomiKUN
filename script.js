/**
 * KATEstageLASH Review System
 * 口コミ投稿システム JavaScript
 *
 * 注意: APIキーなどの設定は config.js に記載してください
 * config.example.js をコピーして config.js を作成し、設定を入力してください
 */

// =====================================================
// Configuration (デフォルト値 - config.jsで上書き可能)
// =====================================================

// config.jsが読み込まれていない場合のデフォルト値
if (typeof CONFIG === 'undefined') {
    var CONFIG = {
        // OpenAI API Key（config.jsで設定）
        OPENAI_API_KEY: '',

        // Google Apps Script Web App URL（config.jsで設定）
        SPREADSHEET_URL: '',

        // Google Review URL
        GOOGLE_REVIEW_URL: 'https://g.page/r/CawIWPvYFL2vEBM/review',

        // Salon Info
        SALON_NAME: 'KATEstageLASH 蒲田西口店',

        // Review Settings
        MAX_CHARS: 500,
        MIN_CHARS: 50
    };
}

// =====================================================
// State Management
// =====================================================

const state = {
    currentStep: 1,
    ratings: {
        overall: 0,
        quality: 0,
        service: 0,
        atmosphere: 0,
        value: 0
    },
    selectedMenu: '',
    generatedReview: '',
    editedReview: ''
};

// =====================================================
// DOM Elements
// =====================================================

const elements = {
    progressFill: document.getElementById('progressFill'),
    steps: document.querySelectorAll('.step'),
    stepSections: document.querySelectorAll('.step-section'),
    menuSelect: document.getElementById('menuSelect'),
    overallText: document.getElementById('overallText'),
    nextToStep2: document.getElementById('nextToStep2'),
    nextToStep3: document.getElementById('nextToStep3'),
    backToStep1: document.getElementById('backToStep1'),
    backToStep2: document.getElementById('backToStep2'),
    loadingContainer: document.getElementById('loadingContainer'),
    reviewEditor: document.getElementById('reviewEditor'),
    reviewText: document.getElementById('reviewText'),
    charCount: document.getElementById('charCount'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    previewContent: document.getElementById('previewContent'),
    previewStars: document.getElementById('previewStars'),
    copyReviewBtn: document.getElementById('copyReviewBtn'),
    googleReviewBtn: document.getElementById('googleReviewBtn'),
    toast: document.getElementById('toast')
};

// =====================================================
// Rating Texts
// =====================================================

const ratingTexts = {
    1: '改善の余地があります',
    2: 'もう少し頑張ってほしいです',
    3: '普通でした',
    4: '満足しています',
    5: '大変満足しています！'
};

// =====================================================
// Review Templates (Fallback when API is not available)
// =====================================================

const reviewTemplates = {
    5: [
        '初めて{menu}を体験しましたが、スタッフさんの丁寧なカウンセリングのおかげで、理想通りの仕上がりになりました！施術中もリラックスできる雰囲気で、あっという間に終わりました。仕上がりも持ちも最高で、友達にもおすすめしたいサロンです。',
        '{menu}でお世話になりました。カウンセリングがとても丁寧で、私の希望をしっかり聞いてくださいました。技術力が高く、自然で美しい仕上がりに大満足です！店内も清潔感があり、また絶対リピートします。',
        '今まで色々なサロンを試しましたが、ここが一番良かったです！{menu}の仕上がりが素晴らしく、毎朝のメイク時間が短縮されました。スタッフさんも親切で、価格以上の価値があると思います。'
    ],
    4: [
        '{menu}を受けました。スタッフさんの対応も良く、仕上がりも綺麗で満足しています。駅からも近くて通いやすいので、また利用したいと思います。',
        '丁寧なカウンセリングで安心してお任せできました。{menu}の仕上がりも良く、友人にも褒められました。次回も同じスタッフさんにお願いしたいです。',
        '初めての来店でしたが、スタッフさんが親切に説明してくださり、リラックスして施術を受けられました。{menu}の仕上がりも満足です。'
    ],
    3: [
        '{menu}を体験しました。スタッフさんの対応は丁寧で、仕上がりも悪くないと思います。また機会があれば利用したいです。',
        '予約通りの時間で施術していただきました。{menu}の仕上がりは期待通りでした。普通に良いサロンだと思います。',
        '{menu}で伺いました。カウンセリングもしっかりしていて、施術も丁寧でした。特に不満はありませんでした。'
    ],
    2: [
        '{menu}を受けました。もう少しカウンセリングに時間をかけていただけると、より希望に近い仕上がりになったかもしれません。',
        '施術自体は問題なかったのですが、思っていた仕上がりと少し違いました。次回はもっと詳しく希望を伝えてみようと思います。'
    ],
    1: [
        '今回の{menu}は期待していた仕上がりではありませんでした。もう少しカウンセリングで希望を聞いていただきたかったです。',
        '残念ながら今回は満足できる仕上がりではありませんでした。改善を期待しています。'
    ]
};

// =====================================================
// Initialize
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStarRatings();
    initializeEventListeners();
    updateProgress();
});

// =====================================================
// Star Rating Functions
// =====================================================

function initializeStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');

    starRatings.forEach(rating => {
        const stars = rating.querySelectorAll('.star');
        const category = rating.dataset.category;

        stars.forEach(star => {
            // Touch/Click events
            star.addEventListener('click', (e) => {
                e.preventDefault();
                const value = parseInt(star.dataset.value);
                setRating(category, value, rating);
            });

            // Hover effects (desktop)
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                highlightStars(rating, value);
            });

            star.addEventListener('mouseleave', () => {
                resetStarHighlight(rating, state.ratings[category]);
            });
        });
    });
}

function setRating(category, value, ratingContainer) {
    state.ratings[category] = value;

    const stars = ratingContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    // Update overall rating text
    if (category === 'overall') {
        elements.overallText.textContent = ratingTexts[value];

        // Auto-fill other ratings if not set
        Object.keys(state.ratings).forEach(key => {
            if (key !== 'overall' && state.ratings[key] === 0) {
                state.ratings[key] = value;
                const otherRating = document.querySelector(`[data-category="${key}"]`);
                if (otherRating) {
                    const otherStars = otherRating.querySelectorAll('.star');
                    otherStars.forEach((star, index) => {
                        if (index < value) {
                            star.classList.add('active');
                        }
                    });
                }
            }
        });
    }

    validateStep1();
}

function highlightStars(container, value) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('hover');
        } else {
            star.classList.remove('hover');
        }
    });
}

function resetStarHighlight(container, currentValue) {
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('hover');
    });
}

// =====================================================
// Event Listeners
// =====================================================

function initializeEventListeners() {
    // Menu selection
    elements.menuSelect.addEventListener('change', () => {
        state.selectedMenu = elements.menuSelect.value;
        validateStep1();
    });

    // Navigation buttons
    elements.nextToStep2.addEventListener('click', () => goToStep(2));
    elements.nextToStep3.addEventListener('click', () => goToStep(3));
    elements.backToStep1.addEventListener('click', () => goToStep(1));
    elements.backToStep2.addEventListener('click', () => goToStep(2));

    // Review text editing
    elements.reviewText.addEventListener('input', () => {
        state.editedReview = elements.reviewText.value;
        updateCharCount();
        validateStep2();
    });

    // Regenerate button
    elements.regenerateBtn.addEventListener('click', generateReview);

    // Copy button
    elements.copyReviewBtn.addEventListener('click', copyReviewToClipboard);

    // Google Review button - save data before redirect
    elements.googleReviewBtn.addEventListener('click', () => {
        saveToSpreadsheet();
    });
}

// =====================================================
// Step Navigation
// =====================================================

function goToStep(step) {
    state.currentStep = step;

    // Update sections
    elements.stepSections.forEach((section, index) => {
        if (index + 1 === step) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Update progress
    updateProgress();

    // Step-specific actions
    if (step === 2) {
        generateReview();
    } else if (step === 3) {
        updatePreview();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
    const progress = (state.currentStep / 3) * 100;
    elements.progressFill.style.width = `${progress}%`;

    elements.steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 === state.currentStep) {
            step.classList.add('active');
        } else if (index + 1 < state.currentStep) {
            step.classList.add('completed');
        }
    });
}

// =====================================================
// Validation
// =====================================================

function validateStep1() {
    const isValid = state.ratings.overall > 0 && state.selectedMenu !== '';
    elements.nextToStep2.disabled = !isValid;
}

function validateStep2() {
    const text = state.editedReview.trim();
    const isValid = text.length >= CONFIG.MIN_CHARS && text.length <= CONFIG.MAX_CHARS;
    elements.nextToStep3.disabled = !isValid;
}

function updateCharCount() {
    const count = elements.reviewText.value.length;
    elements.charCount.textContent = count;

    if (count > CONFIG.MAX_CHARS) {
        elements.charCount.style.color = '#F44336';
    } else if (count < CONFIG.MIN_CHARS) {
        elements.charCount.style.color = '#FF9800';
    } else {
        elements.charCount.style.color = '#9E9E9E';
    }
}

// =====================================================
// Review Generation
// =====================================================

async function generateReview() {
    // Show loading
    elements.loadingContainer.style.display = 'block';
    elements.reviewEditor.style.display = 'none';
    elements.regenerateBtn.style.display = 'none';

    try {
        let review;

        // Try API first
        if (CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE') {
            review = await generateReviewWithAPI();
        } else {
            // Use fallback templates
            review = generateReviewFromTemplate();
        }

        state.generatedReview = review;
        state.editedReview = review;

        // Show editor
        elements.reviewText.value = review;
        updateCharCount();

        elements.loadingContainer.style.display = 'none';
        elements.reviewEditor.style.display = 'block';
        elements.regenerateBtn.style.display = 'block';

        validateStep2();

    } catch (error) {
        console.error('Review generation error:', error);

        // Fallback to template
        const review = generateReviewFromTemplate();
        state.generatedReview = review;
        state.editedReview = review;

        elements.reviewText.value = review;
        updateCharCount();

        elements.loadingContainer.style.display = 'none';
        elements.reviewEditor.style.display = 'block';
        elements.regenerateBtn.style.display = 'block';

        validateStep2();
    }
}

async function generateReviewWithAPI() {
    const prompt = createReviewPrompt();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
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
        throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

function createReviewPrompt() {
    const { overall, quality, service, atmosphere, value } = state.ratings;

    return `以下の評価に基づいて、眉毛まつ毛サロン「${CONFIG.SALON_NAME}」の口コミを作成してください。

施術メニュー: ${state.selectedMenu}
総合満足度: ${overall}点/5点
施術の仕上がり: ${quality}点/5点
接客・カウンセリング: ${service}点/5点
店内の雰囲気: ${atmosphere}点/5点
価格・コスパ: ${value}点/5点

${overall >= 4 ? '満足した点を具体的に褒める内容で' : overall >= 3 ? '良かった点と感想を含めて' : '改善を期待する控えめな内容で'}、口コミを作成してください。`;
}

function generateReviewFromTemplate() {
    const rating = state.ratings.overall;
    const templates = reviewTemplates[rating] || reviewTemplates[3];
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template.replace('{menu}', state.selectedMenu);
}

// =====================================================
// Preview
// =====================================================

function updatePreview() {
    elements.previewContent.textContent = state.editedReview;
    elements.previewStars.textContent = '★'.repeat(state.ratings.overall) + '☆'.repeat(5 - state.ratings.overall);
}

// =====================================================
// Copy to Clipboard
// =====================================================

async function copyReviewToClipboard() {
    try {
        await navigator.clipboard.writeText(state.editedReview);
        showToast('口コミをコピーしました');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = state.editedReview;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            showToast('口コミをコピーしました');
        } catch (err) {
            showToast('コピーに失敗しました');
        }

        document.body.removeChild(textArea);
    }
}

// =====================================================
// Toast Notification
// =====================================================

function showToast(message) {
    const toastMessage = elements.toast.querySelector('.toast-message');
    toastMessage.textContent = message;

    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2500);
}

// =====================================================
// Spreadsheet Integration
// =====================================================

async function saveToSpreadsheet() {
    if (!CONFIG.SPREADSHEET_URL || CONFIG.SPREADSHEET_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.log('Spreadsheet URL not configured');
        return;
    }

    const data = {
        timestamp: new Date().toISOString(),
        menu: state.selectedMenu,
        overallRating: state.ratings.overall,
        qualityRating: state.ratings.quality,
        serviceRating: state.ratings.service,
        atmosphereRating: state.ratings.atmosphere,
        valueRating: state.ratings.value,
        review: state.editedReview
    };

    try {
        await fetch(CONFIG.SPREADSHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('Data saved to spreadsheet');
    } catch (error) {
        console.error('Failed to save to spreadsheet:', error);
    }
}
