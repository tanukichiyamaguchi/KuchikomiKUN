/**
 * KATEstageLASH Review System
 * 口コミ投稿システム JavaScript
 */

// =====================================================
// Configuration (config.jsから読み込み)
// =====================================================

const CONFIG = window.CONFIG || {
    GAS_URL: '',
    GOOGLE_REVIEW_URL: 'https://g.page/r/CawIWPvYFL2vEBM/review',
    SALON_NAME: 'KATEstageLASH 蒲田西口店',
    MAX_CHARS: 500,
    MIN_CHARS: 50
};

// =====================================================
// State Management
// =====================================================

const state = {
    currentStep: 1,
    totalSteps: 4,
    ratings: {
        overall: 0,
        quality: 0,
        service: 0,
        atmosphere: 0,
        value: 0
    },
    selectedMenu: '',
    goodPoints: [],           // 良かったポイント（複数選択）
    staffIssues: [],          // スタッフ対応の問題点
    returnPossibility: '',    // 再来店の可能性
    dissatisfaction: '',      // 不満点（自由記述）
    expectation: '',          // 期待していた内容
    improvement: '',          // 改善希望
    generatedReview: '',
    editedReview: '',
    isLowRating: false        // 星2以下かどうか
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

    // Rating value displays
    qualityValue: document.getElementById('qualityValue'),
    serviceValue: document.getElementById('serviceValue'),
    atmosphereValue: document.getElementById('atmosphereValue'),
    valueValue: document.getElementById('valueValue'),

    // Step 1 buttons
    nextToStep2: document.getElementById('nextToStep2'),
    hotpepperReviewBtn: document.getElementById('hotpepperReviewBtn'),

    // Step 2 elements
    goodPointsSection: document.getElementById('goodPointsSection'),
    feedbackSection: document.getElementById('feedbackSection'),
    goodPointsButtons: document.getElementById('goodPointsButtons'),
    goodPointsButtonsLow: document.getElementById('goodPointsButtonsLow'),
    staffIssueButtons: document.getElementById('staffIssueButtons'),
    returnButtons: document.getElementById('returnButtons'),
    dissatisfactionText: document.getElementById('dissatisfactionText'),
    expectationText: document.getElementById('expectationText'),
    improvementText: document.getElementById('improvementText'),
    backToStep1FromStep2: document.getElementById('backToStep1FromStep2'),
    nextToStep3: document.getElementById('nextToStep3'),

    // Step 3 elements
    aiReviewSection: document.getElementById('aiReviewSection'),
    freeReviewSection: document.getElementById('freeReviewSection'),
    loadingContainer: document.getElementById('loadingContainer'),
    reviewEditor: document.getElementById('reviewEditor'),
    reviewText: document.getElementById('reviewText'),
    freeReviewText: document.getElementById('freeReviewText'),
    charCount: document.getElementById('charCount'),
    freeCharCount: document.getElementById('freeCharCount'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    backToStep2: document.getElementById('backToStep2'),
    nextToStep4: document.getElementById('nextToStep4'),

    // Step 4 elements
    previewContent: document.getElementById('previewContent'),
    previewStars: document.getElementById('previewStars'),
    copyReviewBtn: document.getElementById('copyReviewBtn'),
    googleReviewBtn: document.getElementById('googleReviewBtn'),
    backToStep3: document.getElementById('backToStep3'),

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
    5: '大変満足しています'
};

// =====================================================
// Review Templates (Fallback when API is not available)
// =====================================================

const reviewTemplates = {
    5: [
        '初めて{menu}を体験しましたが、スタッフさんの丁寧なカウンセリングのおかげで、理想通りの仕上がりになりました。施術中もリラックスできる雰囲気で、あっという間に終わりました。仕上がりも持ちも最高で、友達にもおすすめしたいサロンです。',
        '{menu}でお世話になりました。カウンセリングがとても丁寧で、私の希望をしっかり聞いてくださいました。技術力が高く、自然で美しい仕上がりに大満足です。店内も清潔感があり、また絶対リピートします。',
        '今まで色々なサロンを試しましたが、ここが一番良かったです。{menu}の仕上がりが素晴らしく、毎朝のメイク時間が短縮されました。スタッフさんも親切で、価格以上の価値があると思います。'
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
    initializeSelectionButtons();
    initializeReviewLinks();
    updateProgress();
    // Initialize active states on load
    updateActiveInputStates();
});

/**
 * Initialize review platform links from config
 */
function initializeReviewLinks() {
    // Set Hotpepper URL from config
    if (elements.hotpepperReviewBtn && CONFIG.HOTPEPPER_REVIEW_URL) {
        elements.hotpepperReviewBtn.href = CONFIG.HOTPEPPER_REVIEW_URL;
    }

    // Set Google URL from config (if different from default)
    if (elements.googleReviewBtn && CONFIG.GOOGLE_REVIEW_URL) {
        elements.googleReviewBtn.href = CONFIG.GOOGLE_REVIEW_URL;
    }
}

// =====================================================
// Star Rating Functions
// =====================================================

function initializeStarRatings() {
    // Initialize Hero Rating (Overall)
    initializeHeroRating();

    // Initialize Rating List Items (Detailed Ratings)
    initializeRatingListItems();

    // Fallback for old-style star ratings (if any)
    const oldStarRatings = document.querySelectorAll('.star-rating:not(.star-rating-hero)');
    oldStarRatings.forEach(rating => {
        const stars = rating.querySelectorAll('.star');
        const category = rating.dataset.category;

        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                const value = parseInt(star.dataset.value);
                setRating(category, value, rating);
            });
        });
    });
}

/**
 * Initialize Hero Rating (Overall Satisfaction)
 */
function initializeHeroRating() {
    const heroRating = document.querySelector('.star-rating-hero');
    if (!heroRating) return;

    const starBtns = heroRating.querySelectorAll('.star-btn');
    const category = heroRating.dataset.category;

    starBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const value = parseInt(btn.dataset.value);
            setHeroRating(value, heroRating);
        });

        // Hover effects
        btn.addEventListener('mouseenter', () => {
            const value = parseInt(btn.dataset.value);
            highlightHeroStars(heroRating, value);
        });

        btn.addEventListener('mouseleave', () => {
            resetHeroHighlight(heroRating, state.ratings[category]);
        });
    });
}

/**
 * Set Hero Rating value
 */
function setHeroRating(value, container) {
    state.ratings.overall = value;
    state.isLowRating = value <= 2;

    const starBtns = container.querySelectorAll('.star-btn');
    starBtns.forEach((btn, index) => {
        const btnValue = parseInt(btn.dataset.value);
        btn.classList.remove('active', 'filled');

        if (btnValue === value) {
            btn.classList.add('active');
        } else if (btnValue < value) {
            btn.classList.add('filled');
        }

        btn.setAttribute('aria-checked', btnValue === value ? 'true' : 'false');
    });

    // Update feedback text
    if (elements.overallText) {
        elements.overallText.textContent = ratingTexts[value];
    }

    validateStep1();
}

/**
 * Highlight hero stars on hover
 */
function highlightHeroStars(container, value) {
    const starBtns = container.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        const btnValue = parseInt(btn.dataset.value);
        if (btnValue <= value) {
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1.02)';
        } else {
            btn.style.opacity = '0.6';
        }
    });
}

/**
 * Reset hero star highlight
 */
function resetHeroHighlight(container, currentValue) {
    const starBtns = container.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        btn.style.opacity = '';
        btn.style.transform = '';
    });
}

/**
 * Initialize Rating List Items (Detailed Ratings with dots)
 */
function initializeRatingListItems() {
    const ratingItems = document.querySelectorAll('.rating-list-item');

    ratingItems.forEach(item => {
        const category = item.dataset.category;
        const dots = item.querySelectorAll('.rating-dot');

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                const value = parseInt(dot.dataset.value);
                setListItemRating(category, value, item);
            });

            // Hover effects
            dot.addEventListener('mouseenter', () => {
                const value = parseInt(dot.dataset.value);
                highlightDots(item, value);
            });

            dot.addEventListener('mouseleave', () => {
                resetDotHighlight(item, state.ratings[category]);
            });
        });
    });
}

/**
 * Set rating for list item
 */
function setListItemRating(category, value, container) {
    state.ratings[category] = value;

    const dots = container.querySelectorAll('.rating-dot');
    dots.forEach(dot => {
        const dotValue = parseInt(dot.dataset.value);
        dot.classList.remove('active', 'filled');

        if (dotValue === value) {
            dot.classList.add('active');
        } else if (dotValue < value) {
            dot.classList.add('filled');
        }
    });

    // Update value display
    const valueDisplay = document.getElementById(`${category}Value`);
    if (valueDisplay) {
        valueDisplay.textContent = value;
    }

    // Mark container as rated
    container.classList.add('rated');

    validateStep1();
}

/**
 * Highlight dots on hover
 */
function highlightDots(container, value) {
    const dots = container.querySelectorAll('.rating-dot');
    dots.forEach(dot => {
        const dotValue = parseInt(dot.dataset.value);
        if (dotValue <= value) {
            dot.style.borderColor = '#E8D48A';
            dot.style.background = 'rgba(201, 162, 39, 0.08)';
        }
    });
}

/**
 * Reset dot highlight
 */
function resetDotHighlight(container, currentValue) {
    const dots = container.querySelectorAll('.rating-dot');
    dots.forEach(dot => {
        const dotValue = parseInt(dot.dataset.value);
        if (!dot.classList.contains('active') && !dot.classList.contains('filled')) {
            dot.style.borderColor = '';
            dot.style.background = '';
        }
    });
}

function setRating(category, value, ratingContainer) {
    state.ratings[category] = value;

    const stars = ratingContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        const isActive = index < value;
        star.classList.toggle('active', isActive);
        star.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    // Update overall rating text
    if (category === 'overall') {
        elements.overallText.textContent = ratingTexts[value];
        state.isLowRating = value <= 2;

        // Auto-fill other ratings if not set
        Object.keys(state.ratings).forEach(key => {
            if (key !== 'overall' && state.ratings[key] === 0) {
                state.ratings[key] = value;
                const otherRating = document.querySelector(`[data-category="${key}"]`);
                if (otherRating) {
                    const otherStars = otherRating.querySelectorAll('.star');
                    otherStars.forEach((star, index) => {
                        const isActive = index < value;
                        star.classList.toggle('active', isActive);
                        star.setAttribute('aria-checked', isActive ? 'true' : 'false');
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
// Selection Buttons
// =====================================================

function initializeSelectionButtons() {
    // 良かったポイント（星3以上）
    if (elements.goodPointsButtons) {
        elements.goodPointsButtons.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleSelection(btn, 'goodPoints'));
        });
    }

    // 良かったポイント（星2以下）
    if (elements.goodPointsButtonsLow) {
        elements.goodPointsButtonsLow.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleSelection(btn, 'goodPoints'));
        });
    }

    // スタッフ対応の問題
    if (elements.staffIssueButtons) {
        elements.staffIssueButtons.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleSelection(btn, 'staffIssues'));
        });
    }

    // 再来店の可能性（単一選択）
    if (elements.returnButtons) {
        elements.returnButtons.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 単一選択: 他のボタンを解除
                elements.returnButtons.querySelectorAll('.select-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                state.returnPossibility = btn.dataset.value;
                validateStep2();
            });
        });
    }
}

function toggleSelection(btn, stateKey) {
    btn.classList.toggle('selected');
    const value = btn.dataset.value;

    if (btn.classList.contains('selected')) {
        if (!state[stateKey].includes(value)) {
            state[stateKey].push(value);
        }
    } else {
        state[stateKey] = state[stateKey].filter(v => v !== value);
    }

    validateStep2();
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

    // Step 1 -> Step 2
    elements.nextToStep2.addEventListener('click', () => goToStep(2));

    // Step 2 navigation
    elements.backToStep1FromStep2.addEventListener('click', () => goToStep(1));
    elements.nextToStep3.addEventListener('click', () => goToStep(3));

    // Step 3 navigation
    elements.backToStep2.addEventListener('click', () => goToStep(2));
    elements.nextToStep4.addEventListener('click', () => goToStep(4));

    // Step 4 navigation
    elements.backToStep3.addEventListener('click', () => goToStep(3));

    // Review text editing (AI generated)
    elements.reviewText.addEventListener('input', () => {
        state.editedReview = elements.reviewText.value;
        updateCharCount();
        validateStep3();
    });

    // Free review text editing (low rating)
    if (elements.freeReviewText) {
        elements.freeReviewText.addEventListener('input', () => {
            state.editedReview = elements.freeReviewText.value;
            updateFreeCharCount();
            validateStep3();
        });
    }

    // Feedback text inputs
    if (elements.dissatisfactionText) {
        elements.dissatisfactionText.addEventListener('input', () => {
            state.dissatisfaction = elements.dissatisfactionText.value;
            validateStep2();
        });
    }

    if (elements.expectationText) {
        elements.expectationText.addEventListener('input', () => {
            state.expectation = elements.expectationText.value;
        });
    }

    if (elements.improvementText) {
        elements.improvementText.addEventListener('input', () => {
            state.improvement = elements.improvementText.value;
        });
    }

    // Regenerate button
    elements.regenerateBtn.addEventListener('click', generateReview);

    // Copy button
    elements.copyReviewBtn.addEventListener('click', copyReviewToClipboard);

    // Google Review button - save data before redirect
    elements.googleReviewBtn.addEventListener('click', () => {
        saveToSpreadsheet();
    });

    // Hotpepper Review button - save data before redirect
    if (elements.hotpepperReviewBtn) {
        elements.hotpepperReviewBtn.addEventListener('click', () => {
            saveToSpreadsheet();
        });
    }
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
        setupStep2();
    } else if (step === 3) {
        setupStep3();
    } else if (step === 4) {
        updatePreview();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupStep2() {
    // 星の評価に応じてUIを切り替え
    if (state.isLowRating) {
        // 星2以下: フィードバックセクションを表示
        elements.goodPointsSection.style.display = 'none';
        elements.feedbackSection.style.display = 'block';
    } else {
        // 星3以上: 良かったポイント選択を表示
        elements.goodPointsSection.style.display = 'block';
        elements.feedbackSection.style.display = 'none';
    }

    validateStep2();
}

function setupStep3() {
    if (state.isLowRating) {
        // 星2以下: 自由記述のみ（AI生成なし）
        elements.aiReviewSection.style.display = 'none';
        elements.freeReviewSection.style.display = 'block';

        // 既存の入力があれば復元
        if (elements.freeReviewText && state.editedReview) {
            elements.freeReviewText.value = state.editedReview;
            updateFreeCharCount();
        }

        validateStep3();
    } else {
        // 星3以上: AI生成
        elements.aiReviewSection.style.display = 'block';
        elements.freeReviewSection.style.display = 'none';
        generateReview();
    }
}

function updateProgress() {
    const progress = (state.currentStep / state.totalSteps) * 100;
    elements.progressFill.style.width = `${progress}%`;

    // Update progress bar ARIA
    const progressBar = elements.progressFill.parentElement;
    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', Math.round(progress));
    }

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
    const allRatingsSet =
        state.ratings.overall > 0 &&
        state.ratings.quality > 0 &&
        state.ratings.service > 0 &&
        state.ratings.atmosphere > 0 &&
        state.ratings.value > 0;

    const isValid = allRatingsSet && state.selectedMenu !== '';
    elements.nextToStep2.disabled = !isValid;

    // Update active states to show next input
    updateActiveInputStates();
}

/**
 * Update active states to highlight where to input next
 */
function updateActiveInputStates() {
    const ratingHero = document.querySelector('.rating-hero');
    const ratingItems = document.querySelectorAll('.rating-list-item');
    const menuFormGroup = document.querySelector('.form-group');

    // Remove all active states first
    if (ratingHero) {
        ratingHero.classList.remove('active', 'completed');
    }
    ratingItems.forEach(item => item.classList.remove('active'));
    if (menuFormGroup) {
        menuFormGroup.classList.remove('active');
    }

    // Determine what to highlight next
    if (state.ratings.overall === 0) {
        // Overall rating not set - highlight hero
        if (ratingHero) {
            ratingHero.classList.add('active');
        }
    } else {
        // Overall is set - mark as completed
        if (ratingHero) {
            ratingHero.classList.add('completed');
        }

        // Check detailed ratings in order
        const ratingOrder = ['quality', 'service', 'atmosphere', 'value'];
        let nextRating = null;

        for (const category of ratingOrder) {
            if (state.ratings[category] === 0) {
                nextRating = category;
                break;
            }
        }

        if (nextRating) {
            // Highlight next rating item
            const nextItem = document.querySelector(`.rating-list-item[data-category="${nextRating}"]`);
            if (nextItem) {
                nextItem.classList.add('active');
            }
        } else if (state.selectedMenu === '') {
            // All ratings set, menu not selected
            if (menuFormGroup) {
                menuFormGroup.classList.add('active');
            }
        }
    }
}

function validateStep2() {
    let isValid = false;

    if (state.isLowRating) {
        // 星2以下: 不満点の記述が必須
        isValid = state.dissatisfaction.trim().length >= 10;
    } else {
        // 星3以上: 良かったポイントを1つ以上選択
        isValid = state.goodPoints.length > 0;
    }

    elements.nextToStep3.disabled = !isValid;
}

function validateStep3() {
    const text = state.editedReview.trim();
    const isValid = text.length >= CONFIG.MIN_CHARS && text.length <= CONFIG.MAX_CHARS;
    elements.nextToStep4.disabled = !isValid;
}

function updateCharCount() {
    const count = elements.reviewText.value.length;
    elements.charCount.textContent = count;

    if (count > CONFIG.MAX_CHARS) {
        elements.charCount.style.color = '#C62828';
    } else if (count < CONFIG.MIN_CHARS) {
        elements.charCount.style.color = '#F57C00';
    } else {
        elements.charCount.style.color = '#9E9E9E';
    }
}

function updateFreeCharCount() {
    if (!elements.freeReviewText || !elements.freeCharCount) return;

    const count = elements.freeReviewText.value.length;
    elements.freeCharCount.textContent = count;

    if (count > CONFIG.MAX_CHARS) {
        elements.freeCharCount.style.color = '#C62828';
    } else if (count < CONFIG.MIN_CHARS) {
        elements.freeCharCount.style.color = '#F57C00';
    } else {
        elements.freeCharCount.style.color = '#9E9E9E';
    }
}

// =====================================================
// Review Generation (GAS経由でAI生成 - JSONP方式)
// =====================================================

async function generateReview() {
    // Show loading
    elements.loadingContainer.style.display = 'block';
    elements.reviewEditor.style.display = 'none';
    elements.regenerateBtn.style.display = 'none';

    try {
        let review;

        // GAS経由でAI生成を試みる（JSONP方式）
        if (CONFIG.GAS_URL) {
            review = await generateReviewWithGAS();
        } else {
            // GAS URLが設定されていない場合はテンプレートを使用
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

        validateStep3();

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

        validateStep3();
    }
}

/**
 * GAS経由でAI口コミを生成（JSONP方式 - CORS回避）
 */
function generateReviewWithGAS() {
    return new Promise((resolve, reject) => {
        // タイムアウト設定（30秒）
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Request timeout'));
        }, 30000);

        // コールバック関数名を生成
        const callbackName = 'gasCallback_' + Date.now();

        // クリーンアップ関数
        const cleanup = () => {
            clearTimeout(timeout);
            delete window[callbackName];
            const script = document.getElementById(callbackName);
            if (script) {
                document.body.removeChild(script);
            }
        };

        // グローバルコールバック関数を設定
        window[callbackName] = (data) => {
            cleanup();
            console.log('GAS Response:', data);
            if (data && data.debug) {
                console.log('Debug info:', data.debug);
            }
            if (data && data.status === 'success' && data.review) {
                console.log('Review source:', data.source);
                resolve(data.review);
            } else {
                reject(new Error('Invalid response from GAS'));
            }
        };

        // URLパラメータを構築（良かったポイントを含める）
        const params = new URLSearchParams({
            callback: callbackName,
            action: 'generate',
            menu: state.selectedMenu,
            overall: state.ratings.overall,
            quality: state.ratings.quality,
            service: state.ratings.service,
            atmosphere: state.ratings.atmosphere,
            value: state.ratings.value,
            goodPoints: state.goodPoints.join(',')
        });

        // scriptタグを作成してJSONPリクエスト
        const script = document.createElement('script');
        script.id = callbackName;
        script.src = CONFIG.GAS_URL + '?' + params.toString();
        script.onerror = () => {
            cleanup();
            reject(new Error('Script load failed'));
        };

        document.body.appendChild(script);
    });
}

/**
 * テンプレートから口コミを生成（フォールバック）
 */
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
        updateBadgesAfterCopy();
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
            updateBadgesAfterCopy();
        } catch (err) {
            showToast('コピーに失敗しました');
        }

        document.body.removeChild(textArea);
    }
}

/**
 * Update badges after copy button is clicked
 */
function updateBadgesAfterCopy() {
    // Mark copy badge as completed
    const copyBadge = document.getElementById('copyBadge');
    if (copyBadge) {
        copyBadge.textContent = 'コピー完了';
        copyBadge.classList.add('completed');
    }

    // Show hotpepper badge
    const hotpepperBadge = document.getElementById('hotpepperBadge');
    if (hotpepperBadge) {
        hotpepperBadge.classList.remove('hidden');
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
// Spreadsheet Integration (no-cors mode)
// =====================================================

async function saveToSpreadsheet() {
    if (!CONFIG.GAS_URL) {
        console.log('GAS URL not configured');
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
        review: state.editedReview,
        goodPoints: state.goodPoints.join(', '),
        // 低評価の場合の追加情報
        isLowRating: state.isLowRating,
        dissatisfaction: state.dissatisfaction,
        expectation: state.expectation,
        improvement: state.improvement,
        staffIssues: state.staffIssues.join(', '),
        returnPossibility: state.returnPossibility
    };

    try {
        // no-corsモードで送信（レスポンスは読めないが、保存は機能する）
        await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('Data sent to spreadsheet');
    } catch (error) {
        console.error('Failed to save to spreadsheet:', error);
    }
}
