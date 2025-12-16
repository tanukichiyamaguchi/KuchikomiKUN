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
// Menu Data - Category Based
// =====================================================

const menuData = {
    lashperm: {
        name: 'まつげパーマ',
        items: [
            'まつげパーマ（パリジェンヌラッシュリフト）',
            'のびるまつげパーマ（幹細胞トリートメント付）',
            'ラッシュリフト'
        ]
    },
    eyebrow: {
        name: 'アイブロウ',
        items: [
            'アイブロウ（眉毛wax）',
            '眉毛パーマ（ハリウッドブロウリフト）',
            'メンズアイブロウ'
        ]
    },
    set: {
        name: 'セットメニュー',
        items: [
            'まつ毛パーマ＋眉毛wax',
            'のびるまつげパーマ＋眉毛wax',
            'まつ毛パーマ＋眉毛パーマ（ハリウッドブロウリフト）'
        ]
    },
    student: {
        name: '学割メニュー',
        items: [
            '学割まつげパーマ',
            '学割アイブロウ',
            '学割まつげパーマ＋眉毛wax'
        ]
    },
    other: {
        name: 'その他',
        items: [
            'お任せコース',
            'その他'
        ]
    }
};

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
    selectedCategory: '',
    userComment: '',
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
    toast: document.getElementById('toast'),
    // Menu selection elements
    categoryButtons: document.getElementById('categoryButtons'),
    menuItemsContainer: document.getElementById('menuItemsContainer'),
    menuItems: document.getElementById('menuItems'),
    backToCategories: document.getElementById('backToCategories'),
    selectedMenuDisplay: document.getElementById('selectedMenuDisplay'),
    selectedMenuValue: document.getElementById('selectedMenuValue'),
    changeMenuBtn: document.getElementById('changeMenuBtn'),
    // Rating section
    ratingSection: document.getElementById('ratingSection'),
    // Comment
    userComment: document.getElementById('userComment'),
    commentCharCount: document.getElementById('commentCharCount')
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
    initializeMenuSelection();
    initializeEventListeners();
    updateProgress();
});

// =====================================================
// Star Rating Functions with Swipe Support
// =====================================================

function initializeStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');

    starRatings.forEach(rating => {
        const stars = rating.querySelectorAll('.star');
        const category = rating.dataset.category;
        const isSwipeable = rating.classList.contains('swipeable');

        // Track touch state
        let isTouching = false;

        stars.forEach(star => {
            // Click events
            star.addEventListener('click', (e) => {
                e.preventDefault();
                const value = parseInt(star.dataset.value);
                setRating(category, value, rating);
            });

            // Keyboard support
            star.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const value = parseInt(star.dataset.value);
                    setRating(category, value, rating);
                }
            });

            // Hover effects (desktop)
            star.addEventListener('mouseenter', () => {
                if (!isTouching) {
                    const value = parseInt(star.dataset.value);
                    highlightStars(rating, value);
                }
            });

            star.addEventListener('mouseleave', () => {
                if (!isTouching) {
                    resetStarHighlight(rating, state.ratings[category]);
                }
            });
        });

        // Swipe/Slide support for touch devices
        if (isSwipeable) {
            // Touch start
            rating.addEventListener('touchstart', (e) => {
                isTouching = true;
                handleTouchMove(e, rating, category);
            }, { passive: true });

            // Touch move - slide across stars
            rating.addEventListener('touchmove', (e) => {
                handleTouchMove(e, rating, category);
            }, { passive: true });

            // Touch end
            rating.addEventListener('touchend', () => {
                isTouching = false;
            });

            // Mouse drag support (desktop)
            let isMouseDown = false;

            rating.addEventListener('mousedown', (e) => {
                isMouseDown = true;
                handleMouseMove(e, rating, category);
            });

            rating.addEventListener('mousemove', (e) => {
                if (isMouseDown) {
                    handleMouseMove(e, rating, category);
                }
            });

            rating.addEventListener('mouseup', () => {
                isMouseDown = false;
            });

            rating.addEventListener('mouseleave', () => {
                isMouseDown = false;
            });
        }
    });
}

function handleTouchMove(e, rating, category) {
    const touch = e.touches[0];
    const stars = rating.querySelectorAll('.star');

    stars.forEach(star => {
        const rect = star.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            const value = parseInt(star.dataset.value);
            setRating(category, value, rating);
        }
    });
}

function handleMouseMove(e, rating, category) {
    const stars = rating.querySelectorAll('.star');

    stars.forEach(star => {
        const rect = star.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const value = parseInt(star.dataset.value);
            setRating(category, value, rating);
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
// Menu Selection Functions
// =====================================================

function initializeMenuSelection() {
    // Category button clicks
    const categoryBtns = elements.categoryButtons.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            showMenuItems(category);
        });
    });

    // Back to categories
    elements.backToCategories.addEventListener('click', () => {
        showCategories();
    });

    // Change menu button
    elements.changeMenuBtn.addEventListener('click', () => {
        resetMenuSelection();
    });
}

function showMenuItems(category) {
    state.selectedCategory = category;
    const menuInfo = menuData[category];

    // Hide categories, show menu items
    elements.categoryButtons.style.display = 'none';
    elements.menuItemsContainer.style.display = 'block';

    // Populate menu items
    elements.menuItems.innerHTML = '';
    menuInfo.items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'menu-item-btn';
        btn.textContent = item;
        btn.addEventListener('click', () => {
            selectMenuItem(item);
        });
        elements.menuItems.appendChild(btn);
    });
}

function showCategories() {
    elements.categoryButtons.style.display = 'flex';
    elements.menuItemsContainer.style.display = 'none';
    state.selectedCategory = '';
}

function selectMenuItem(menuName) {
    state.selectedMenu = menuName;

    // Hide menu items, show selected display
    elements.categoryButtons.style.display = 'none';
    elements.menuItemsContainer.style.display = 'none';
    elements.selectedMenuDisplay.style.display = 'flex';
    elements.selectedMenuValue.textContent = menuName;

    // Auto scroll to rating section
    setTimeout(() => {
        elements.ratingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);

    validateStep1();
}

function resetMenuSelection() {
    state.selectedMenu = '';
    state.selectedCategory = '';

    elements.selectedMenuDisplay.style.display = 'none';
    elements.categoryButtons.style.display = 'flex';
    elements.menuItemsContainer.style.display = 'none';

    validateStep1();
}

// =====================================================
// Event Listeners
// =====================================================

function initializeEventListeners() {
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

    // User comment
    if (elements.userComment) {
        elements.userComment.addEventListener('input', () => {
            state.userComment = elements.userComment.value;
            updateCommentCharCount();
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
        elements.charCount.style.color = '#C62828';
    } else if (count < CONFIG.MIN_CHARS) {
        elements.charCount.style.color = '#F57C00';
    } else {
        elements.charCount.style.color = '#9E9E9E';
    }
}

function updateCommentCharCount() {
    if (elements.commentCharCount && elements.userComment) {
        const count = elements.userComment.value.length;
        elements.commentCharCount.textContent = count;
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

/**
 * GAS経由でAI口コミを生成（JSONP方式 - CORS回避）
 */
function generateReviewWithGAS() {
    return new Promise((resolve, reject) => {
        // タイムアウト設定（15秒）
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Request timeout'));
        }, 15000);

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
            if (data && data.status === 'success' && data.review) {
                resolve(data.review);
            } else {
                reject(new Error('Invalid response from GAS'));
            }
        };

        // URLパラメータを構築（ユーザーコメントを含む）
        const params = new URLSearchParams({
            callback: callbackName,
            action: 'generate',
            menu: state.selectedMenu,
            overall: state.ratings.overall,
            quality: state.ratings.quality,
            service: state.ratings.service,
            atmosphere: state.ratings.atmosphere,
            value: state.ratings.value,
            comment: state.userComment || ''
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

    let review = template.replace('{menu}', state.selectedMenu);

    // ユーザーコメントがある場合は追加
    if (state.userComment && state.userComment.trim()) {
        review += ' ' + state.userComment.trim();
    }

    return review;
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
        userComment: state.userComment,
        review: state.editedReview
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
